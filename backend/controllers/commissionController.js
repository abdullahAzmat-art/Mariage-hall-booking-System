const CommissionPayment = require('../models/commissionPaymentModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const Hall = require('../models/hallModel');

// Create commission payment record (called when booking is completed)
const createCommissionPayment = async (bookingId, managerId, amount) => {
    try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2); // 2 days from now

        const commissionPayment = new CommissionPayment({
            bookingId,
            managerId,
            amount,
            dueDate
        });

        await commissionPayment.save();
        return commissionPayment;
    } catch (error) {
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

        payment.paymentProof = req.file.path;
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
        const payments = await CommissionPayment.find({ status: 'pending', paymentProof: { $ne: null } })
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

        payment.status = 'verified';
        payment.verifiedBy = req.user._id;
        await payment.save();

        // Update booking commission status
        await Booking.findByIdAndUpdate(payment.bookingId, { commissionPaid: true });

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
        
        const payment = await CommissionPayment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.status = 'rejected';
        payment.rejectionReason = reason;
        payment.paymentProof = null; // Clear proof so manager can re-upload
        await payment.save();

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Check overdue payments and delete halls/managers
const checkOverduePayments = async () => {
    try {
        const now = new Date();
        const overduePayments = await CommissionPayment.find({
            status: 'pending',
            dueDate: { $lt: now }
        }).populate('managerId');

        for (const payment of overduePayments) {
            // Delete all halls owned by this manager
            await Hall.deleteMany({ managerId: payment.managerId._id });
            
            // Delete the manager account
            await User.findByIdAndDelete(payment.managerId._id);
            
            // Delete the payment record
            await CommissionPayment.findByIdAndDelete(payment._id);
            
            console.log(`Deleted manager ${payment.managerId.email} due to overdue payment`);
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
