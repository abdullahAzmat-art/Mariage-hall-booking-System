const test = require('node:test');
const assert = require('node:assert/strict');

delete process.env.PREBOOKING_PERCENTAGE;
delete process.env.COMMISSION_PERCENTAGE;

const rules = require('../services/bookingRules');
const dateKey = require('../utils/dateKey');
const Booking = require('../models/bookingModel');

test('date keys are validated as real calendar dates', () => {
  assert.equal(dateKey.isValidDateKey('2026-05-01'), true);
  assert.equal(dateKey.isValidDateKey('2026-02-30'), false);
  assert.equal(dateKey.isValidDateKey('01-05-2026'), false);
  assert.equal(dateKey.toDateKey(new Date('2026-05-01T23:30:00.000Z')), '2026-05-01');
});

test('business timezone determines today and past dates', () => {
  const justAfterMidnightUtc = new Date('2026-01-01T20:30:00.000Z');
  assert.equal(dateKey.getBusinessDateKey(justAfterMidnightUtc, 'Asia/Karachi'), '2026-01-02');
  assert.equal(dateKey.isPastDateKey('2020-01-01'), true);
  assert.equal(dateKey.isPastDateKey(dateKey.getBusinessDateKey()), false);
  assert.equal(dateKey.daysBetweenDateKeys('2026-05-01', '2026-05-08'), 7);
});

test('time slot and event type are normalized to allowlisted values', () => {
  assert.equal(rules.normalizeTimeSlot('morning'), 'Morning');
  assert.equal(rules.normalizeTimeSlot('Evening'), 'Evening');
  assert.throws(() => rules.normalizeTimeSlot('Midnight'), /timeSlot must be one of/);

  assert.equal(rules.normalizeEventType('corporate event'), 'Corporate');
  assert.equal(rules.normalizeEventType('walima'), 'Reception');
  assert.throws(() => rules.normalizeEventType('Festival'), /eventType must be one of/);
});

test('phone, CNIC and transaction IDs are validated', () => {
  assert.equal(rules.normalizePhone('0300 1234567'), '0300 1234567');
  assert.throws(() => rules.normalizePhone('123'), /between 7 and 15 digits/);

  assert.equal(rules.normalizeCnic('1234512345671'), '12345-1234567-1');
  assert.equal(rules.normalizeCnic('12345-1234567-1'), '12345-1234567-1');
  assert.throws(() => rules.normalizeCnic('12345'), /13 digits/);

  assert.equal(rules.normalizeTransactionId(' TXN-1234 '), 'TXN-1234');
  assert.throws(() => rules.normalizeTransactionId('abc'), /at least 4/);
  assert.throws(() => rules.normalizeTransactionId('bad$txn'), /may only contain/);
});

test('custom food uses trusted menu prices and rejects unknown or duplicate items', () => {
  const menu = [
    { name: 'Chicken Biryani', price: 500 },
    { name: 'Salad', price: 100 },
  ];

  const result = rules.normalizeCustomFood(
    [
      { itemName: 'Chicken Biryani', price: 1, quantity: 2 },
      { name: 'Salad', price: 999, quantity: 1 },
    ],
    menu
  );

  assert.equal(result.foodPerHead, 1100);
  assert.deepEqual(result.items, [
    { itemName: 'Chicken Biryani', price: 500, quantity: 2 },
    { itemName: 'Salad', price: 100, quantity: 1 },
  ]);

  assert.throws(
    () => rules.normalizeCustomFood([{ itemName: 'Pizza', quantity: 1 }], menu),
    /not available on this hall's menu/
  );
  assert.throws(
    () => rules.normalizeCustomFood(
      [
        { itemName: 'Salad', quantity: 1 },
        { itemName: 'salad', quantity: 1 },
      ],
      menu
    ),
    /duplicate item/
  );
  assert.throws(
    () => rules.normalizeCustomFood([{ itemName: 'Salad', quantity: 0 }], menu),
    /between 1 and 20/
  );
});

test('pricing is calculated from hall price, menu and package only', () => {
  const amounts = rules.calculateBookingAmounts({
    hallPrice: 3000,
    foodPerHead: 700,
    guestsCount: 100,
    packagePrice: 50000,
  });

  assert.equal(amounts.seatPrice, 3700);
  assert.equal(amounts.totalAmount, 420000);
  assert.equal(amounts.prebookingAmount, 42000);
  assert.equal(amounts.commissionAmount, 21000);
  assert.equal(amounts.prebookingPercentage, 0.1);

  // round to the nearest rupee
  const rounded = rules.calculateBookingAmounts({
    hallPrice: 1234.5,
    foodPerHead: 0,
    guestsCount: 1,
  });
  assert.equal(rounded.totalAmount, 1235);
  assert.equal(rounded.prebookingAmount, 124);
});

test('guests cannot exceed hall capacity', () => {
  assert.equal(rules.normalizeGuestsCount('100', 150), 100);
  assert.throws(() => rules.normalizeGuestsCount(151, 150), /cannot exceed hall capacity/);
  assert.throws(() => rules.normalizeGuestsCount(0, 150), /between 1 and/);
});

test('booking status transitions follow the workflow map', () => {
  assert.equal(rules.canTransition('awaiting_payment', 'payment_submitted'), true);
  assert.equal(rules.canTransition('payment_submitted', 'approved'), true);
  assert.equal(rules.canTransition('payment_submitted', 'payment_rejected'), true);
  assert.equal(rules.canTransition('approved', 'completed'), true);
  assert.equal(rules.canTransition('approved', 'cancelled'), true);
  assert.equal(rules.canTransition('awaiting_payment', 'approved'), false);
  assert.equal(rules.canTransition('completed', 'cancelled'), false);
  assert.equal(rules.canTransition('cancelled', 'awaiting_payment'), false);

  assert.throws(
    () => rules.assertStatusTransition('awaiting_payment', 'approved'),
    /cannot change/
  );
  assert.throws(
    () => rules.assertStatusTransition('awaiting_payment', 'unknown'),
    /Invalid booking status/
  );
});

test('only active statuses block a date slot', () => {
  rules.BLOCKING_BOOKING_STATUSES.forEach((status) => {
    assert.equal(rules.isBlockingStatus(status), true);
  });

  ['rejected', 'cancelled', 'expired'].forEach((status) => {
    assert.equal(rules.isBlockingStatus(status), false);
  });
});

test('booking schema has database-level unique constraints', () => {
  const indexes = Booking.schema.indexes();
  const slotIndex = indexes.find(([, options]) => options.name === 'uniq_active_booking_slot');
  const txnIndex = indexes.find(([, options]) => options.name === 'uniq_booking_transaction_id');

  assert.ok(slotIndex, 'active slot unique index must exist');
  assert.equal(slotIndex[1].unique, true);
  assert.deepEqual(slotIndex[0], { hallId: 1, eventDate: 1, timeSlot: 1 });

  assert.ok(txnIndex, 'transaction ID unique index must exist');
  assert.equal(txnIndex[1].unique, true);
});
