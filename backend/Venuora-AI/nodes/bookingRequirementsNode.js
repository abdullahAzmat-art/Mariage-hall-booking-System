import { interrupt } from "@langchain/langgraph";
import dateKeyUtils from "../../utils/dateKey.js";
import bookingRules from "../../services/bookingRules.js";

const { getBusinessDateKey } = dateKeyUtils;
const { getPrebookingPercentage } = bookingRules;

/**
 * BOOKING REQUIREMENTS NODE
 * ─────────────────────────────────────────────
 * Flow:
 *  1. Sends the booking form to the frontend via interrupt()
 *  2. Graph PAUSES here and waits for the user to fill & submit the form
 *  3. When user submits, the frontend sends back the form data as JSON
 *  4. Node stores the raw request in state; createBookingNode validates and
 *     prices it through the same backend service as the REST API.
 */
export function bookingRequirementsNode(state) {
  const hall = state.selectedHall;

  // ── STEP 1: interrupt() → sends form signal to frontend & pauses graph ──
  const submittedData = interrupt({
    type: "booking_form",
    hallId: hall ? hall._id : null,
    hallName: hall ? hall.name : '',
    hallPrice: hall ? hall.price : 0,
    hallMenu: hall?.menu || [],
    // The form displays the same percentage the backend charges.
    prebookingPercentage: getPrebookingPercentage(),
    businessToday: getBusinessDateKey(),
  });

  if (!hall) {
    return {
      answer: "I couldn't find the selected hall. Please search again and choose a hall.",
    };
  }

  // ── STEP 2: graph resumes — submittedData is the JSON the frontend sent back ──
  let bookingData = submittedData;
  if (typeof submittedData === "string") {
    try {
      bookingData = JSON.parse(submittedData);
    } catch {
      return {
        answer: "Please fill out and submit the booking form to continue.",
      };
    }
  }

  if (!bookingData || typeof bookingData !== "object") {
    return {
      answer: "Please fill out and submit the booking form to continue.",
    };
  }

  console.log("\n📋 [BOOKING_REQUIREMENTS] Form data received:", bookingData);

  const customFood = Array.isArray(bookingData.customFood)
    ? bookingData.customFood.map((item) => ({
        itemName: item?.itemName ?? item?.name,
        quantity: item?.quantity ?? 1,
      }))
    : [];

  // No prices or totals are calculated here. The shared booking service is the
  // single source of truth for identity, validation, pricing and availability.
  return {
    answer: `Your booking for **${hall.name}** is being confirmed...`,
    booking: {
      hallId: hall._id,
      eventDate: bookingData.eventDate,
      eventType: bookingData.eventType || "Wedding",
      timeSlot: bookingData.timeSlot || "Morning",
      phone: bookingData.phone,
      cnic: bookingData.cnic,
      guestsCount: bookingData.guestsCount,
      customFood,
      packageId: bookingData.packageId || null,
      paymentMethod: "cash",
    },
  };
}
