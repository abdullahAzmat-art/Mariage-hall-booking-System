// Run this script to create commission payments for existing completed bookings
// Usage: node scripts/createMissingCommissions.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Booking = require('../models/bookingModel');
const CommissionPayment = require('../models/commissionPaymentModel');
const Hall = require('../models/hallModel');
const connectDB = require('../config/db');
const { createCommissionPayment } = require('../controllers/commissionController');
const { getCommissionPercentage } = require('../services/bookingRules');

const createMissingCommissions = async () => {
    try {
        await connectDB();
        
        console.log('Finding completed bookings...');
        const completedBookings = await Booking.find({ status: 'completed' });
        console.log(`Found ${completedBookings.length} completed bookings`);
        
        let created = 0;
        let skipped = 0;

        for (const booking of completedBookings) {
            // Check if commission payment already exists
            const existingPayment = await CommissionPayment.findOne({ bookingId: booking._id });
            
            if (existingPayment) {
                console.log(`Skipping booking ${booking._id} - payment already exists`);
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

            // Create commission payment (idempotent: one record per booking)
            const commissionAmount = Math.round(booking.totalAmount * getCommissionPercentage());
            await createCommissionPayment(booking._id, hall.manager, commissionAmount);

            console.log(`✓ Created commission payment for booking ${booking._id} - Amount: Rs ${commissionAmount}`);
            created++;
        }

        console.log('\n=== Summary ===');
        console.log(`Total completed bookings: ${completedBookings.length}`);
        console.log(`Commission payments created: ${created}`);
        console.log(`Skipped: ${skipped}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createMissingCommissions();
