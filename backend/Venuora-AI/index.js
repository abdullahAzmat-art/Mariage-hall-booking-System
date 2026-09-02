/**
 * VENUORA-AI — Quick Smoke Test / Entry Point
 * ──────────────────────────────────────────────────────────────
 * Run this file directly to test the full workflow with a real
 * LLM call to OpenRouter:
 *
 *   node Venuora-AI/index.js
 *
 * Make sure OPENROUTER_API_KEY is set in backend/.env
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

import { venuoraGraph } from "./graph/venuoraGraph.js";

async function runTest(question) {
  console.log("\n" + "═".repeat(60));
  console.log(`🚀 Testing: "${question}"`);
  console.log("═".repeat(60));

  const result = await venuoraGraph.invoke({ question });

  console.log("\n✅ Final Answer:\n");
  console.log(result.answer);
  console.log("\n📊 State Snapshot:");
  console.log({
    question:   result.question,
    intent:     result.intent,
    answer:     result.answer?.slice(0, 80) + "...",
    halls:      result.halls?.length ? `[${result.halls.length} halls]` : "[]",
    selectedHall: result.selectedHall,
    approval:   result.approval,
    booking:    result.booking,
  });
}

// ── SMOKE TESTS ────────────────────────────────────────────────
// Each query should route to a different branch via LLM classification
await runTest("Tell me about your wedding hall packages");         // → rag
await runTest("What is the total cost for 300 guests?");          // → calculation
await runTest("Is the Grand Ballroom available on December 15?"); // → check_halls
