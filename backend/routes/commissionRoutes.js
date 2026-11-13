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
const { validate } = require('../middleware/validate');
const upload = require('../middleware/uploadMiddleware');
const { idParams } = require('../validators/common');
const { rejectCommissionSchema } = require('../validators/commissionValidator');

// Manager routes
router.post(
    '/upload-proof/:id',
    protect,
    authorize('manager'),
    validate({ params: idParams }),
    upload.single('paymentProof'),
    uploadPaymentProof
);
router.get('/my-payments', protect, authorize('manager'), getManagerPayments);

// Admin routes
router.get('/pending', protect, authorize('admin'), getPendingPayments);
router.put('/verify/:id', protect, authorize('admin'), validate({ params: idParams }), verifyPayment);
router.put(
    '/reject/:id',
    protect,
    authorize('admin'),
    validate({ params: idParams, body: rejectCommissionSchema }),
    rejectPayment
);

module.exports = router;
