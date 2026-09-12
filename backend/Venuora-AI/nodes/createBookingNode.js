import Booking from "../../models/bookingModel.js";

/**
 * CREATE BOOKING NODE
 * ─────────────────────────────────────────────
 * Runs AFTER booking_requirements receives the form data.
 * Takes state.booking and saves it to the database.
 */
export async function createBookingNode(state) {
  const data = state.booking;
console.log(data , "data in createBookingNode");
console.log(data.hallId , "halls id ")
console.log(data.customerid , "halls id ")
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
     
answer: `🎉 Your booking is confirmed!

**Booking Summary:**
- Hall: ${state.selectedHall?.name}
- Date: ${data.eventDate}
- Guests: ${data.guestsCount}
- Total: Rs ${data.totalAmount?.toLocaleString()}
- Pre-booking to pay: Rs ${data.prebookingAmount?.toLocaleString()}

Please review your booking details in your dashboard and complete the 10% pre-booking payment to secure your booking. 💳

Thank you for choosing Venuora! 🌟`

,
    };
  } catch (error) {
    console.error("\n❌ [CREATE_BOOKING] DB Error:", error.message);
    return {
      answer: "Sorry, we could not save your booking. Please try again or contact support.",
    };
  }
}
