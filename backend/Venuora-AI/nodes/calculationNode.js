/**
 * CALCULATION NODE
 * ──────────────────────────────────────────────────────────────
 * Handles numeric / cost / budget queries.
 *
 * Flow:
 *   User question → LLM extracts numbers + operation (Zod-validated)
 *                → JavaScript performs the actual calculation
 *                → return natural-language result
 *
 * The LLM is used ONLY for understanding/extracting, never for math.
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

import { z }                              from "zod";
import { ChatOpenRouter }                 from "../lib/ChatOpenRouter.js";
import { SystemMessage, HumanMessage }   from "@langchain/core/messages";

// ─────────────────────────────────────────────────────────────
// 1. ZOD SCHEMA — shape the LLM MUST return
// ─────────────────────────────────────────────────────────────
const CalcExtractSchema = z.object({
  operation: z
    .enum(["add", "subtract", "multiply", "divide"])
    .describe("The arithmetic operation to perform."),

  numbers: z
    .array(z.number())
    .min(1)
    .describe("All numeric operands mentioned in the question, in the order they appear."),
});

// ─────────────────────────────────────────────────────────────
// 2. LLM — structured model
// ─────────────────────────────────────────────────────────────
const rawModel = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0,
});

const structuredModel = rawModel.withStructuredOutput(CalcExtractSchema, {
  name: "extract_calculation",
});

// ─────────────────────────────────────────────────────────────
// 3. SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a calculation extractor for Venuora, a marriage hall booking platform.

Your ONLY job is to extract the arithmetic operation and numbers from the user's question.
DO NOT compute the result yourself. You will not see the answer.

Supported operations:
  add        → combine all numbers (e.g., "What's 5 plus 3 plus 10?")
  subtract   → subtract subsequent numbers from the first (e.g., "Subtract 20 from 100")
  multiply   → multiply all numbers together (e.g., "300 guests at 2500 each")
  divide     → divide the first number by the subsequent numbers (e.g., "150000 split between 3 people")

Rules:
  • Return the numbers in the order they appear in the question.
  • If the user mentions percentages, convert them to decimals before including (e.g., "20%" → 0.2).
  • If no numbers are found, return an empty numbers array.
  • If the operation is unclear, default to "add".`;

// ─────────────────────────────────────────────────────────────
// 4. PURE MATH HELPERS (no LLM involved)
// ─────────────────────────────────────────────────────────────
function compute({ operation, numbers }) {
  if (!numbers || numbers.length === 0) {
    return { error: "No numbers were found in the question." };
  }

  let result;
  const ops = {
    add:      () => numbers.reduce((a, b) => a + b, 0),
    subtract: () => numbers.slice(1).reduce((a, b) => a - b, numbers[0]),
    multiply: () => numbers.reduce((a, b) => a * b, 1),
    divide:   () => {
      if (numbers.length < 2) return numbers[0];
      return numbers.slice(1).reduce((a, b) => {
        if (b === 0) return NaN;
        return a / b;
      }, numbers[0]);
    },
  };

  const fn = ops[operation];
  if (!fn) {
    return { error: `Unsupported operation: ${operation}` };
  }

  result = fn();

  if (Number.isNaN(result) || !Number.isFinite(result)) {
    return { error: "Calculation produced an invalid result (possible division by zero)." };
  }

  return { result };
}

function formatAnswer(operation, numbers, result) {
  const symbols = { add: "+", subtract: "-", multiply: "×", divide: "÷" };
  const symbol = symbols[operation] || operation;
  const expression = numbers.join(` ${symbol} `);

  const opWords = {
    add: "Sum",
    subtract: "Difference",
    multiply: "Product",
    divide: "Quotient",
  };

  // Pretty-print large numbers
  const pretty = Number.isInteger(result)
    ? result.toLocaleString()
    : result.toLocaleString(undefined, { maximumFractionDigits: 4 });

  return `${opWords[operation]}: ${expression} = ${pretty}`;
}

// ─────────────────────────────────────────────────────────────
// 5. NODE FUNCTION
// ─────────────────────────────────────────────────────────────
/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Promise<Partial<import('../graph/state.js').VenuoraState>>}
 */
export async function calculationNode(state) {
  const question = state.question || state.userQuery || "";
  console.log("\n🧮 [CALCULATION] Question:", question);

  // ── LLM EXTRACTION (structured) ─────────────────────────────
  let parsed;
  try {
    parsed = await structuredModel.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(question),
    ]);
    console.log("🧮 [CALCULATION] Extracted:", JSON.stringify(parsed));
  } catch (err) {
    console.error("❌ [CALCULATION] LLM extraction failed:", err.message);
    return {
      answer: "I couldn't understand the calculation. Please provide numbers and an operation (e.g., \"What's 50 + 200?\").",
      calculationOutput: "LLM extraction failed.",
    };
  }

  // ── JS CALCULATION ──────────────────────────────────────────
  const { result, error } = compute(parsed);

  if (error) {
    console.warn("⚠️ [CALCULATION]", error);
    return {
      answer: error,
      calculationOutput: error,
    };
  }

  const answer = formatAnswer(parsed.operation, parsed.numbers, result);
  console.log("🧮 [CALCULATION] Result:", answer);

  return {
    answer,
    calculationOutput: answer,
  };
}
