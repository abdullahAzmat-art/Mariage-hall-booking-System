const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getMyBookings,
  updateBookingStatus,
  deleteBooking,
  submitPaymentProof,
  verifyPayment,
  rejectPayment,
  addCustomFood,
  updateCustomFoodStatus,
  getManagerBookings,
  getHallBookings,
  getHallAvailabilityStatus,
  cancelBooking,
  rejectBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/uploadMiddleware');
const {
  createBookingSchema,
  statusUpdateSchema,
  paymentProofSchema,
  cancelBookingSchema,
  rejectBookingSchema,
  customFoodSchema,
  customFoodStatusSchema,
  idParamsSchema,
  hallIdParamsSchema,
} = require('../validators/bookingValidator');

router
  .route('/')
  .post(protect, authorize('customer'), validate({ body: createBookingSchema }), createBooking)
  .get(protect, authorize('admin', 'manager'), getBookings);

router.get(
  '/hall/:hallId/availability',
  validate({ params: hallIdParamsSchema }),
  getHallAvailabilityStatus
);

router.get(
  '/hall/:hallId',
  validate({ params: hallIdParamsSchema }),
  getHallBookings
);

router.get('/manager', protect, authorize('manager'), getManagerBookings);

router.get('/my', protect, authorize('customer'), getMyBookings);

router.put(
  '/:id/status',
  protect,
  authorize('admin', 'manager'),
  validate({ params: idParamsSchema, body: statusUpdateSchema }),
  updateBookingStatus
);

router.put(
  '/:id/payment-proof',
  protect,
  authorize('customer'),
  validate({ params: idParamsSchema }),
  upload.single('paymentProof'),
  validate({ body: paymentProofSchema }),
  submitPaymentProof
);

router.put(
  '/:id/verify-payment',
  protect,
  authorize('admin', 'manager'),
  validate({ params: idParamsSchema }),
  verifyPayment
);

router.put(
  '/:id/reject-payment',
  protect,
  authorize('admin', 'manager'),
  validate({ params: idParamsSchema }),
  rejectPayment
);

router.put(
  '/:id/cancel',
  protect,
  authorize('customer'),
  validate({ params: idParamsSchema, body: cancelBookingSchema }),
  cancelBooking
);

router.put(
  '/:id/reject',
  protect,
  authorize('admin', 'manager'),
  validate({ params: idParamsSchema, body: rejectBookingSchema }),
  rejectBooking
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'manager'),
  validate({ params: idParamsSchema }),
  deleteBooking
);

router.post(
  '/:id/custom-food',
  protect,
  authorize('customer'),
  validate({ params: idParamsSchema, body: customFoodSchema }),
  addCustomFood
);

router.patch(
  '/:id/custom-food-status',
  protect,
  authorize('admin', 'manager'),
  validate({ params: idParamsSchema, body: customFoodStatusSchema }),
  updateCustomFoodStatus
);

module.exports = router;
