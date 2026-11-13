const express = require('express');
const router = express.Router();
const { createComplaint, getMyComplaints, getAllComplaints, replyToComplaint, deleteComplaint } = require('../controllers/complaintController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { idParams } = require('../validators/common');
const { createComplaintSchema, replyComplaintSchema } = require('../validators/complaintValidator');

router.post('/', optionalProtect, validate({ body: createComplaintSchema }), createComplaint); // Allow logged-in users to submit complaints easily
router.get('/my', protect, getMyComplaints);
router.get('/', protect, authorize('admin'), getAllComplaints);
router.put(
  '/:id/reply',
  protect,
  authorize('admin'),
  validate({ params: idParams, body: replyComplaintSchema }),
  replyToComplaint
);
router.delete('/:id', protect, validate({ params: idParams }), deleteComplaint);

module.exports = router;
