const test = require('node:test');
const assert = require('node:assert/strict');

const { validate } = require('../middleware/validate');
const { idParams } = require('../validators/common');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const {
  createBookingSchema,
  statusUpdateSchema,
  paymentProofSchema,
  customFoodSchema,
} = require('../validators/bookingValidator');
const {
  createHallSchema,
  updateHallSchema,
  updateAvailabilitySchema,
} = require('../validators/hallValidator');
const { createPackageSchema, updatePackageSchema } = require('../validators/packageValidator');
const { createComplaintSchema, replyComplaintSchema } = require('../validators/complaintValidator');
const { rejectCommissionSchema } = require('../validators/commissionValidator');
const {
  chatMessageSchema,
  chatStreamSchema,
  chatHistoryParamsSchema,
} = require('../validators/chatValidator');
const { ragUploadSchema, ragDeleteParamsSchema } = require('../validators/ragValidator');

const Hall = require('../models/hallModel');
const Package = require('../models/packageModel');
const packageController = require('../controllers/packageController');

const HALL_ID = '64b000000000000000000001';
const OTHER_HALL_ID = '64b000000000000000000002';
const PACKAGE_ID = '64b000000000000000000003';
const MANAGER_ID = '64b000000000000000000004';

const runMiddleware = (req, schemaMap) => {
  let nextCalled = false;
  let statusCode = null;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };

  validate(schemaMap)(req, res, () => {
    nextCalled = true;
  });

  return { req, nextCalled, statusCode, payload };
};

const callController = async (handler, { body = {}, params = {}, user }) => {
  const req = { body, params, user };
  let statusCode = 200;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
  };

  await handler(req, res);
  return { statusCode, payload };
};

const withModelStubs = async (stubs, run) => {
  const originals = {
    hallFindById: Hall.findById,
    packageCreate: Package.create,
    packageFindById: Package.findById,
    packageFindByIdAndUpdate: Package.findByIdAndUpdate,
  };

  const state = { createdWith: null, updatedWith: null, deleted: false };

  Hall.findById = async (id) => stubs.halls?.[String(id)] ?? null;
  Package.create = async (doc) => {
    state.createdWith = doc;
    return { ...doc, _id: PACKAGE_ID };
  };
  Package.findById = async () => {
    if (!stubs.pkg) return null;
    return {
      ...stubs.pkg,
      deleteOne: async () => {
        state.deleted = true;
      },
    };
  };
  Package.findByIdAndUpdate = async (id, update) => {
    state.updatedWith = update;
    return { _id: id, ...update };
  };

  try {
    await run(state);
  } finally {
    Hall.findById = originals.hallFindById;
    Package.create = originals.packageCreate;
    Package.findById = originals.packageFindById;
    Package.findByIdAndUpdate = originals.packageFindByIdAndUpdate;
  }

  return state;
};

// ── Auth ─────────────────────────────────────────────────────────────────────

test('registration trims and lowercases email and keeps the password untouched', () => {
  const result = registerSchema.safeParse({
    name: '  Ali Khan ',
    email: '  ALI@Example.COM ',
    password: ' pass word ',
    phone: '03001234567',
  });

  assert.equal(result.success, true);
  assert.equal(result.data.name, 'Ali Khan');
  assert.equal(result.data.email, 'ali@example.com');
  assert.equal(result.data.password, ' pass word ');
});

test('registration rejects invalid email, short password and missing fields', () => {
  const invalidEmail = registerSchema.safeParse({
    name: 'Ali',
    email: 'not-an-email',
    password: '12345678',
    phone: '03001234567',
  });
  assert.equal(invalidEmail.success, false);
  assert.equal(invalidEmail.error.issues[0].path.join('.'), 'email');

  const shortPassword = registerSchema.safeParse({
    name: 'Ali',
    email: 'ali@example.com',
    password: '1234567',
    phone: '03001234567',
  });
  assert.equal(shortPassword.success, false);
  assert.match(shortPassword.error.issues[0].message, /at least 8/);

  const missing = registerSchema.safeParse({});
  assert.equal(missing.success, false);
  assert.deepEqual(
    new Set(missing.error.issues.map((issue) => issue.path.join('.'))),
    new Set(['name', 'email', 'password', 'phone'])
  );
});

test('login accepts existing short passwords but still requires both fields', () => {
  const valid = loginSchema.safeParse({ email: ' Ali@Example.com ', password: '123456' });
  assert.equal(valid.success, true);
  assert.equal(valid.data.email, 'ali@example.com');

  const missingPassword = loginSchema.safeParse({ email: 'ali@example.com' });
  assert.equal(missingPassword.success, false);
  assert.equal(missingPassword.error.issues[0].path.join('.'), 'password');
});

test('validate returns a consistent 400 payload with field names', () => {
  const { nextCalled, statusCode, payload } = runMiddleware(
    { body: { email: 'bad', password: '' } },
    { body: loginSchema }
  );

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 400);
  assert.equal(payload.message, 'Validation failed');
  assert.deepEqual(
    payload.errors.map((error) => error.field),
    ['body.email', 'body.password']
  );
  assert.ok(payload.errors.every((error) => typeof error.message === 'string' && error.message));
});

test('validate replaces the body with normalized data and strips unknown fields', () => {
  const { req, nextCalled, statusCode } = runMiddleware(
    { body: { email: ' USER@Example.com ', password: 'secret', role: 'admin' } },
    { body: loginSchema }
  );

  assert.equal(nextCalled, true);
  assert.equal(statusCode, null);
  assert.equal(req.body.email, 'user@example.com');
  assert.equal(req.body.role, undefined);
});

test('validate reports invalid route params', () => {
  const { nextCalled, statusCode, payload } = runMiddleware(
    { params: { id: 'not-an-id' } },
    { params: idParams }
  );

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 400);
  assert.equal(payload.errors[0].field, 'params.id');
});

// ── Bookings ─────────────────────────────────────────────────────────────────

const bookingBody = (overrides = {}) => ({
  hallId: HALL_ID,
  eventDate: '2099-06-01',
  timeSlot: 'Morning',
  eventType: 'Wedding',
  phone: '0300 1234567',
  cnic: '12345-1234567-1',
  guestsCount: 100,
  ...overrides,
});

test('booking schema accepts multipart-style numbers and strips client totals', () => {
  const result = createBookingSchema.safeParse(
    bookingBody({
      guestsCount: '120',
      totalAmount: 1,
      customFood: [{ name: 'Biryani', quantity: '2', price: 1 }],
    })
  );

  assert.equal(result.success, true);
  assert.equal(result.data.guestsCount, 120);
  assert.equal(result.data.totalAmount, undefined);
  assert.equal(result.data.customFood[0].quantity, 2);
  assert.equal(result.data.customFood[0].price, undefined);
});

test('booking schema rejects missing, mistyped and invalid values', () => {
  assert.equal(createBookingSchema.safeParse({}).success, false);

  const badHall = createBookingSchema.safeParse(bookingBody({ hallId: 'abc' }));
  assert.equal(badHall.success, false);
  assert.equal(badHall.error.issues[0].path.join('.'), 'hallId');

  assert.equal(createBookingSchema.safeParse(bookingBody({ guestsCount: 'many' })).success, false);
  assert.equal(createBookingSchema.safeParse(bookingBody({ guestsCount: 0 })).success, false);
  assert.equal(createBookingSchema.safeParse(bookingBody({ eventDate: 123 })).success, false);
  assert.equal(createBookingSchema.safeParse(bookingBody({ customFood: 'rice' })).success, false);
  assert.equal(
    createBookingSchema.safeParse(bookingBody({ customFood: [{ quantity: 2 }] })).success,
    false
  );
});

test('booking status and payment schemas enforce allowed values', () => {
  assert.equal(statusUpdateSchema.safeParse({ status: 'approved' }).success, true);
  assert.equal(statusUpdateSchema.safeParse({ status: 'rejected', reason: 'No date' }).success, true);
  assert.equal(statusUpdateSchema.safeParse({ status: 'pending' }).success, false);
  assert.equal(statusUpdateSchema.safeParse({}).success, false);

  assert.equal(paymentProofSchema.safeParse({ transactionId: 'TX-1234' }).success, true);
  assert.equal(paymentProofSchema.safeParse({}).success, false);
  assert.equal(paymentProofSchema.safeParse({ transactionId: 1234 }).success, false);

  assert.equal(customFoodSchema.safeParse({ customFood: [] }).success, true);
  assert.equal(customFoodSchema.safeParse({ customFood: [{ itemName: 'Biryani' }] }).success, true);
});

// ── Halls ────────────────────────────────────────────────────────────────────

test('hall schema accepts multipart number strings and coerces them', () => {
  const result = createHallSchema.safeParse({
    name: 'Venuora Hall',
    location: 'Lahore',
    capacity: '250',
    price: '150000',
    description: 'A large hall',
    amenities: 'Parking,AC',
    image: 'https://example.com/hall.jpg',
  });

  assert.equal(result.success, true);
  assert.equal(result.data.capacity, 250);
  assert.equal(result.data.price, 150000);
});

test('hall update is partial and rejects invalid numbers and dates', () => {
  assert.equal(updateHallSchema.safeParse({}).success, true);
  assert.equal(updateHallSchema.safeParse({ title: 'ignored' }).success, true);
  assert.equal(updateHallSchema.safeParse({ capacity: 'many' }).success, false);
  assert.equal(updateHallSchema.safeParse({ capacity: '' }).success, false);

  assert.equal(updateAvailabilitySchema.safeParse({ bookedDates: [] }).success, true);
  assert.equal(
    updateAvailabilitySchema.safeParse({ bookedDates: ['2026-01-01', '2026-01-02'] }).success,
    true
  );
  assert.equal(updateAvailabilitySchema.safeParse({ bookedDates: ['01-01-2026'] }).success, false);
  assert.equal(updateAvailabilitySchema.safeParse({}).success, false);
});

// ── Packages ─────────────────────────────────────────────────────────────────

test('package schemas validate required fields and reject wrong types', () => {
  const valid = createPackageSchema.safeParse({
    hallId: HALL_ID,
    title: 'Gold',
    price: '50000',
    services: ['Decor', 'Catering'],
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.price, 50000);

  assert.equal(createPackageSchema.safeParse({ title: 'Gold' }).success, false);
  assert.equal(
    createPackageSchema.safeParse({ hallId: HALL_ID, title: 'Gold', price: -1, services: [] }).success,
    false
  );
  assert.equal(
    createPackageSchema.safeParse({ hallId: HALL_ID, title: 'Gold', price: 10, services: 'Decor' })
      .success,
    false
  );

  assert.equal(updatePackageSchema.safeParse({ title: 'Silver' }).success, true);
  assert.equal(updatePackageSchema.safeParse({}).success, false);
  assert.equal(updatePackageSchema.safeParse({ price: 'free' }).success, false);
});

// ── Complaints, commissions, chat, RAG ───────────────────────────────────────

test('complaint schemas validate email, required text and replies', () => {
  assert.equal(
    createComplaintSchema.safeParse({
      name: 'Ali',
      email: ' ALI@Example.com ',
      subject: 'Late booking',
      message: 'My booking was not confirmed.',
    }).success,
    true
  );

  const invalid = createComplaintSchema.safeParse({
    name: 'Ali',
    email: 'bad',
    subject: 'Late booking',
    message: 'Help',
  });
  assert.equal(invalid.success, false);
  assert.equal(invalid.error.issues[0].path.join('.'), 'email');

  assert.equal(createComplaintSchema.safeParse({ name: 'Ali' }).success, false);
  assert.equal(replyComplaintSchema.safeParse({ reply: 'We are checking this.' }).success, true);
  assert.equal(replyComplaintSchema.safeParse({ reply: '   ' }).success, false);
});

test('commission rejection requires a reason', () => {
  assert.equal(rejectCommissionSchema.safeParse({ reason: 'Invalid proof' }).success, true);
  assert.equal(rejectCommissionSchema.safeParse({ reason: '   ' }).success, false);
  assert.equal(rejectCommissionSchema.safeParse({}).success, false);
});

test('chat schemas bound message length and conversation ids', () => {
  assert.equal(chatMessageSchema.safeParse({ message: ' Hello ' }).success, true);
  assert.equal(chatMessageSchema.safeParse({ message: '   ' }).success, false);
  assert.equal(chatMessageSchema.safeParse({ message: 'x'.repeat(4001) }).success, false);

  assert.equal(
    chatStreamSchema.safeParse({ message: 'Hi', threadId: 'user:thread-1' }).success,
    true
  );
  assert.equal(chatStreamSchema.safeParse({ message: 'Hi', threadId: 'x'.repeat(201) }).success, false);
  assert.equal(chatStreamSchema.safeParse({ message: 'Hi', threadId: 5 }).success, false);

  assert.equal(chatHistoryParamsSchema.safeParse({ otherUserId: HALL_ID }).success, true);
  assert.equal(chatHistoryParamsSchema.safeParse({ otherUserId: 'nope' }).success, false);
});

test('RAG schemas validate upload metadata and delete parameters', () => {
  assert.equal(ragUploadSchema.safeParse({}).success, true);
  assert.equal(ragUploadSchema.safeParse({ name: 'Price list' }).success, true);
  assert.equal(ragUploadSchema.safeParse({ name: '   ' }).success, false);
  assert.equal(ragUploadSchema.safeParse({ name: 42 }).success, false);

  assert.equal(ragDeleteParamsSchema.safeParse({ id: PACKAGE_ID }).success, true);
  assert.equal(ragDeleteParamsSchema.safeParse({ id: 'invalid' }).success, false);
});

// ── Package ownership ────────────────────────────────────────────────────────

test('manager cannot create a package for a hall they do not own', async () => {
  let result;
  const state = await withModelStubs(
    { halls: { [OTHER_HALL_ID]: { _id: OTHER_HALL_ID, manager: 'someone-else' } } },
    async () => {
      result = await callController(packageController.createPackage, {
        body: { hallId: OTHER_HALL_ID, title: 'Gold', price: 1000, services: ['Decor'] },
        user: { id: MANAGER_ID, role: 'manager' },
      });
    }
  );

  assert.equal(result.statusCode, 403);
  assert.match(result.payload.message, /Not authorized/);
  assert.equal(state.createdWith, null);
});

test('manager can create a package for their own hall', async () => {
  let result;
  const state = await withModelStubs(
    { halls: { [HALL_ID]: { _id: HALL_ID, manager: MANAGER_ID } } },
    async () => {
      result = await callController(packageController.createPackage, {
        body: { hallId: HALL_ID, title: 'Gold', price: 1000, services: ['Decor'] },
        user: { id: MANAGER_ID, role: 'manager' },
      });
    }
  );

  assert.equal(result.statusCode, 201);
  assert.equal(state.createdWith.hallId, HALL_ID);
  assert.equal(state.createdWith.title, 'Gold');
});

test('admin can create a package for any hall', async () => {
  let result;
  await withModelStubs(
    { halls: { [OTHER_HALL_ID]: { _id: OTHER_HALL_ID, manager: 'someone-else' } } },
    async () => {
      result = await callController(packageController.createPackage, {
        body: { hallId: OTHER_HALL_ID, title: 'Gold', price: 1000, services: ['Decor'] },
        user: { id: '64b000000000000000000009', role: 'admin' },
      });
    }
  );

  assert.equal(result.statusCode, 201);
});

test('manager cannot update or delete a package from another hall', async () => {
  let updateResult;
  let deleteResult;
  const state = await withModelStubs(
    {
      halls: { [OTHER_HALL_ID]: { _id: OTHER_HALL_ID, manager: 'someone-else' } },
      pkg: { _id: PACKAGE_ID, hallId: OTHER_HALL_ID },
    },
    async () => {
      updateResult = await callController(packageController.updatePackage, {
        params: { id: PACKAGE_ID },
        body: { title: 'Hijacked' },
        user: { id: MANAGER_ID, role: 'manager' },
      });

      deleteResult = await callController(packageController.deletePackage, {
        params: { id: PACKAGE_ID },
        user: { id: MANAGER_ID, role: 'manager' },
      });
    }
  );

  assert.equal(updateResult.statusCode, 403);
  assert.equal(deleteResult.statusCode, 403);
  assert.equal(state.updatedWith, null);
  assert.equal(state.deleted, false);
});

test('manager update only writes allow-listed fields', async () => {
  let result;
  const state = await withModelStubs(
    {
      halls: { [HALL_ID]: { _id: HALL_ID, manager: MANAGER_ID } },
      pkg: { _id: PACKAGE_ID, hallId: HALL_ID },
    },
    async () => {
      result = await callController(packageController.updatePackage, {
        params: { id: PACKAGE_ID },
        body: { title: 'Silver', manager: 'attacker', _id: 'bad-id', rating: 5 },
        user: { id: MANAGER_ID, role: 'manager' },
      });
    }
  );

  assert.equal(result.statusCode, 200);
  assert.deepEqual(state.updatedWith, { title: 'Silver' });
});

test('manager cannot move a package to a hall they do not own', async () => {
  let result;
  const state = await withModelStubs(
    {
      halls: {
        [HALL_ID]: { _id: HALL_ID, manager: MANAGER_ID },
        [OTHER_HALL_ID]: { _id: OTHER_HALL_ID, manager: 'someone-else' },
      },
      pkg: { _id: PACKAGE_ID, hallId: HALL_ID },
    },
    async () => {
      result = await callController(packageController.updatePackage, {
        params: { id: PACKAGE_ID },
        body: { hallId: OTHER_HALL_ID },
        user: { id: MANAGER_ID, role: 'manager' },
      });
    }
  );

  assert.equal(result.statusCode, 403);
  assert.equal(state.updatedWith, null);
});
