const express = require('express');
const router = express.Router();
const {
  getHalls,
  getManagerHalls,
  getHall,
  createHall,
  updateHall,
  deleteHall,
} = require('../controllers/hallController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').get(getHalls).post(protect, authorize('admin', 'manager'), upload.single('image'), createHall);
router.get('/manager', protect, authorize('manager'), getManagerHalls);
router
  .route('/:id')
  .get(getHall)
  .put(protect, authorize('admin', 'manager'), upload.single('image'), updateHall)
  .delete(protect, authorize('admin', 'manager'), deleteHall);

module.exports = router;
