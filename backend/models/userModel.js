const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'customer'],
    default: 'customer',
  },
  managerApplication: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    businessName: String,
    businessAddress: String,
    description: String,
    appliedAt: Date,
  },
  paymentWarnings: {
    type: Number,
    default: 0,
  },
  accountSuspended: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
