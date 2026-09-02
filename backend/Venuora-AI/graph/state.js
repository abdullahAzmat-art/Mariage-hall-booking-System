/**
 * VENUORA-AI — Shared Graph State
 * ──────────────────────────────────────────────────────────────
 * Defines the shape of state that flows through every node in the
 * LangGraph workflow.
 *
 * LangGraph uses an "Annotation" channel system:
 *   • Each field declares a reducer (how updates are merged).
 *   • Using `null` as default is fine for optional fields.
 */

import { Annotation } from "@langchain/langgraph";

export const VenuoraStateAnnotation = Annotation.Root({
  /** The raw query sent by the user / client */
  userQuery: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => "",
  }),

  /**
   * Routing decision made by the EVALUATOR node.
   * Values: "rag" | "calculation" | "check_halls"
   */
  route: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /** Human-readable summary from the EVALUATOR */
  evaluatorOutput: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /** Output produced by the RAG node */
  ragOutput: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /** Output produced by the CALCULATION node */
  calculationOutput: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /** Output produced by the CHECK_HALLS node */
  checkHallsOutput: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /** The final answer that gets returned to the caller */
  finalAnswer: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
});

/** Convenience type alias (JSDoc) */
/** @typedef {typeof VenuoraStateAnnotation.State} VenuoraState */
