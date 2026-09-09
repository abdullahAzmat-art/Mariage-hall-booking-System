/**
 * VIEW HALLS NODE
 * ──────────────────────────────────────────────────────────────
 * Prepares the final user-facing presentation of ranked halls
 * for the frontend.
 *
 * Positioned in LangGraph:
 *   check_halls → ai_ranker → view_halls → END
 *
 * Responsibilities:
 * 1. Reads ranked halls (from state.halls).
 * 2. Returns the JSON data to be consumed by the frontend.
 */

/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Partial<import('../graph/state.js').VenuoraState>}
 */
export function viewHallsNode(state) {
  const halls = state.halls || [];

  console.log(`\n🖼️  [VIEW_HALLS] Formatting response for ${halls.length} hall(s) to send to frontend...`);

  // ── Build Structured Frontend Cards Payload ─────────────────
  const frontendCards = halls.map((hall, idx) => ({
    id: String(hall._id || idx + 1),
    name: hall.name,
    location: hall.location,
    capacity: hall.capacity,
    pricePerHead: hall.price,
    rating: hall.rating || 4.5,
    reviews: hall.reviews || 0,
    image: hall.image || null,
    amenities: hall.amenities || [],
    rank: hall.rank || idx + 1,
    matchScore: hall.matchScore ?? null,
    matchReason: hall.matchReason ?? null,
  }));

  const jsonPayload = {
    count: halls.length,
    topPick: halls.length > 0 ? halls[0].name : null,
    message: halls.length === 0 ? "No matching halls found" : "Halls fetched successfully",
    cards: frontendCards,
  };

const answer = halls.length === 0
    ? "No matching halls found"
    : `Here are your suggested venues! I found ${halls.length} hall${halls.length > 1 ? 's' : ''} matching your criteria.`;

  return {
    halls,
    viewHallsOutput: jsonPayload,
    answer,
  };
}
