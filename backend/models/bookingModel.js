const mongoose = require('mongoose');

const BLOCKING_BOOKING_STATUSES = [
  'awaiting_payment',
  'payment_submitted',
  'payment_rejected',
  'approved',
  'completed',
];

const bookingSchema = mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Hall',
  },

  // Stored as UTC midnight for the date-only business date.
  eventDate: {
    type: Date,
    required: [true, 'Please add an event date'],
  },
  // YYYY-MM-DD in the business timezone, used for availability comparisons.
  eventDateKey: {
    type: String,
  },
  eventType: {
    type: String,
    default: 'Wedding',
  },
  timeSlot: {
    type: String,
    default: 'Morning',
  },
  phone: {
    type: String,
  },
  cnic: {
    type: String,
  },
  guestsCount: {
    type: Number,
    required: [true, 'Please add guests count'],
  },

  // Price snapshot taken from trusted hall/package data at booking time.
  hallPrice: {
    type: Number,
    default: 0,
  },
  foodPerHead: {
    type: Number,
    default: 0,
  },
  customSeatPrice: {
    type: Number,
    default: 0,
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
  },
  packagePrice: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please add total amount'],
  },
  prebookingAmount: {
    type: Number,
    default: 0,
  },
  prebookingPercentage: {
    type: Number,
    default: 0.1,
  },
  prebookingPaid: {
    type: Boolean,
    default: false,
  },

  transactionId: {
    type: String,
  },
  paymentProof: {
    type: String,
    default: '',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'submitted', 'verified', 'rejected', 'cancelled', 'expired'],
    default: 'unpaid',
  },
  paymentExpiresAt: {
    type: Date,
  },
  paymentSubmittedAt: {
    type: Date,
  },
  paymentVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verificationDate: {
    type: Date,
  },
  paymentRejectionReason: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: [
      'awaiting_payment',
      'payment_submitted',
      'payment_rejected',
      'approved',
      'rejected',
      'completed',
      'cancelled',
      'expired',
    ],
    default: 'awaiting_payment',
  },
  paymentMethod: {
    type: String,
    enum: ['cash'],
    default: 'cash',
  },
  commissionPaid: {
    type: Boolean,
    default: false,
  },
  commissionAmount: {
    type: Number,
    default: 0,
  },
  customFood: [{
    itemName: String,
    price: Number,
    quantity: { type: Number, default: 1 },
  }],
  customFoodStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  cancelledAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
  cancellationReason: {
    type: String,
    default: '',
  },
  completedAt: {
    type: Date,
  },
  expiredAt: {
    type: Date,
  },
  // Deleting a booking archives it instead of removing booking/payment history.
  archived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Database-level double-booking protection. Only statuses that still hold the
// slot are indexed, so rejected/cancelled/expired bookings release it.
bookingSchema.index(
  { hallId: 1, eventDate: 1, timeSlot: 1 },
  {
    unique: true,
    name: 'uniq_active_booking_slot',
    partialFilterExpression: {
      status: { $in: BLOCKING_BOOKING_STATUSES },
    },
  }
);

// A transaction ID can only be attached to one booking.
bookingSchema.index(
  { transactionId: 1 },
  {
    unique: true,
    name: 'uniq_booking_transaction_id',
    partialFilterExpression: {
      transactionId: { $gt: '' },
    },
  }
);

bookingSchema.index({ hallId: 1, eventDateKey: 1, status: 1 });
bookingSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
