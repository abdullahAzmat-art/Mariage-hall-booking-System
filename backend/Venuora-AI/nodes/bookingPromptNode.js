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

  // 1. Prepare the question based on how many halls there are
  let promptMessage = "";
  if (halls.length === 1) {
    promptMessage = `Would you like to book **${halls[0].name}**? Reply **yes** to proceed or **no** to keep browsing.`;
  } else {
    promptMessage = `Would you like to book one of these halls? Please reply with the **hall name** you want to book (e.g., "${halls[0].name}"), or **no** to keep browsing.`;
  }

  // 2. Pause the graph and ask the user
  const userReply = interrupt(promptMessage);
  const reply = typeof userReply === "string" ? userReply.toLowerCase().trim() : "";

  let wantsBooking = false;
  let selectedHall = null;

  // 3. Figure out their answer
  if (halls.length === 1) {
    wantsBooking = /\b(yes|yeah|yep|sure|okay|ok|book|proceed|confirm|yup)\b/.test(reply);
    if (wantsBooking) selectedHall = halls[0];
  } else if (halls.length > 1) {
    // Check if they typed a specific hall's name
    selectedHall = halls.find(h => reply.includes(h.name.toLowerCase()));
    
    if (selectedHall) {
      wantsBooking = true;
    } else {
      // If they just said "yes" but didn't give a name, ask them again!
      const saidYes = /\b(yes|yeah|yep|sure|okay|ok|book)\b/.test(reply);
      if (saidYes) {
        let followUpReply = interrupt("Which hall would you like to book? Please tell me the name.");
        followUpReply = typeof followUpReply === "string" ? followUpReply.toLowerCase().trim() : "";
        selectedHall = halls.find(h => followUpReply.includes(h.name.toLowerCase()));
        if (selectedHall) wantsBooking = true;
      }
    }
  }

  console.log(`\n📋 [BOOKING_PROMPT] User replied: "${userReply}" → wantsBooking=${wantsBooking}, selectedHall=${selectedHall?.name}`);

  // 4. If they said no or we still couldn't find the hall
  if (!wantsBooking || !selectedHall) {
    return {
      approval: false,
      answer: "No problem! Feel free to explore more venues or ask me anything else. 😊",
    };
  }

  // 5. If successful, move forward and store the selected hall!
  return {
    approval: true,
    selectedHall: selectedHall,
    answer: `Great choice! Preparing the booking form for **${selectedHall.name}**...`,
  };
}
