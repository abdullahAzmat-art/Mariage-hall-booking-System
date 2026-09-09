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
 *       │           │            ▼
 *       │           │       ┌─────────┐
 *       │           │       │AI_RANKER│
 *       │           │       └────┬────┘
 *       │           │            │
 *       │           │            ▼
 *       │           │       ┌──────────┐
 *       │           │       │VIEW_HALLS│
 *       │           │       └────┬─────┘
 *       │           │            │
 *       │           │            ▼
 *       │           │    ┌──────────────────┐
 *       │           │    │ BOOKING_PROMPT   │  ← interrupt() waits for yes/no
 *       │           │    └────────┬─────────┘
 *       │           │            │
 *       └───────────┼────────────┘
 *                   ▼
 *                  END
 *
 * Uses MemorySaver checkpointer so state persists between HTTP
 * requests on the same thread_id (required for interrupt/resume).
 */

import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";

import { VenuoraStateAnnotation } from "./state.js";
import { routeByIntent }          from "./router.js";
import { evaluatorNode }          from "../nodes/evaluatorNode.js";
import { ragNode }                from "../nodes/ragNode.js";
import { calculationNode }        from "../nodes/calculationNode.js";
import { checkHallsNode }         from "../nodes/checkHallsNode.js";
import { aiRankerNode }           from "../nodes/aiRankerNode.js";
import { viewHallsNode }          from "../nodes/viewHallsNode.js";
import { bookingPromptNode }      from "../nodes/bookingPromptNode.js";

// ── In-memory checkpointer — persists state between requests per thread ──
const checkpointer = new MemorySaver();

// ── BUILD THE GRAPH ─────────────────────────────────────────────
export const venuoraGraph = new StateGraph(VenuoraStateAnnotation)

  // ── 1. Register every node ──────────────────────────────────
  .addNode("evaluator",       evaluatorNode)
  .addNode("rag",             ragNode)
  .addNode("calculation",     calculationNode)
  .addNode("check_halls",     checkHallsNode)
  .addNode("ai_ranker",       aiRankerNode)
  .addNode("view_halls",      viewHallsNode)
  .addNode("booking_prompt",  bookingPromptNode)

  // ── 2. Entry edge: START → EVALUATOR ───────────────────────
  .addEdge(START, "evaluator")

  // ── 3. Conditional fan-out: EVALUATOR → one of three nodes ─
  .addConditionalEdges(
    "evaluator",
    routeByIntent,
    {
      rag:         "rag",
      calculation: "calculation",
      check_halls: "check_halls",
    }
  )

  // ── 4. Node transitions & exit edges ───────────────────────
  .addEdge("rag",            END)
  .addEdge("calculation",    END)
  .addEdge("check_halls",    "ai_ranker")
  .addEdge("ai_ranker",      "view_halls")
  .addEdge("view_halls",     "booking_prompt") // ← halls shown → ask to book
  .addEdge("booking_prompt", END)

  // ── 5. Compile with MemorySaver for human-in-the-loop ──────
  .compile({ checkpointer });

console.log("✅ [Venuora-AI] Graph compiled successfully (with MemorySaver).");
