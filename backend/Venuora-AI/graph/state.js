/**
 * VENUORA-AI — Shared Graph State
 * ──────────────────────────────────────────────────────────────
 * Defines the shape of every field that flows through the
 * LangGraph workflow nodes.
 *
 * Field guide:
 *   question        – raw user message
 *   intent          – classified intent ("rag" | "calculation" | "check_halls")
 *   answer          – final natural-language answer returned to the user
 *   halls           – list of hall objects fetched from DB
 *   selectedHall    – single hall the user chose
 *   approval        – whether the user confirmed their booking
 *   booking         – the created booking object
 *
 *   route           – internal routing signal set by EVALUATOR (mirrors intent)
 *   evaluatorOutput – debug / reasoning text from EVALUATOR
 *   ragOutput       – output from RAG node (for debugging)
 *   calculationOutput – output from CALCULATION node
 *   checkHallsOutput  – output from CHECK_HALLS node
 */

import { Annotation } from "@langchain/langgraph";

export const VenuoraStateAnnotation = Annotation.Root({

  // ── Primary conversation fields ──────────────────────────────

  /**
   * The raw question / message sent by the user.
   * @type {string}
   */
  question: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => "",
  }),

  /**
   * Classified intent detected by the EVALUATOR node.
   * Values: "rag" | "calculation" | "check_halls"
   * @type {string|null}
   */
  intent: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /**
   * Final natural-language answer to return to the user.
   * @type {string|null}
   */
  answer: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /**
   * List of hall objects retrieved from the database.
   * Each item follows the Hall mongoose model shape.
   * Uses concat reducer so nodes can append items.
   * @type {Array<object>}
   */
  halls: Annotation({
    reducer: (prev, next) => {
      // Allow a node to completely replace the list by returning an array,
      // or append to it by returning a non-empty array
      if (!next || next.length === 0) return prev;
      return next;
    },
    default: () => [],
  }),

  /**
   * The single hall object the user has selected / confirmed.
   * @type {object|null}
   */
  selectedHall: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /**
   * Whether the user has approved their booking (true / false).
   * @type {boolean|null}
   */
  approval: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /**
   * The created / confirmed booking object.
   * @type {object|null}
   */
  booking: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  // ── Internal / legacy routing fields ────────────────────────

  /**
   * Internal routing signal — mirrors `intent`, used by the
   * conditional edge to pick the next node.
   * @type {string|null}
   */
  route: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /** Human-readable reasoning text produced by EVALUATOR. */
  evaluatorOutput: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /** Raw output from the RAG node (for debugging). */
  ragOutput: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /** Raw output from the CALCULATION node (for debugging). */
  calculationOutput: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  /** Raw output from the CHECK_HALLS node (for debugging). */
  checkHallsOutput: Annotation({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
});

/** @typedef {typeof VenuoraStateAnnotation.State} VenuoraState */
