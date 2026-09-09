/**
 * EVALUATOR NODE
 * ──────────────────────────────────────────────────────────────
 * Entry point of the Venuora-AI workflow.
 *
 * Responsibilities:
 *  1. Receives the user's question from state.
 *  2. Calls the LLM (OpenRouter → nvidia/nemotron) with a
 *     classification prompt.
 *  3. Forces a STRUCTURED output via Zod — the LLM MUST return:
 *        {
 *          intent  : "rag" | "calculation" | "check_halls"
 *          reasoning: string   ← why the model chose this intent
 *        }
 *  4. Zod validates the shape at runtime → no more fragile string parsing.
 *  5. Writes { intent, route, evaluatorOutput } back to state.
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

// Load the backend root .env (two levels up from nodes/)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

import { z }                              from "zod";
import { ChatOpenRouter }                 from "../lib/ChatOpenRouter.js";
import { SystemMessage, HumanMessage }   from "@langchain/core/messages";

// ─────────────────────────────────────────────────────────────
// 1. ZOD SCHEMA  — the ONLY shape the LLM is allowed to return
// ─────────────────────────────────────────────────────────────
export const EvaluatorOutputSchema = z.object({
  intent: z
    .enum(["rag", "calculation", "check_halls"])
    .describe(
      'One of: "rag" (general info/FAQ), "calculation" (price/cost/budget), "check_halls" (availability/booking)'
    ),

  reasoning: z
    .string()
    .describe("One short sentence explaining why you chose this intent."),
});

// ─────────────────────────────────────────────────────────────
// 2. LLM — raw model
// ─────────────────────────────────────────────────────────────
const rawModel = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0,
});

// ─────────────────────────────────────────────────────────────
// 3. STRUCTURED MODEL — wraps rawModel with Zod schema
//    LangChain will inject the JSON schema into the request and
//    automatically parse + validate the response with Zod.
// ─────────────────────────────────────────────────────────────
const structuredModel = rawModel.withStructuredOutput(EvaluatorOutputSchema, {
  name: "classify_intent",   // tool / function name shown to the model
});

// ─────────────────────────────────────────────────────────────
// 4. SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an intent classifier for Venuora, a marriage hall booking platform.

Classify the user's question into EXACTLY one of these intents:

  rag          → General Venuora knowledge or FAQ
  calculation  → Mathematical calculation
  check_halls  → Searching or filtering event halls

Rules:
  - Questions asking for halls, venues, capacity, location, budget, date,
    guests, amenities, menu, or availability → check_halls
  - Mathematical questions → calculation
  - General knowledge about Venuora → rag
  - If unsure, default to "rag".
  - Your "reasoning" field must be one short sentence.

Examples:
  "What services do you offer?"                        → rag
  "Tell me about your decoration packages"             → rag
  "How much does it cost for 300 guests?"              → calculation
  "What is 500 multiplied by 1500?"                   → calculation
  "Find me a hall in Lahore"                           → check_halls
  "I need a venue for 500 guests under 2 lakh"        → check_halls
  "Show me halls with parking and AC"                  → check_halls
  "Is there a hall available on December 15?"          → check_halls
  "I want a hall for my wedding with a buffet menu"    → check_halls`;

// ─────────────────────────────────────────────────────────────
// 5. NODE FUNCTION
// ─────────────────────────────────────────────────────────────
/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Promise<Partial<import('../graph/state.js').VenuoraState>>}
 */
export async function evaluatorNode(state) {
  const question = state.question || state.userQuery || "";

  console.log("\n🧠 [EVALUATOR] Question :", question);
  console.log("🧠 [EVALUATOR] Calling LLM with structured output (Zod)...");

  // ── STRUCTURED LLM CALL ─────────────────────────────────────
  /** @type {{ intent: string, reasoning: string }} */
  let parsed;

  try {
    parsed = await structuredModel.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(question),
    ]);

    // Zod has already validated the shape — if we reach here it's safe
    console.log("🧠 [EVALUATOR] Intent    :", parsed.intent);
    console.log("🧠 [EVALUATOR] Reasoning :", parsed.reasoning);

  } catch (err) {
    // Covers both network errors AND Zod validation failures
    console.error("❌ [EVALUATOR] Structured call failed:", err.message);
    parsed = { intent: "rag", reasoning: "Fallback due to LLM/network error." };
  }

  return {
    intent:          parsed.intent,
    route:           parsed.intent,   // mirrors intent → used by conditional edge
    evaluatorOutput: parsed.reasoning,
  };
}
