const express = require('express');
const router = express.Router();
const {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { idParams, hallIdParams } = require('../validators/common');
const {
  createPackageSchema,
  updatePackageSchema,
} = require('../validators/packageValidator');

router
  .route('/')
  .post(
    protect,
    authorize('admin', 'manager'),
    validate({ body: createPackageSchema }),
    createPackage
  );

router
  .route('/:hallId')
  .get(validate({ params: hallIdParams }), getPackages);

router
  .route('/:id')
  .put(
    protect,
    authorize('admin', 'manager'),
    validate({ params: idParams, body: updatePackageSchema }),
    updatePackage
  )
  .delete(
    protect,
    authorize('admin', 'manager'),
    validate({ params: idParams }),
    deletePackage
  );

module.exports = router;
