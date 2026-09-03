/**
 * VENUORA-AI — Main LangGraph Workflow
 * ──────────────────────────────────────────────────────────────
 *
 * Full topology:
 *
 *              ┌─────────┐
 *    START ───►│EVALUATOR│
 *              └────┬────┘
 *                   │  state.intent (Zod-validated)
 *                   │
 *          routeByIntent()  ← conditional edge
 *                   │
 *       ┌───────────┼───────────┐
 *       │           │           │
 *  intent=rag  intent=    intent=
 *       │      calculation  check_halls
 *       ▼           ▼           ▼
 *    ┌─────┐  ┌───────────┐ ┌──────────┐
 *    │ RAG │  │CALCULATION│ │CHECK_HALL│
 *    └──┬──┘  └─────┬─────┘ └────┬─────┘
 *       │           │            │
 *       └───────────┼────────────┘
 *                   ▼
 *                  END
 */

import { StateGraph, START, END } from "@langchain/langgraph";

import { VenuoraStateAnnotation } from "./state.js";
import { routeByIntent }          from "./router.js";
import { evaluatorNode }          from "../nodes/evaluatorNode.js";
import { ragNode }                from "../nodes/ragNode.js";
import { calculationNode }        from "../nodes/calculationNode.js";
import { checkHallsNode }         from "../nodes/checkHallsNode.js";

// ── BUILD THE GRAPH ─────────────────────────────────────────────
export const venuoraGraph = new StateGraph(VenuoraStateAnnotation)

  // ── 1. Register every node ──────────────────────────────────
  .addNode("evaluator",   evaluatorNode)
  .addNode("rag",         ragNode)
  .addNode("calculation", calculationNode)
  .addNode("check_halls", checkHallsNode)

  // ── 2. Entry edge: START → EVALUATOR ───────────────────────
  .addEdge(START, "evaluator")

  // ── 3. Conditional fan-out: EVALUATOR → one of three nodes ─
  //       routeByIntent() reads state.intent and returns the
  //       node name; the map below translates it to the node.
  .addConditionalEdges(
    "evaluator",          // source node
    routeByIntent,        // function that returns the branch key
    {
      rag:         "rag",         // intent="rag"         → ragNode
      calculation: "calculation", // intent="calculation" → calculationNode
      check_halls: "check_halls", // intent="check_halls" → checkHallsNode
    }
  )

  // ── 4. Exit edges: each leaf node → END ────────────────────
  .addEdge("rag",         END)
  .addEdge("calculation", END)
  .addEdge("check_halls", END)

  // ── 5. Compile ──────────────────────────────────────────────
  .compile();

console.log("✅ [Venuora-AI] Graph compiled successfully.");
