const express = require('express');
const router = express.Router();
const { createComplaint, getMyComplaints, getAllComplaints, replyToComplaint, deleteComplaint } = require('../controllers/complaintController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');

router.post('/', optionalProtect, createComplaint); // Allow logged-in users to submit complaints easily
router.get('/my', protect, getMyComplaints);
router.get('/', protect, authorize('admin'), getAllComplaints);
router.put('/:id/reply', protect, authorize('admin'), replyToComplaint);
router.delete('/:id', protect, deleteComplaint);

module.exports = router;
