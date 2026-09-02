/**
 * EVALUATOR NODE
 * ──────────────────────────────────────────────────────────────
 * Entry point of the Venuora-AI workflow.
 * Receives the user query and decides which downstream node
 * should handle it: "rag" | "calculation" | "check_halls"
 *
 * Currently a DUMMY implementation – replace the routing logic
 * with a real LLM call (e.g. ChatOpenAI) when ready.
 */

/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Partial<import('../graph/state.js').VenuoraState>}
 */
export async function evaluatorNode(state) {
  console.log("\n🧠 [EVALUATOR] Received query:", state.userQuery);

  // ── DUMMY ROUTING LOGIC ─────────────────────────────────────
  // In production this will be replaced with an LLM classification call.
  const query = (state.userQuery || "").toLowerCase();

  let route;
  if (query.includes("price") || query.includes("cost") || query.includes("budget") || query.includes("calculate")) {
    route = "calculation";
  } else if (query.includes("available") || query.includes("book") || query.includes("hall") || query.includes("date")) {
    route = "check_halls";
  } else {
    // Default → RAG (knowledge-base lookup)
    route = "rag";
  }

  console.log(`🧠 [EVALUATOR] Routing decision → "${route}"`);

  return {
    route,
    evaluatorOutput: `Evaluated query and decided to route to: ${route}`,
  };
}
