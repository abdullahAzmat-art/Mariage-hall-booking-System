// One-time maintenance script for existing databases.
// Usage: node scripts/ensureBookingIndexes.js
//
// 1. Backfills eventDateKey for legacy bookings.
// 2. Reports duplicate active slots / transaction IDs and stops.
// 3. Builds the unique booking indexes when the data is clean.

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const Booking = require('../models/bookingModel');
const { BLOCKING_BOOKING_STATUSES } = require('../services/bookingRules');

const run = async () => {
  await connectDB();

  const backfill = await Booking.collection.updateMany(
    {
      $or: [
        { eventDateKey: { $exists: false } },
        { eventDateKey: null },
        { eventDateKey: '' },
      ],
    },
    [
      {
        $set: {
          eventDateKey: {
            $dateToString: { format: '%Y-%m-%d', date: '$eventDate', timezone: 'UTC' },
          },
        },
      },
    ]
  );
  console.log(`Backfilled eventDateKey on ${backfill.modifiedCount} booking(s)`);

  const duplicateSlots = await Booking.aggregate([
    { $match: { status: { $in: BLOCKING_BOOKING_STATUSES } } },
    {
      $group: {
        _id: {
          hallId: '$hallId',
          eventDate: '$eventDate',
          timeSlot: '$timeSlot',
        },
        count: { $sum: 1 },
        bookingIds: { $push: '$_id' },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  const duplicateTransactions = await Booking.aggregate([
    { $match: { transactionId: { $gt: '' } } },
    { $group: { _id: '$transactionId', count: { $sum: 1 }, bookingIds: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicateSlots.length || duplicateTransactions.length) {
    console.error('\nCannot build unique indexes until these duplicates are resolved:');
    duplicateSlots.forEach((item) => {
      console.error(`  Slot ${JSON.stringify(item._id)} -> ${item.bookingIds.join(', ')}`);
    });
    duplicateTransactions.forEach((item) => {
      console.error(`  Transaction ${item._id} -> ${item.bookingIds.join(', ')}`);
    });
    process.exit(1);
  }

  await Booking.syncIndexes();
  console.log('Booking indexes are up to date.');
  process.exit(0);
};

run().catch((error) => {
  console.error('Index setup failed:', error);
  process.exit(1);
});
