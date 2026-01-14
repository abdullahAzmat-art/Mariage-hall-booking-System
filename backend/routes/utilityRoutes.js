const express = require('express');
const router = express.Router();
const { createMissingCommissionPayments } = require('../controllers/utilityController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin utility route to create missing commission payments
router.post('/create-missing-commissions', protect, authorize('admin'), createMissingCommissionPayments);

module.exports = router;
