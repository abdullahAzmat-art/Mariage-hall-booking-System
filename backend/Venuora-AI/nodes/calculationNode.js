/**
 * CALCULATION NODE
 * ──────────────────────────────────────────────────────────────
 * Handles all cost / budget / pricing queries.
 * Will compute package prices, discounts, and total event cost.
 *
 * Currently a DUMMY implementation.
 */

/**
 * @param {import('../graph/state.js').VenuoraState} state
 * @returns {Partial<import('../graph/state.js').VenuoraState>}
 */
export async function calculationNode(state) {
  const question = state.question || state.userQuery || "";
  console.log("\n🧮 [CALCULATION] Handling question:", question);

  // ── DUMMY PRICING LOGIC ───────────────────────────────────────
  // TODO: Replace with real pricing model / LLM tool call
  const dummyPricing = {
    basicPackage: 150000,       // PKR
    standardPackage: 280000,    // PKR
    premiumPackage: 500000,     // PKR
    perHeadCatering: 2500,      // PKR per guest
    decorationAddon: 50000,     // PKR
  };

  const calcAnswer =
    `[CALCULATION DUMMY] Pricing breakdown:\n` +
    `  • Basic Package   → PKR ${dummyPricing.basicPackage.toLocaleString()}\n` +
    `  • Standard Package → PKR ${dummyPricing.standardPackage.toLocaleString()}\n` +
    `  • Premium Package  → PKR ${dummyPricing.premiumPackage.toLocaleString()}\n` +
    `  • Catering (per head) → PKR ${dummyPricing.perHeadCatering.toLocaleString()}\n` +
    `  • Decoration Add-on → PKR ${dummyPricing.decorationAddon.toLocaleString()}`;

  console.log("🧮 [CALCULATION] Pricing calculated.");

  return {
    answer: calcAnswer,
    calculationOutput: calcAnswer,
  };
}
