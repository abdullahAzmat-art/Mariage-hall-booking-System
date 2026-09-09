/**
 * AI RANKER NODE
 * ──────────────────────────────────────────────────────────────
 * Evaluates candidate halls returned by MongoDB and ranks them
 * from best match to lowest match based on user preferences.
 *
 * Architecture:
 * 1. Takes original question, extracted requirements, and candidate halls.
 * 2. LLM evaluates candidates and outputs structured ranking (Zod-validated):
 *    - Prioritizes explicit requirements, capacity fit, budget fit (if given),
 *      amenities/menu match, rating and overall suitability.
 *    - Strictly forbidden from inventing hall data or rejecting candidates.
 * 3. Pure JavaScript maps LLM ranking back to the original MongoDB hall
 *    objects, attaches matchScore and matchReason, and saves them in state.halls.
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

import { z } from "zod";
import { ChatOpenRouter } from "../lib/ChatOpenRouter.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

// ─────────────────────────────────────────────────────────────
// 1. ZOD SCHEMA — strictly defines the structured ranking output
// ─────────────────────────────────────────────────────────────
export const RankedHallItemSchema = z.object({
  hallId: z
    .string()
    .describe("The exact identifier or _id of the candidate hall from the input list"),

  rank: z
    .number()
    .describe("1-based rank position, 1 being the best match"),

  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Match percentage score between 0 and 100 based on how well it fits user requirements"),

  matchReason: z
    .string()
    .describe("1-2 concise sentences explaining why this hall fits at this rank"),
});

export const RankerOutputSchema = z.object({
  rankedHalls: z
    .array(RankedHallItemSchema)
    .describe(
      "All candidate halls ordered strictly from best match (rank 1) to lowest match. MUST include every candidate hall provided."
    ),

  summary: z
    .string()
    .describe(
      "A polite, natural-language response presenting the ranked halls and explaining why the top choices best suit the user's needs."
    ),
});

// ─────────────────────────────────────────────────────────────
// 2. LLM — structured ranker model
// ─────────────────────────────────────────────────────────────
const rawModel = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0,
});

const structuredRanker = rawModel.withStructuredOutput(RankerOutputSchema, {
  name: "rank_candidate_halls",
});

// ─────────────────────────────────────────────────────────────
// 3. SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the AI Venue Ranker for Venuora, a marriage hall booking platform.
Your job is to evaluate candidate halls returned from the database and rank them from best match to lowest match.

Ranking Priorities (in order):
1. Explicit user requirements (specific location/neighborhood, must-have features).
2. Capacity fit (venues closer to the requested capacity are ranked higher than venues with huge unnecessary excess capacity).
3. Budget fit if provided (venues comfortably within budget). If the user did NOT provide a budget, DO NOT assume one or penalize halls for price.
4. Amenities and menu preferences (venues having more matching features or desired catering).
5. Rating and overall suitability (higher customer rating and review counts break ties).

STRICT RULES:
• Do NOT invent or modify any hall data (names, capacities, prices, amenities).
• Do NOT reject or drop any candidate halls. Every candidate provided MUST appear in rankedHalls.
• Order rankedHalls strictly from best match (rank 1) to lowest match.
• Write a clear, polite summary highlighting the top choices for the user.`;

// ─────────────────────────────────────────────────────────────
// 4. AI RANKER NODE FUNCTION
// ─────────────────────────────────────────────────────────────
/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Promise<Partial<import('../graph/state.js').VenuoraState>>}
 */
export async function aiRankerNode(state) {
  const question = state.question || state.userQuery || "";
  const requirements = state.requirements || {};
  const candidateHalls = state.halls || [];

  console.log(`\n🏆 [AI_RANKER] Evaluating ${candidateHalls.length} candidate hall(s)...`);

  // ── Edge Case: No candidate halls ───────────────────────────
  if (candidateHalls.length === 0) {
    console.log("🏆 [AI_RANKER] 0 candidate halls to rank.");
    const noMatchAnswer =
      "No halls currently match all your requested criteria. Would you like to adjust your filters (e.g. broaden location, flexible capacity, or adjust budget)?";

    return {
      halls: [],
      answer: noMatchAnswer,
      rankerOutput: "No candidates to rank.",
    };
  }

  // ── Edge Case: Exactly 1 candidate hall ─────────────────────
  if (candidateHalls.length === 1) {
    console.log("🏆 [AI_RANKER] Only 1 candidate hall — formatting directly.");
    const single = candidateHalls[0];
    const enriched = [
      {
        ...single,
        rank: 1,
        matchScore: 95,
        matchReason: "Direct match for your requested criteria.",
      },
    ];

    const answer =
      `I found 1 hall matching your requirements:\n\n` +
      `1. **${single.name}** (${single.location})\n` +
      `   • Capacity: ${single.capacity} guests\n` +
      `   • Base Seat Price: PKR ${single.price?.toLocaleString()} / head\n` +
      `   • Amenities: ${single.amenities?.length ? single.amenities.join(", ") : "Standard"}\n` +
      `   • Rating: ${single.rating || 4.5} ⭐ (${single.reviews || 0} reviews)\n\n` +
      `This venue directly matches your search criteria!`;

    return {
      halls: enriched,
      answer,
      rankerOutput: JSON.stringify({ rankedCount: 1, top: single.name }),
    };
  }            

  // ── Prepare Candidates Summary for LLM ──────────────────────
  const candidatesPayload = candidateHalls.map((h, idx) => ({
    hallId: String(h._id || idx + 1),
    name: h.name,
    location: h.location,
    capacity: h.capacity,
    pricePerHead: h.price,
    amenities: h.amenities || [],
    rating: h.rating || 4.5,
    reviews: h.reviews || 0,
    menuItems: (h.menu || []).map((m) => m.name),
  }));

  const userPrompt =
    `User Question: "${question}"\n\n` +
    `Extracted Requirements:\n${JSON.stringify(requirements, null, 2)}\n\n` +
    `Candidate Halls from Database:\n${JSON.stringify(candidatesPayload, null, 2)}\n\n` +
    `Please evaluate and rank all ${candidatesPayload.length} candidate halls from best match to lowest match.`;

  // ── Call LLM for Structured Ranking ─────────────────────────
  let parsed;
  try {
    parsed = await structuredRanker.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(userPrompt),
    ]);
    console.log(`🏆 [AI_RANKER] Successfully ranked ${parsed.rankedHalls?.length || 0} halls.`);
  } catch (err) {
    console.error("❌ [AI_RANKER] Structured ranking failed:", err.message);
    // Safe fallback: preserve original order by rating
    parsed = {
      rankedHalls: candidateHalls.map((h, i) => ({
        hallId: String(h._id || i + 1),
        rank: i + 1,
        matchScore: 80 - i * 5,
        matchReason: "Matched database search criteria.",
      })),
      summary: `I found ${candidateHalls.length} halls matching your criteria.`,
    };
  }

  // ── Reorder Original Hall Objects (Preserves Data Integrity) ─
  const rankMap = new Map();
  if (Array.isArray(parsed.rankedHalls)) {
    parsed.rankedHalls.forEach((item) => {
      rankMap.set(String(item.hallId), item);
    });
  }

  // Sort candidate halls by LLM-assigned rank
  const rankedHalls = [...candidateHalls].sort((a, b) => {
    const idA = String(a._id || candidateHalls.indexOf(a) + 1);
    const idB = String(b._id || candidateHalls.indexOf(b) + 1);
    const rankA = rankMap.get(idA)?.rank ?? 999;
    const rankB = rankMap.get(idB)?.rank ?? 999;
    return rankA - rankB;
  });

  // Attach matchScore, matchReason, and rank to each hall object
  const enrichedHalls = rankedHalls.map((hall, idx) => {
    const hallId = String(hall._id || candidateHalls.indexOf(hall) + 1);
    const rankInfo = rankMap.get(hallId);
    return {
      ...hall,
      rank: rankInfo?.rank ?? idx + 1,
      matchScore: rankInfo?.matchScore ?? Math.max(90 - idx * 5, 50),
      matchReason: rankInfo?.matchReason ?? "Matches your search criteria.",
    };
  });

  return {
    halls: enrichedHalls,
    answer: parsed.summary,
    rankerOutput: JSON.stringify({
      rankings: parsed.rankedHalls,
      topPick: enrichedHalls[0]?.name,
    }),
  };
}
