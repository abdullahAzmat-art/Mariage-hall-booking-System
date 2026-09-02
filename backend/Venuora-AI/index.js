/**
 * VENUORA-AI — Quick Test / Entry Point
 * ──────────────────────────────────────────────────────────────
 * Run this file directly to smoke-test the graph:
 *
 *   node Venuora-AI/index.js
 *
 * Three sample queries are run to exercise all three branches.
 */

import { venuoraGraph } from "./graph/venuoraGraph.js";

async function runTest(query) {
  console.log("\n" + "═".repeat(60));
  console.log(`🚀 Running query: "${query}"`);
  console.log("═".repeat(60));

  const result = await venuoraGraph.invoke({ userQuery: query });

  console.log("\n✅ Final Answer:\n");
  console.log(result.finalAnswer);
  console.log("\nFull state snapshot:", JSON.stringify(result, null, 2));
}

// ── SMOKE TESTS ────────────────────────────────────────────────
await runTest("Tell me about your wedding hall packages");          // → RAG
await runTest("What is the cost for 500 guests?");                 // → CALCULATION
await runTest("Is the Grand Ballroom available on December 15?");  // → CHECK_HALLS
