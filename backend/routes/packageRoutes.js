const express = require('express');
const router = express.Router();
const {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').post(protect, authorize('admin', 'manager'), createPackage);
router.route('/:hallId').get(getPackages);
router
  .route('/:id')
  .put(protect, authorize('admin', 'manager'), updatePackage)
  .delete(protect, authorize('admin', 'manager'), deletePackage);

module.exports = router;
