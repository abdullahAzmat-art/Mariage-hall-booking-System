import { interrupt } from "@langchain/langgraph";

/**
 * BOOKING REQUIREMENTS NODE
 * ─────────────────────────────────────────────
 * Flow:
 *  1. Sends the booking form to the frontend via interrupt()
 *  2. Graph PAUSES here and waits for the user to fill & submit the form
 *  3. When user submits, the frontend sends back the form data as JSON
 *  4. Node receives the data, stores it in state, then goes to next node
 */
export function bookingRequirementsNode(state) {
  const hall = state.selectedHall;

  // ── STEP 1: interrupt() → sends form signal to frontend & pauses graph ──
  // The frontend receives this and shows the booking form.
  // When user clicks "Confirm Booking", the form data is sent back as the resume value.
  const submittedData = interrupt({
    type: "booking_form",                          // tells frontend what to show
    hallId:    hall ? hall._id   : null,
    hallName:  hall ? hall.name  : '',
    hallPrice: hall ? hall.price : 0,
    hallMenu:  hall?.menu        || [],
  });

  // ── STEP 2: graph resumes — submittedData is the JSON the frontend sent back ──
  // It could be a plain object (if frontend sent JSON) or a string (if user typed)
  let bookingData = submittedData;
  if (typeof submittedData === "string") {
    try {
      bookingData = JSON.parse(submittedData);
    } catch {
      // User typed a plain message instead of submitting the form
      return {
        answer: "Please fill out and submit the booking form to continue.",
      };
    }
  }

  console.log("\n📋 [BOOKING_REQUIREMENTS] Form data received:", bookingData);

  // ── STEP 3: Calculate amounts ──────────────────────────────────
  const hallPrice       = Number(hall?.price) || 0;
  const customSeatPrice = Number(bookingData.customSeatPrice) || 0;
  const guestsCount     = Number(bookingData.guestsCount) || 0;
  const totalAmount     = guestsCount * (hallPrice + customSeatPrice);
  const prebookingAmount = totalAmount * 0.2;

  // ── STEP 4: Store all booking details in state & move forward ──
  return {
    answer: `Your booking for **${hall?.name}** is being confirmed...`,
    booking: {
      hallId:           hall?._id,
      customerId:       bookingData.customerId,
      eventDate:        bookingData.eventDate,
      eventType:        bookingData.eventType  || "Wedding",
      phone:            bookingData.phone,
      cnic:             bookingData.cnic,
      guestsCount,
      totalAmount,
      prebookingAmount,
      customSeatPrice,
      customFood:       bookingData.customFood || [],
      paymentMethod:    "cash",
    },
  };
}
