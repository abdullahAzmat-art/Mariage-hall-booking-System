const test = require('node:test');
const assert = require('node:assert/strict');

const CommissionPayment = require('../models/commissionPaymentModel');
const Hall = require('../models/hallModel');
const User = require('../models/userModel');
const commissionController = require('../controllers/commissionController');

const BOOKING_ID = '64b000000000000000000003';
const MANAGER_ID = '64b000000000000000000005';

const withStubs = async (stubs, run) => {
  const originals = {
    findOneAndUpdate: CommissionPayment.findOneAndUpdate,
    findOne: CommissionPayment.findOne,
    updateMany: CommissionPayment.updateMany,
    deleteMany: Hall.deleteMany,
    findByIdAndDelete: User.findByIdAndDelete,
    commissionDelete: CommissionPayment.findByIdAndDelete,
  };

  CommissionPayment.findOneAndUpdate = stubs.findOneAndUpdate;
  CommissionPayment.findOne = stubs.findOne;
  CommissionPayment.updateMany = stubs.updateMany || (async () => ({ modifiedCount: 0 }));
  CommissionPayment.findByIdAndDelete = async () => {
    throw new Error('commission history must not be deleted');
  };
  Hall.deleteMany = async () => {
    throw new Error('halls must not be deleted for overdue commission');
  };
  User.findByIdAndDelete = async () => {
    throw new Error('manager accounts must not be deleted for overdue commission');
  };

  try {
    return await run();
  } finally {
    CommissionPayment.findOneAndUpdate = originals.findOneAndUpdate;
    CommissionPayment.findOne = originals.findOne;
    CommissionPayment.updateMany = originals.updateMany;
    CommissionPayment.findByIdAndDelete = originals.commissionDelete;
    Hall.deleteMany = originals.deleteMany;
    User.findByIdAndDelete = originals.findByIdAndDelete;
  }
};

test('commission creation is an idempotent upsert keyed by booking', async () => {
  let captured = null;

  await withStubs(
    {
      findOneAndUpdate: async (filter, update, options) => {
        captured = { filter, update, options };
        return { _id: 'payment-1', bookingId: BOOKING_ID, status: 'pending' };
      },
      findOne: async () => null,
    },
    async () => {
      const payment = await commissionController.createCommissionPayment(
        BOOKING_ID,
        MANAGER_ID,
        21000
      );

      assert.equal(payment.bookingId, BOOKING_ID);
    }
  );

  assert.deepEqual(captured.filter, { bookingId: BOOKING_ID });
  assert.equal(captured.options.upsert, true);
  assert.equal(captured.update.$setOnInsert.amount, 21000);
  assert.equal(captured.update.$setOnInsert.status, 'pending');
});

test('a concurrent commission insert returns the existing record', async () => {
  const duplicate = Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
  const existing = { _id: 'payment-2', bookingId: BOOKING_ID, status: 'pending' };

  await withStubs(
    {
      findOneAndUpdate: async () => {
        throw duplicate;
      },
      findOne: async () => existing,
    },
    async () => {
      const payment = await commissionController.createCommissionPayment(
        BOOKING_ID,
        MANAGER_ID,
        21000
      );
      assert.equal(payment, existing);
    }
  );
});

test('overdue commissions are marked, never deleted', async () => {
  let updateArgs = null;

  await withStubs(
    {
      findOneAndUpdate: async () => null,
      findOne: async () => null,
      updateMany: async (filter, update) => {
        updateArgs = { filter, update };
        return { modifiedCount: 2 };
      },
    },
    async () => {
      // Throwing stubs for deleteMany/findByIdAndDelete would fail this call
      // if the controller still destroyed records.
      await commissionController.checkOverduePayments();
    }
  );

  assert.deepEqual(updateArgs.filter.status, 'pending');
  assert.deepEqual(updateArgs.update, { $set: { status: 'overdue' } });
});

test('commission schema enforces one record per booking', () => {
  const indexes = CommissionPayment.schema.indexes();
  const uniqueIndex = indexes.find(([, options]) => options.name === 'uniq_commission_per_booking');

  assert.ok(uniqueIndex, 'unique commission booking index must exist');
  assert.equal(uniqueIndex[1].unique, true);
  assert.deepEqual(uniqueIndex[0], { bookingId: 1 });
});
