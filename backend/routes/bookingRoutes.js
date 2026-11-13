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
const upload = require('../middleware/uploadMiddleware');

router
  .route('/')
  .post(protect, authorize('customer'), createBooking)
  .get(protect, authorize('admin', 'manager'), getBookings);

router.get('/hall/:hallId/availability', getHallAvailabilityStatus);

router.get('/hall/:hallId', getHallBookings);

router.get('/manager', protect, authorize('manager'), getManagerBookings);

router.get('/my', protect, authorize('customer'), getMyBookings);

router.put('/:id/status', protect, authorize('admin', 'manager'), updateBookingStatus);

router.put('/:id/payment-proof', protect, authorize('customer'), upload.single('paymentProof'), submitPaymentProof);

router.put('/:id/verify-payment', protect, authorize('admin', 'manager'), verifyPayment);

router.put('/:id/reject-payment', protect, authorize('admin', 'manager'), rejectPayment);

router.put('/:id/cancel', protect, authorize('customer'), cancelBooking);

router.put('/:id/reject', protect, authorize('admin', 'manager'), rejectBooking);

router.delete('/:id', protect, authorize('admin', 'manager'), deleteBooking);

router.post('/:id/custom-food', protect, authorize('customer'), addCustomFood);
router.patch('/:id/custom-food-status', protect, authorize('admin', 'manager'), updateCustomFoodStatus);

module.exports = router;
