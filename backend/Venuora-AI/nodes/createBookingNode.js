import Booking from "../../models/bookingModel.js";

/**
 * CREATE BOOKING NODE
 * ─────────────────────────────────────────────
 * Runs AFTER booking_requirements receives the form data.
 * Takes state.booking and saves it to the database.
 */
export async function createBookingNode(state) {
  const data = state.booking;

  if (!data || !data.hallId || !data.customerId) {
    return {
      answer: "Booking failed. Missing required information. Please try again.",
    };
  }

  try {
    // Save the booking to MongoDB
    const newBooking = await Booking.create(data);

    console.log("\n✅ [CREATE_BOOKING] Booking saved to DB:", newBooking._id);

    return {
      answer: `🎉 Your booking is confirmed!\n\n**Booking Summary:**\n- Hall: ${state.selectedHall?.name}\n- Date: ${data.eventDate}\n- Guests: ${data.guestsCount}\n- Total: Rs ${data.totalAmount?.toLocaleString()}\n- Pre-booking to pay: Rs ${data.prebookingAmount?.toLocaleString()}\n\nOur team will contact you shortly. Thank you! 🌟`,
    };
  } catch (error) {
    console.error("\n❌ [CREATE_BOOKING] DB Error:", error.message);
    return {
      answer: "Sorry, we could not save your booking. Please try again or contact support.",
    };
  }
}
