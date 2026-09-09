/**
 * CHECK HALLS NODE
 * ──────────────────────────────────────────────────────────────
 * Searches and checks hall availability based on user requirements.
 *
 * Architecture:
 * 1. The LLM is used STRICTLY for structured requirement extraction
 *    via LangChain's withStructuredOutput(HallRequirementsSchema).
 *    The LLM NEVER generates MongoDB queries or database code.
 * 2. Pure JavaScript deterministically constructs the MongoDB query:
 *    - Independent criteria work as AND (top-level properties).
 *    - Multiple required amenities use MongoDB $all; alternatives use $in.
 *    - Menu is filtered ONLY if the user explicitly requests items.
 *    - Flexible capacity uses a reasonable ±20% range for "around".
 *    - Hall.price is treated as per-seat pricing (budget / capacity).
 * 3. Mongoose executes the query and returns matching halls to state.
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

import { z } from "zod";
import mongoose from "mongoose";
import { ChatOpenRouter } from "../lib/ChatOpenRouter.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import HallModel from "../../models/hallModel.js";

const Hall = HallModel.default || HallModel;

// ─────────────────────────────────────────────────────────────
// 1. ZOD SCHEMA — strictly defines extracted user requirements
// ─────────────────────────────────────────────────────────────
export const HallRequirementsSchema = z.object({
  location: z
    .string()
    .nullable()
    .describe("City, area, or locality of the hall (e.g., 'Lahore', 'Gulberg'). Return null if not specified."),

  capacity: z
    .number()
    .nullable()
    .describe("Target number of guests / attendees (e.g., 350). Return null if not specified."),

  capacityType: z
    .enum(["minimum", "around", "exact"])
    .nullable()
    .describe(
      "Capacity preference: 'around' (e.g., 'around 350', 'approx 350', '~350'), 'minimum' (e.g., 'at least 300', 'min 300', '300+'), 'exact' (e.g., 'exactly 500', 'strictly 500'), or null if no capacity is mentioned."
    ),

  budget: z
    .number()
    .nullable()
    .describe(
      "Budget amount in PKR as a numeric value (e.g., '2 lakh' -> 200000, '50k' -> 50000, '1500 per head' -> 1500). Return null if not specified."
    ),

  date: z
    .string()
    .nullable()
    .describe("Requested event/booking date formatted as YYYY-MM-DD. Return null if not specified."),

  amenities: z
    .array(z.string())
    .default([])
    .describe(
      "List of requested venue amenities in lowercase (e.g., ['parking', 'ac', 'bridal room', 'valet']). Empty array if none mentioned."
    ),

  menu: z
    .array(z.string())
    .default([])
    .describe(
      "List of explicitly requested food dishes, catering items, or cuisines in lowercase (e.g., ['biryani', 'bbq']). Return [] unless user explicitly requests specific food items."
    ),
});

// ─────────────────────────────────────────────────────────────
// 2. LLM — structured extraction model
// ─────────────────────────────────────────────────────────────
const rawModel = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0,
});

const structuredModel = rawModel.withStructuredOutput(HallRequirementsSchema, {
  name: "extract_hall_requirements",
});

// ─────────────────────────────────────────────────────────────
// 3. SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert requirement extraction assistant for Venuora, a marriage hall booking platform.
Your ONLY job is to extract the user's hall requirements into the structured format.
DO NOT generate MongoDB queries, database filters, or search code.

Extraction Rules:
• location: City, town, or area (e.g., "Lahore", "Gulberg", "Islamabad"). Return null if not specified.
• capacity: Target guest count as an integer. Return null if not specified.
• capacityType:
  - "around": If user says "around 350", "about 350", "approx 350", "~350", "nearly 350".
  - "minimum": If user says "at least 300", "min 300", "300+", "minimum 300", "more than 300".
  - "exact": If user says "exact 500", "strictly 500", "for 500 people".
  - null: If no capacity is mentioned.
• budget: Budget amount in PKR as a numeric value:
  - "2 lakh" or "2 lac" = 200000
  - "1.5 lakh" = 150000
  - "1 crore" = 10000000
  - "50k" = 50000
  - "1500 per head" = 1500
  - Return null if no budget mentioned.
• date: Specific event date formatted as YYYY-MM-DD if mentioned; otherwise null.
• amenities: List of requested venue amenities (e.g., "parking", "ac", "bridal room", "valet", "generator"). Output as an array of lowercase strings. Return [] if none mentioned.
• menu: ONLY extract menu items if the user EXPLICITLY mentions specific food dishes, cuisines, or catering items (e.g., "biryani", "mutton", "bbq", "chinese"). If the user does not explicitly request specific food or menu items, return an empty array [].

Example:
User: "I need a hall in Lahore for around 350 people with parking under 2 lakh."
Output:
{
  "location": "Lahore",
  "capacity": 350,
  "capacityType": "around",
  "budget": 200000,
  "date": null,
  "amenities": ["parking"],
  "menu": []
}`;

// ─────────────────────────────────────────────────────────────
// 4. PURE JAVASCRIPT QUERY BUILDER (Safe & Deterministic)
// ─────────────────────────────────────────────────────────────
/**
 * Safely escapes regular expression special characters to prevent ReDoS.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a deterministic MongoDB query from extracted requirements.
 *
 * Rules:
 * 1. Independent requirements combine as logical AND (top-level properties).
 * 2. Amenities:
 *    - Uses MongoDB $all when multiple amenities are required (e.g. parking AND AC).
 *    - Uses $in when alternatives are requested (e.g. parking OR valet).
 * 3. Menu:
 *    - Only filters the menu field when the user explicitly requests specific menu items.
 * 4. Capacity:
 *    - "around": ±20% flexible range around the target.
 *    - "minimum": at least the target ($gte).
 *    - "exact": exact match.
 * 5. Budget:
 *    - Hall.price represents base price per seat / per head.
 *    - If total event budget is provided (budget > 10,000) alongside capacity,
 *      converts to maximum per-seat rate: Math.floor(budget / capacity).
 *    - If budget is per-head (budget <= 10,000), filters price <= budget directly.
 * 6. Date:
 *    - Checks availability: { bookedDates: { $nin: [date] } }.
 *
 * @param {object} req - Extracted requirements
 * @param {string} [rawQuestion=""] - Original user question for alternative detection
 * @returns {object} Safe MongoDB query filter
 */
export function buildHallQuery(req = {}, rawQuestion = "") {
  const query = {};

  // 1. Location (AND across fields; $in if multiple alternatives specified)
  if (req.location && typeof req.location === "string" && req.location.trim()) {
    const locParts = req.location
      .split(/\s*(?:,|\||\bor\b)\s*/i)
      .map((l) => l.trim())
      .filter(Boolean);

    if (locParts.length > 1) {
      query.location = { $in: locParts.map((l) => new RegExp(escapeRegex(l), "i")) };
    } else if (locParts.length === 1) {
      query.location = { $regex: escapeRegex(locParts[0]), $options: "i" };
    }
  }

  // 2. Capacity (AND across fields; reasonable range for 'around')
  if (typeof req.capacity === "number" && !isNaN(req.capacity) && req.capacity > 0) {
    if (req.capacityType === "around") {
      // ±20% flexible range
      query.capacity = {
        $gte: Math.floor(req.capacity * 0.8),
        $lte: Math.ceil(req.capacity * 1.2),
      };
    } else if (req.capacityType === "exact") {
      query.capacity = req.capacity;
    } else {
      // 'minimum' or default fallback: venue must host at least requested count
      query.capacity = { $gte: req.capacity };
    }
  }

  // 3. Budget (Hall.price = base per-seat / per-head price)
  if (typeof req.budget === "number" && !isNaN(req.budget) && req.budget > 0) {
    if (req.capacity && req.capacity > 0 && req.budget > 10000) {
      // Total event budget: calculate maximum allowable per-seat rate
      const maxPerSeatPrice = Math.floor(req.budget / req.capacity);
      query.price = { $lte: maxPerSeatPrice };
    } else {
      // Direct per-seat rate (e.g. <= 10000) or standalone budget
      query.price = { $lte: req.budget };
    }
  }

  // 4. Date Availability (AND across fields)
  if (req.date && typeof req.date === "string" && req.date.trim()) {
    query.bookedDates = { $nin: [req.date.trim()] };
  }

  // 5. Amenities
  // Use $all when user requires ALL amenities; use $in when alternatives are requested
  if (Array.isArray(req.amenities) && req.amenities.length > 0) {
    const validAmenities = req.amenities
      .filter((a) => typeof a === "string" && a.trim())
      .map((a) => new RegExp(escapeRegex(a.trim()), "i"));

    if (validAmenities.length > 0) {
      if (validAmenities.length === 1) {
        query.amenities = { $in: validAmenities };
      } else {
        // Check if user explicitly requested alternatives (e.g. "parking OR valet")
        const isAlternative = /\b(or|either)\b/i.test(rawQuestion);
        if (isAlternative) {
          query.amenities = { $in: validAmenities };
        } else {
          // User requires ALL listed amenities (e.g. parking AND AC)
          query.amenities = { $all: validAmenities };
        }
      }
    }
  }

  // 6. Menu: ONLY filter menu when user explicitly requests specific menu items
  if (Array.isArray(req.menu) && req.menu.length > 0) {
    const validMenu = req.menu
      .filter((m) => typeof m === "string" && m.trim())
      .map((m) => new RegExp(escapeRegex(m.trim()), "i"));

    if (validMenu.length > 0) {
      query["menu.name"] = { $in: validMenu };
    }
  }

  return query;
}

// ─────────────────────────────────────────────────────────────
// 5. DATABASE CONNECTION HELPER
// ─────────────────────────────────────────────────────────────
async function ensureDbConnected() {
  if (mongoose.connection.readyState === 0 && process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

// ─────────────────────────────────────────────────────────────
// 6. CHECK HALLS NODE FUNCTION
// ─────────────────────────────────────────────────────────────
/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Promise<Partial<import('../graph/state.js').VenuoraState>>}
 */
export async function checkHallsNode(state) {
  const question = state.question || state.userQuery || "";
  console.log("\n🏛️  [CHECK_HALLS] Handling question:", question);

  // ── 1. LLM EXTRACTION (Structured) ─────────────────────────
  let requirements;
  try {
    requirements = await structuredModel.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(question),
    ]);
    console.log("🏛️  [CHECK_HALLS] Extracted requirements:", JSON.stringify(requirements, null, 2));
  } catch (err) {
    console.error("❌ [CHECK_HALLS] LLM extraction failed:", err.message);
    requirements = {
      location: null,
      capacity: null,
      capacityType: null,
      budget: null,
      date: null,
      amenities: [],
      menu: [],
    };
  }

  // ── 2. SAFE JAVASCRIPT QUERY CONSTRUCTION ──────────────────
  const mongoQuery = buildHallQuery(requirements, question);
  console.log("🏛️  [CHECK_HALLS] Generated MongoDB query:", JSON.stringify(mongoQuery, (k, v) => (v instanceof RegExp ? v.toString() : v), 2));

  // ── 3. DATABASE EXECUTION ──────────────────────────────────
  let halls = [];
  try {
    await ensureDbConnected();
    halls = await Hall.find(mongoQuery)
      .lean()
      .select("name location capacity price amenities rating reviews bookedDates menu image")
      .sort({ rating: -1, price: 1 })
      .limit(10);

    console.log(`🏛️  [CHECK_HALLS] Found ${halls.length} matching hall(s) in MongoDB.`);
  } catch (dbErr) {
    console.error("❌ [CHECK_HALLS] MongoDB query error:", dbErr.message);
  }

  return {
    halls,
    requirements,
    checkHallsOutput: JSON.stringify({
      requirements,
      query: mongoQuery,
      matchesCount: halls.length,
    }),
  };
}

