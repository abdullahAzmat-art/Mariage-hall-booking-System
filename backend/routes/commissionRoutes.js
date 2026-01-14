const express = require('express');
const router = express.Router();
const {
    uploadPaymentProof,
    getManagerPayments,
    getPendingPayments,
    verifyPayment,
    rejectPayment
} = require('../controllers/commissionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Manager routes
router.post('/upload-proof/:id', protect, authorize('manager'), upload.single('paymentProof'), uploadPaymentProof);
router.get('/my-payments', protect, authorize('manager'), getManagerPayments);

// Admin routes
router.get('/pending', protect, authorize('admin'), getPendingPayments);
router.put('/verify/:id', protect, authorize('admin'), verifyPayment);
router.put('/reject/:id', protect, authorize('admin'), rejectPayment);

module.exports = router;
