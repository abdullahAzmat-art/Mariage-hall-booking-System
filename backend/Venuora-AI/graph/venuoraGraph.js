/**
 * VENUORA-AI — Main LangGraph Workflow
 * ──────────────────────────────────────────────────────────────
 *
 * Workflow topology:
 *
 *            START
 *              ↓
 *          EVALUATOR
 *              ↓
 *   ┌──────────┼──────────┐
 *   ↓          ↓          ↓
 *  RAG    CALCULATION  CHECK_HALLS
 *   └──────────┼──────────┘
 *              ↓
 *             END
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import { VenuoraStateAnnotation } from "./state.js";
import { evaluatorNode }   from "../nodes/evaluatorNode.js";
import { ragNode }         from "../nodes/ragNode.js";
import { calculationNode } from "../nodes/calculationNode.js";
import { checkHallsNode }  from "../nodes/checkHallsNode.js";

// ── ROUTING FUNCTION ────────────────────────────────────────────
/**
 * Reads `state.route` (set by the EVALUATOR) and returns the name
 * of the next node to execute.
 *
 * @param {import('./state.js').VenuoraState} state
 * @returns {"rag" | "calculation" | "check_halls"}
 */
function routeAfterEvaluator(state) {
  const route = state.route;
  console.log(`\n🔀 [ROUTER] Directing to → "${route}"`);

  if (route === "calculation") return "calculation";
  if (route === "check_halls") return "check_halls";
  return "rag"; // default fallback
}

// ── BUILD THE GRAPH ─────────────────────────────────────────────
const builder = new StateGraph(VenuoraStateAnnotation)
  // Register nodes
  .addNode("evaluator",   evaluatorNode)
  .addNode("rag",         ragNode)
  .addNode("calculation", calculationNode)
  .addNode("check_halls", checkHallsNode)

  // Edges
  .addEdge(START, "evaluator")

  // Conditional fan-out after EVALUATOR
  .addConditionalEdges("evaluator", routeAfterEvaluator, {
    rag:          "rag",
    calculation:  "calculation",
    check_halls:  "check_halls",
  })

  // All leaf nodes lead to END
  .addEdge("rag",         END)
  .addEdge("calculation", END)
  .addEdge("check_halls", END);

// Compile into a runnable graph
export const venuoraGraph = builder.compile();

console.log("✅ [Venuora-AI] Graph compiled successfully.");
