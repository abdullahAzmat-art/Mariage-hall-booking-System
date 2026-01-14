const mongoose = require('mongoose');

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

  eventDate: {
    type: Date,
    required: [true, 'Please add an event date'],
  },
  guestsCount: {
    type: Number,
    required: [true, 'Please add guests count'],
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please add total amount'],
  },
  prebookingAmount: {
    type: Number,
    default: 0,
  },
  prebookingPaid: {
    type: Boolean,
    default: false,
  },
  transactionId: {
    type: String,
    default: '',
  },
  paymentProof: {
    type: String,
    default: '',
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
    enum: ['awaiting_payment', 'payment_submitted', 'payment_rejected', 'approved', 'rejected', 'completed'],
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
    quantity: { type: Number, default: 1 }
  }],
  customSeatPrice: {
    type: Number,
    default: 0
  },
  customFoodStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Booking', bookingSchema);
