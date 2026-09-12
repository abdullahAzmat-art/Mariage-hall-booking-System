/**
 * VENUORA-AI — Main LangGraph Workflow
 * ──────────────────────────────────────────────────────────────
 *
 * Full topology:
 *
 *              ┌─────────┐
 *    START ───►│EVALUATOR│
 *              └────┬────┘
 *                   │
 *          routeByIntent()
 *                   │
 *       ┌───────────┼───────────┐
 *       │           │           │
 *    ┌─────┐  ┌───────────┐ ┌──────────┐
 *    │ RAG │  │CALCULATION│ │CHECK_HALL│
 *    └──┬──┘  └─────┬─────┘ └────┬─────┘
 *       │           │            ▼
 *       │           │       ┌─────────┐
 *       │           │       │AI_RANKER│
 *       │           │       └────┬────┘
 *       │           │            ▼
 *       │           │       ┌──────────┐
 *       │           │       │VIEW_HALLS│
 *       │           │       └────┬─────┘
 *       │           │            ▼
 *       │           │    ┌──────────────────┐
 *       │           │    │ BOOKING_PROMPT   │  ← interrupt() #1: yes/no + hall name
 *       │           │    └────────┬─────────┘
 *       │           │          yes│
 *       │           │            ▼
 *       │           │    ┌──────────────────────┐
 *       │           │    │ BOOKING_REQUIREMENTS │  ← interrupt() #2: shows form, waits for data
 *       │           │    └────────┬─────────────┘
 *       │           │             │ (form submitted)
 *       │           │             ▼
 *       │           │    ┌──────────────────┐
 *       │           │    │  CREATE_BOOKING  │  ← saves to DB, returns confirmation
 *       │           │    └────────┬─────────┘
 *       └───────────┼────────────┘
 *                   ▼
 *                  END
 */

import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";

import { VenuoraStateAnnotation }    from "./state.js";
import { routeByIntent }             from "./router.js";
import { evaluatorNode }             from "../nodes/evaluatorNode.js";
import { ragNode }                   from "../nodes/ragNode.js";
import { calculationNode }           from "../nodes/calculationNode.js";
import { checkHallsNode }            from "../nodes/checkHallsNode.js";
import { aiRankerNode }              from "../nodes/aiRankerNode.js";
import { viewHallsNode }             from "../nodes/viewHallsNode.js";
import { bookingPromptNode }         from "../nodes/bookingPromptNode.js";
import { bookingRequirementsNode }   from "../nodes/bookingRequirementsNode.js";
import { createBookingNode }         from "../nodes/createBookingNode.js";

// ── In-memory checkpointer ───────────────────────────────────────
const checkpointer = new MemorySaver();

// ── BUILD THE GRAPH ──────────────────────────────────────────────
export const venuoraGraph = new StateGraph(VenuoraStateAnnotation)

  // 1. Register nodes
  .addNode("evaluator",            evaluatorNode)
  .addNode("rag",                  ragNode)
  .addNode("calculation",          calculationNode)
  .addNode("check_halls",          checkHallsNode)
  .addNode("ai_ranker",            aiRankerNode)
  .addNode("view_halls",           viewHallsNode)
  .addNode("booking_prompt",       bookingPromptNode)
  .addNode("booking_requirements", bookingRequirementsNode)
  .addNode("create_booking",       createBookingNode)

  // 2. Entry edge
  .addEdge(START, "evaluator")

  // 3. Conditional fan-out from evaluator
  .addConditionalEdges("evaluator", routeByIntent, {
    rag:         "rag",
    calculation: "calculation",
    check_halls: "check_halls",
  })

  // 4. Linear edges
  .addEdge("rag",         END)
  .addEdge("calculation", END)
  .addEdge("check_halls", "ai_ranker")
  .addEdge("ai_ranker",   "view_halls")
  .addEdge("view_halls",  "booking_prompt")

  // 5. Conditional edge after booking_prompt (yes/no)
  .addConditionalEdges(
    "booking_prompt",
    (state) => state.approval ? "booking_requirements" : END
  )

  // 6. booking_requirements → create_booking → END
  .addEdge("booking_requirements", "create_booking")
  .addEdge("create_booking",       END)

  // 7. Compile with MemorySaver for human-in-the-loop
  .compile({ checkpointer });

console.log("✅ [Venuora-AI] Graph compiled successfully (with MemorySaver).");
