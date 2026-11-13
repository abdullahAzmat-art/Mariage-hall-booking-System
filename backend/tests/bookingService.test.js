const test = require('node:test');
const assert = require('node:assert/strict');

const Booking = require('../models/bookingModel');
const Hall = require('../models/hallModel');
const Package = require('../models/packageModel');
const bookingService = require('../services/bookingService');
const { getBusinessDateKey } = require('../utils/dateKey');

const CUSTOMER_ID = '64b000000000000000000002';
const HALL_ID = '64b000000000000000000001';
const PACKAGE_ID = '64b000000000000000000099';
const BOOKING_ID = '64b000000000000000000003';
const FUTURE_DATE = '2099-06-01';

const hall = {
  _id: HALL_ID,
  price: 3000,
  capacity: 200,
  menu: [
    { name: 'Chicken Biryani', price: 500 },
    { name: 'Salad', price: 100 },
  ],
  bookedDates: [],
};

const activeBooking = {
  _id: '64b000000000000000000004',
  eventDateKey: FUTURE_DATE,
  timeSlot: 'Morning',
  status: 'approved',
};

const withStubs = async (stubs, run) => {
  const originals = {
    hallFindById: Hall.findById,
    bookingFind: Booking.find,
    bookingCreate: Booking.create,
    bookingUpdateMany: Booking.updateMany,
    packageFindOne: Package.findOne,
  };

  Hall.findById = async () => stubs.hall;
  Booking.find = () => ({
    select: () => ({
      lean: async () => stubs.bookings || [],
    }),
  });
  Booking.create = async (doc) => ({ ...doc, _id: BOOKING_ID });
  Booking.updateMany = async () => ({ modifiedCount: 0 });
  Package.findOne = async () => stubs.package || null;

  if (stubs.create) Booking.create = stubs.create;

  try {
    return await run();
  } finally {
    Hall.findById = originals.hallFindById;
    Booking.find = originals.bookingFind;
    Booking.create = originals.bookingCreate;
    Booking.updateMany = originals.bookingUpdateMany;
    Package.findOne = originals.packageFindOne;
  }
};

const validPayload = (overrides = {}) => ({
  hallId: HALL_ID,
  eventDate: FUTURE_DATE,
  timeSlot: 'Morning',
  eventType: 'Wedding',
  phone: '0300 1234567',
  cnic: '12345-1234567-1',
  guestsCount: 100,
  customFood: [{ itemName: 'Chicken Biryani', price: 1, quantity: 1 }],
  // A malicious client value that must be ignored.
  totalAmount: 1,
  ...overrides,
});

test('createBookingForUser saves all fields and recalculates trusted totals', async () => {
  await withStubs({ hall, bookings: [] }, async () => {
    const booking = await bookingService.createBookingForUser({
      customerId: CUSTOMER_ID,
      payload: validPayload(),
    });

    assert.equal(booking.eventDateKey, FUTURE_DATE);
    assert.equal(booking.timeSlot, 'Morning');
    assert.equal(booking.eventType, 'Wedding');
    assert.equal(booking.phone, '0300 1234567');
    assert.equal(booking.cnic, '12345-1234567-1');
    assert.equal(booking.guestsCount, 100);

    assert.equal(booking.hallPrice, 3000);
    assert.equal(booking.foodPerHead, 500);
    assert.equal(booking.customSeatPrice, 3500);
    assert.equal(booking.totalAmount, 350000);
    assert.equal(booking.prebookingAmount, 35000);
    assert.equal(booking.prebookingPercentage, 0.1);

    assert.equal(booking.customFood[0].price, 500);
    assert.equal(booking.customFood[0].quantity, 1);
    assert.equal(booking.customFoodStatus, 'pending');

    assert.equal(booking.status, 'awaiting_payment');
    assert.equal(booking.paymentStatus, 'unpaid');
    assert.ok(booking.paymentExpiresAt instanceof Date);
    assert.equal(booking.eventDate.toISOString(), `${FUTURE_DATE}T00:00:00.000Z`);
  });
});

test('package price is loaded from the database, not from the client', async () => {
  await withStubs(
    {
      hall,
      bookings: [],
      package: { _id: PACKAGE_ID, price: 50000 },
    },
    async () => {
      const booking = await bookingService.createBookingForUser({
        customerId: CUSTOMER_ID,
        payload: validPayload({
          packageId: PACKAGE_ID,
          packagePrice: 1,
          customFood: [],
        }),
      });

      assert.equal(booking.packagePrice, 50000);
      assert.equal(booking.totalAmount, 350000);
    }
  );
});

test('a concurrent booking that loses the unique-index race returns 409', async () => {
  const duplicateError = Object.assign(new Error('E11000 duplicate key'), { code: 11000 });

  await withStubs(
    {
      hall,
      bookings: [],
      create: async () => {
        throw duplicateError;
      },
    },
    async () => {
      await assert.rejects(
        bookingService.createBookingForUser({
          customerId: CUSTOMER_ID,
          payload: validPayload(),
        }),
        (error) => {
          assert.equal(error.status, 409);
          assert.equal(error.code, 'slot_taken');
          return true;
        }
      );
    }
  );
});

test('an existing active slot is rejected before insert', async () => {
  let createCalled = false;

  await withStubs(
    {
      hall,
      bookings: [activeBooking],
      create: async () => {
        createCalled = true;
      },
    },
    async () => {
      await assert.rejects(
        bookingService.createBookingForUser({
          customerId: CUSTOMER_ID,
          payload: validPayload(),
        }),
        (error) => {
          assert.equal(error.status, 409);
          assert.equal(error.code, 'slot_taken');
          return true;
        }
      );
    }
  );

  assert.equal(createCalled, false);
});

test('validation errors are returned before any booking is written', async () => {
  await withStubs({ hall, bookings: [] }, async () => {
    await assert.rejects(
      bookingService.createBookingForUser({
        customerId: CUSTOMER_ID,
        payload: validPayload({ cnic: '123' }),
      }),
      /cnic must contain exactly 13 digits/
    );

    await assert.rejects(
      bookingService.createBookingForUser({
        customerId: CUSTOMER_ID,
        payload: validPayload({ guestsCount: 201 }),
      }),
      /cannot exceed hall capacity/
    );

    await assert.rejects(
      bookingService.createBookingForUser({
        customerId: CUSTOMER_ID,
        payload: validPayload({ eventDate: '2020-01-01' }),
      }),
      /cannot be in the past/
    );

    await assert.rejects(
      bookingService.createBookingForUser({
        customerId: CUSTOMER_ID,
        payload: validPayload({ timeSlot: 'Midnight' }),
      }),
      /timeSlot must be one of/
    );

    await assert.rejects(
      bookingService.createBookingForUser({
        customerId: CUSTOMER_ID,
        payload: validPayload({ customFood: [{ itemName: 'Pizza', quantity: 1 }] }),
      }),
      /not available on this hall's menu/
    );
  });
});

test('manager-blocked dates are rejected by the creation service', async () => {
  await withStubs(
    {
      hall: { ...hall, bookedDates: [FUTURE_DATE] },
      bookings: [],
    },
    async () => {
      await assert.rejects(
        bookingService.createBookingForUser({
          customerId: CUSTOMER_ID,
          payload: validPayload(),
        }),
        (error) => {
          assert.equal(error.status, 409);
          assert.equal(error.code, 'blocked_by_manager');
          return true;
        }
      );
    }
  );
});

test('cancellation rules allow early cancellation but block late or terminal bookings', () => {
  assert.doesNotThrow(() =>
    bookingService.assertCanCancel({ status: 'awaiting_payment', eventDateKey: FUTURE_DATE })
  );
  assert.doesNotThrow(() =>
    bookingService.assertCanCancel({ status: 'approved', eventDateKey: FUTURE_DATE })
  );

  assert.throws(
    () => bookingService.assertCanCancel({
      status: 'approved',
      eventDateKey: getBusinessDateKey(),
    }),
    /at least 7 days before the event/
  );
  assert.throws(
    () => bookingService.assertCanCancel({ status: 'completed', eventDateKey: FUTURE_DATE }),
    /cannot be cancelled/
  );
  assert.throws(
    () => bookingService.assertCanCancel({ status: 'payment_submitted', eventDateKey: FUTURE_DATE }),
    /cannot be cancelled/
  );
});

test('approval re-check ignores the booking itself but rejects a competing slot', async () => {
  const ownBooking = {
    _id: BOOKING_ID,
    hallId: { _id: HALL_ID },
    eventDateKey: FUTURE_DATE,
    timeSlot: 'Morning',
  };

  await withStubs(
    {
      hall,
      bookings: [
        {
          _id: BOOKING_ID,
          eventDateKey: FUTURE_DATE,
          timeSlot: 'Morning',
          status: 'payment_submitted',
        },
      ],
    },
    async () => {
      await assert.doesNotReject(bookingService.verifyBookingAvailability(ownBooking));
    }
  );

  await withStubs(
    {
      hall,
      bookings: [activeBooking],
    },
    async () => {
      await assert.rejects(
        bookingService.verifyBookingAvailability(ownBooking),
        (error) => {
          assert.equal(error.status, 409);
          return true;
        }
      );
    }
  );
});
