import bookingServiceModule from "../../services/bookingService.js";

const { createBookingForUser } = bookingServiceModule;

/**
 * CREATE BOOKING NODE
 * ─────────────────────────────────────────────
 * Runs AFTER booking_requirements receives the form data.
 * Uses the same trusted booking service as POST /api/bookings, so the AI path
 * gets identical validation, pricing, double-booking protection and status
 * handling.
 */
export async function createBookingNode(state) {
  const data = state.booking;

  if (!data || !data.hallId || !state.userId) {
    return {
      answer: "Booking failed. Missing required information. Please try again.",
    };
  }

  try {
    // Identity always comes from the authenticated API request.
    const newBooking = await createBookingForUser({
      customerId: state.userId,
      payload: data,
    });

    const booking = newBooking.toObject ? newBooking.toObject() : newBooking;
    const percentage = Math.round((booking.prebookingPercentage || 0.1) * 100);

    console.log("\n✅ [CREATE_BOOKING] Booking saved to DB:", booking._id);

    return {
      booking,
      answer: `🎉 Your booking is confirmed!

**Booking Summary:**
- Hall: ${state.selectedHall?.name}
- Date: ${booking.eventDateKey || data.eventDate}
- Time: ${booking.timeSlot}
- Guests: ${booking.guestsCount}
- Total: Rs ${Number(booking.totalAmount).toLocaleString()}
- Pre-booking to pay (${percentage}%): Rs ${Number(booking.prebookingAmount).toLocaleString()}

Please review your booking details in your dashboard and submit the payment proof. 💳

Thank you for choosing Venuora! 🌟`,
    };
  } catch (error) {
    console.error("\n❌ [CREATE_BOOKING] Booking error:", error.message);

    if (error && error.status && error.message) {
      return { answer: `Booking failed: ${error.message}` };
    }

    return {
      answer: "Sorry, we could not save your booking. Please try again or contact support.",
    };
  }
}
