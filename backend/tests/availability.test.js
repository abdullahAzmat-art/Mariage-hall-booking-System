const test = require('node:test');
const assert = require('node:assert/strict');

const Booking = require('../models/bookingModel');
const Hall = require('../models/hallModel');
const availability = require('../services/availabilityService');

const HALL_ID = '64b000000000000000000001';
const FUTURE_DATE = '2099-06-01';

const chain = (rows) => ({
  select: () => ({
    lean: async () => rows,
  }),
});

const withStubs = async ({ hall, bookings = [] }, run) => {
  const originalHallFindById = Hall.findById;
  const originalBookingFind = Booking.find;
  const originalUpdateMany = Booking.updateMany;

  Hall.findById = async () => hall;
  Booking.find = () => chain(bookings);
  Booking.updateMany = async () => ({ modifiedCount: 0 });

  try {
    return await run();
  } finally {
    Hall.findById = originalHallFindById;
    Booking.find = originalBookingFind;
    Booking.updateMany = originalUpdateMany;
  }
};

const hall = {
  _id: HALL_ID,
  bookedDates: [],
  menu: [],
};

test('manager-blocked dates make the whole day unavailable', () => {
  const result = availability.evaluateSlotAvailability({
    hall: { bookedDates: ['2099-06-01'] },
    bookings: [],
    eventDateKey: '2099-06-01',
    timeSlot: 'Morning',
  });

  assert.equal(result.available, false);
  assert.equal(result.reason, 'blocked_by_manager');
});

test('an active booking blocks only its own time slot', () => {
  const bookings = [
    {
      _id: '64b000000000000000000010',
      eventDateKey: '2099-06-01',
      timeSlot: 'Evening',
      status: 'approved',
    },
  ];

  const morning = availability.evaluateSlotAvailability({
    hall,
    bookings,
    eventDateKey: '2099-06-01',
    timeSlot: 'Morning',
  });
  const evening = availability.evaluateSlotAvailability({
    hall,
    bookings,
    eventDateKey: '2099-06-01',
    timeSlot: 'evening',
  });

  assert.equal(morning.available, true);
  assert.equal(evening.available, false);
  assert.equal(evening.reason, 'slot_taken');
});

test('released statuses and the booking itself do not block a slot', () => {
  const cancelled = availability.evaluateSlotAvailability({
    hall,
    bookings: [
      {
        _id: '64b000000000000000000011',
        eventDateKey: '2099-06-01',
        timeSlot: 'Morning',
        status: 'cancelled',
      },
    ],
    eventDateKey: '2099-06-01',
    timeSlot: 'Morning',
  });

  const sameBooking = availability.evaluateSlotAvailability({
    hall,
    bookings: [
      {
        _id: '64b000000000000000000012',
        eventDateKey: '2099-06-01',
        timeSlot: 'Morning',
        status: 'payment_submitted',
      },
    ],
    eventDateKey: '2099-06-01',
    timeSlot: 'Morning',
    excludeBookingId: '64b000000000000000000012',
  });

  assert.equal(cancelled.available, true);
  assert.equal(sameBooking.available, true);
});

test('legacy Date event values compare by UTC date key', () => {
  const result = availability.evaluateSlotAvailability({
    hall,
    bookings: [
      {
        _id: '64b000000000000000000013',
        eventDate: new Date('2099-06-01T00:00:00.000Z'),
        timeSlot: 'Morning',
        status: 'awaiting_payment',
      },
    ],
    eventDateKey: '2099-06-01',
    timeSlot: 'Morning',
  });

  assert.equal(result.available, false);
  assert.equal(result.reason, 'slot_taken');
});

test('service checks manager blocks against the database model', async () => {
  await withStubs(
    {
      hall: { ...hall, bookedDates: ['2099-06-01'] },
    },
    async () => {
      const result = await availability.checkHallAvailability({
        hallId: HALL_ID,
        eventDate: '2099-06-01',
        timeSlot: 'Morning',
      });
      assert.equal(result.available, false);
      assert.equal(result.reason, 'blocked_by_manager');
    }
  );
});

test('service reports an active booking conflict', async () => {
  await withStubs(
    {
      hall,
      bookings: [
        {
          _id: '64b000000000000000000014',
          eventDateKey: '2099-06-01',
          timeSlot: 'Morning',
          status: 'approved',
        },
      ],
    },
    async () => {
      const result = await availability.checkHallAvailability({
        hallId: HALL_ID,
        eventDate: '2099-06-01',
        timeSlot: 'Morning',
      });
      assert.equal(result.available, false);
      assert.equal(result.reason, 'slot_taken');
    }
  );
});

test('service rejects past event dates', async () => {
  await withStubs({ hall }, async () => {
    const result = await availability.checkHallAvailability({
      hallId: HALL_ID,
      eventDate: '2020-01-01',
      timeSlot: 'Morning',
    });
    assert.equal(result.available, false);
    assert.equal(result.reason, 'past_date');
  });
});

test('hall availability payload exposes date keys without customer data', async () => {
  await withStubs(
    {
      hall: {
        ...hall,
        bookedDates: ['2099-07-01'],
      },
      bookings: [
        {
          _id: '64b000000000000000000015',
          eventDateKey: '2099-06-01',
          timeSlot: 'Evening',
          status: 'approved',
          customerId: 'should-not-be-returned',
        },
      ],
    },
    async () => {
      const payload = await availability.getHallAvailability(HALL_ID);

      assert.deepEqual(payload.blockedDates, ['2099-07-01']);
      assert.deepEqual(payload.bookings, [
        {
          bookingId: '64b000000000000000000015',
          eventDateKey: '2099-06-01',
          timeSlot: 'Evening',
          status: 'approved',
        },
      ]);
      assert.equal(payload.prebookingPercentage, 0.1);
      assert.equal(payload.bookings[0].customerId, undefined);
    }
  );
});
