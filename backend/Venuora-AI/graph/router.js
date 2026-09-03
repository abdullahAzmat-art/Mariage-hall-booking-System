/**
 * VENUORA-AI — Intent Router
 * ──────────────────────────────────────────────────────────────
 * Reads state.intent (set + Zod-validated by the EVALUATOR node)
 * and returns the exact node name LangGraph should jump to next.
 *
 * intent → node mapping:
 *   "rag"          → ragNode
 *   "calculation"  → calculationNode
 *   "check_halls"  → checkHallsNode
 *
 * Any unexpected value safely falls back to "rag".
 */

/**
 * @param {import('./state.js').VenuoraState} state
 * @returns {"rag" | "calculation" | "check_halls"}
 */
export function routeByIntent(state) {
  const intent = state.intent; // guaranteed by Zod in evaluatorNode

  console.log("\n🔀 [ROUTER] Intent received →", intent);

  switch (intent) {
    case "rag":
      console.log("🔀 [ROUTER] ✅ Routing to → RAG node");
      return "rag";

    case "calculation":
      console.log("🔀 [ROUTER] ✅ Routing to → CALCULATION node");
      return "calculation";

    case "check_halls":
      console.log("🔀 [ROUTER] ✅ Routing to → CHECK_HALLS node");
      return "check_halls";

    default:
      console.warn(`🔀 [ROUTER] ⚠️  Unknown intent "${intent}" — falling back to RAG`);
      return "rag";
  }
}
