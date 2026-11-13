const CommissionPayment = require('../models/commissionPaymentModel');
const Booking = require('../models/bookingModel');

// Create the single commission record for a booking. Safe to call repeatedly:
// the unique bookingId index plus the upsert prevent duplicate charges.
const createCommissionPayment = async (bookingId, managerId, amount) => {
    try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2);

        const payment = await CommissionPayment.findOneAndUpdate(
            { bookingId },
            {
                $setOnInsert: {
                    bookingId,
                    managerId,
                    amount,
                    dueDate,
                    status: 'pending',
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        return payment;
    } catch (error) {
        if (error && error.code === 11000) {
            // A concurrent request created it first; return that record.
            const existing = await CommissionPayment.findOne({ bookingId });
            if (existing) return existing;
        }
        console.error('Error creating commission payment:', error);
        throw error;
    }
};

// Upload payment proof (Manager)
const uploadPaymentProof = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a payment proof image' });
        }

        const payment = await CommissionPayment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        // Verify manager owns this payment
        if (payment.managerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (payment.status === 'verified') {
            return res.status(400).json({ message: 'This commission payment is already verified' });
        }

        payment.paymentProof = req.file.path;
        payment.status = 'pending';
        payment.rejectionReason = null;
        await payment.save();

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get manager's own payments
const getManagerPayments = async (req, res) => {
    try {
        const payments = await CommissionPayment.find({ managerId: req.user._id })
            .populate('bookingId')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all pending payments (Admin)
const getPendingPayments = async (req, res) => {
    try {
        const payments = await CommissionPayment.find({
            status: { $in: ['pending', 'overdue'] },
            paymentProof: { $nin: ['', null] },
        })
            .populate('bookingId')
            .populate('managerId', 'name email')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Verify payment (Admin)
const verifyPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await CommissionPayment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status === 'verified') {
            return res.json(payment);
        }

        if (!payment.paymentProof) {
            return res.status(400).json({ message: 'No payment proof uploaded for this record' });
        }

        payment.status = 'verified';
        payment.verifiedBy = req.user._id;
        payment.rejectionReason = null;
        await payment.save();

        await Booking.findByIdAndUpdate(payment.bookingId, {
            commissionPaid: true,
            commissionAmount: payment.amount,
        });

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Reject payment (Admin)
const rejectPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (typeof reason !== 'string' || !reason.trim()) {
            return res.status(400).json({ message: 'A rejection reason is required' });
        }

        const payment = await CommissionPayment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.status = 'rejected';
        payment.rejectionReason = reason.trim().slice(0, 500);
        payment.paymentProof = null; // Clear proof so manager can re-upload
        await payment.save();

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Mark overdue commissions. Records and halls/managers are preserved so
// payment and booking history is never destroyed.
const checkOverduePayments = async () => {
    try {
        const result = await CommissionPayment.updateMany(
            { status: 'pending', dueDate: { $lt: new Date() } },
            { $set: { status: 'overdue' } }
        );

        if (result.modifiedCount > 0) {
            console.log(`Marked ${result.modifiedCount} commission payment(s) as overdue`);
        }
    } catch (error) {
        console.error('Error checking overdue payments:', error);
    }
};

module.exports = {
    createCommissionPayment,
    uploadPaymentProof,
    getManagerPayments,
    getPendingPayments,
    verifyPayment,
    rejectPayment,
    checkOverduePayments
};
