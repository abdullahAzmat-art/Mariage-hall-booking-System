/**
 * CHECK HALLS NODE
 * ──────────────────────────────────────────────────────────────
 * Checks hall availability for a given date / guest count.
 * Will query the MongoDB database for real availability data.
 *
 * Currently a DUMMY implementation.
 */

/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Partial<import('../graph/state.js').VenuoraState>}
 */
export async function checkHallsNode(state) {
  console.log("\n🏛️  [CHECK_HALLS] Handling query:", state.userQuery);

  // ── DUMMY AVAILABILITY DATA ───────────────────────────────────
  // TODO: Replace with real MongoDB / Mongoose query
  const dummyHalls = [
    { name: "Grand Ballroom",    capacity: 1500, available: true,  price: 500000 },
    { name: "Royal Garden Hall", capacity: 800,  available: false, price: 350000 },
    { name: "Crystal Pavilion",  capacity: 400,  available: true,  price: 220000 },
    { name: "Sapphire Lounge",   capacity: 200,  available: true,  price: 120000 },
  ];

  const availableHalls = dummyHalls.filter((h) => h.available);

  const hallsAnswer =
    `[CHECK_HALLS DUMMY] Available halls:\n` +
    availableHalls
      .map(
        (h) =>
          `  • ${h.name} — Capacity: ${h.capacity} guests | PKR ${h.price.toLocaleString()}`
      )
      .join("\n");

  console.log("🏛️  [CHECK_HALLS] Hall availability fetched.");

  return {
    finalAnswer: hallsAnswer,
    checkHallsOutput: hallsAnswer,
  };
}
