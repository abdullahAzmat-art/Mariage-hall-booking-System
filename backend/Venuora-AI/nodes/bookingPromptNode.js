/**
 * BOOKING PROMPT NODE  (Human-in-the-Loop)
 * ──────────────────────────────────────────────────────────────
 * Positioned in LangGraph:
 *   view_halls → booking_prompt → END
 *
 * Uses LangGraph's interrupt() to pause the graph and wait for
 * the user to reply "yes" or "no" before continuing.
 *
 * Flow:
 *   1. Graph reaches this node after halls are shown.
 *   2. interrupt() fires → graph pauses, sends question to user.
 *   3. User replies → graph resumes with user's answer.
 *   4. Node reads the answer and returns appropriate response.
 */

import { interrupt } from "@langchain/langgraph";

/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Partial<import('../graph/state.js').VenuoraState>}
 */
export function bookingPromptNode(state) {
  const halls = state.halls || [];

  // ── Pause graph and ask user ────────────────────────────────
  const userReply = interrupt(
    halls.length > 0
      ? `Would you like to book one of these halls? Reply **yes** to proceed or **no** to keep browsing.`
      : `Would you like help with anything else?`
  );

  // ── Resume: evaluate user's reply ──────────────────────────
  const reply = typeof userReply === "string" ? userReply.toLowerCase().trim() : "";
  const wantsBooking = /\b(yes|yeah|yep|sure|okay|ok|book|proceed|confirm|yup)\b/.test(reply);

  console.log(`\n📋 [BOOKING_PROMPT] User replied: "${userReply}" → wantsBooking=${wantsBooking}`);

  if (!wantsBooking) {
    return {
      approval: false,
      answer: "No problem! Feel free to explore more venues or ask me anything else. 😊",
    };
  }

  // User wants to book — guide them to pick a hall and date
  const hallNames = halls.map((h, i) => `${i + 1}. ${h.name} (${h.location})`).join("\n");
  const bookingGuide =
    halls.length === 1
      ? `Great choice! 🎉 Let's book **${halls[0].name}**. Please visit the hall's detail page and click "Book Now" to select your date and confirm the booking.`
      : `Fantastic! 🎉 Here are your options:\n\n${hallNames}\n\nJust visit any hall's detail page and click **"Book Now"** to select your date and confirm your booking.`;

  return {
    approval: true,
    answer: bookingGuide,
  };
}
