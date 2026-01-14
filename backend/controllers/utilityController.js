const Booking = require('../models/bookingModel');
const CommissionPayment = require('../models/commissionPaymentModel');
const Hall = require('../models/hallModel');

// Utility script to create commission payments for existing completed bookings
const createMissingCommissionPayments = async (req, res) => {
    try {
        // Find all completed bookings
        const completedBookings = await Booking.find({ status: 'completed' });
        
        let created = 0;
        let skipped = 0;

        for (const booking of completedBookings) {
            // Check if commission payment already exists
            const existingPayment = await CommissionPayment.findOne({ bookingId: booking._id });
            
            if (existingPayment) {
                skipped++;
                continue;
            }

            // Get hall to find manager
            const hall = await Hall.findById(booking.hallId);
            
            if (!hall || !hall.manager) {
                console.log(`Skipping booking ${booking._id} - hall or manager not found`);
                skipped++;
                continue;
            }

            // Create commission payment
            const commissionAmount = booking.totalAmount * 0.05;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 2);

            await CommissionPayment.create({
                bookingId: booking._id,
                managerId: hall.manager,
                amount: commissionAmount,
                dueDate
            });

            created++;
        }

        res.json({
            message: 'Commission payments created successfully',
            created,
            skipped,
            total: completedBookings.length
        });
    } catch (error) {
        console.error('Error creating commission payments:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createMissingCommissionPayments };
