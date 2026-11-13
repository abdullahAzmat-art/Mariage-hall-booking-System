const mongoose = require('mongoose');

const commissionPaymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentProof: {
        type: String, // File path to uploaded image
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'overdue'],
        default: 'pending'
    },
    dueDate: {
        type: Date,
        required: true
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    rejectionReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// One commission record per booking. This is the database-level guard against
// duplicate charges when a booking is completed more than once.
commissionPaymentSchema.index(
    { bookingId: 1 },
    { unique: true, name: 'uniq_commission_per_booking' }
);

module.exports = mongoose.model('CommissionPayment', commissionPaymentSchema);
