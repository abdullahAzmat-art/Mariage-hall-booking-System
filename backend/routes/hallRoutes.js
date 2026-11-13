const express = require('express');
const router = express.Router();
const {
  getHalls,
  getManagerHalls,
  getHall,
  createHall,
  updateHall,
  updateHallAvailability,
  deleteHall,
} = require('../controllers/hallController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/uploadMiddleware');
const { idParams } = require('../validators/common');
const {
  createHallSchema,
  updateHallSchema,
  updateAvailabilitySchema,
} = require('../validators/hallValidator');

router
  .route('/')
  .get(getHalls)
  .post(
    protect,
    authorize('admin', 'manager'),
    upload.single('image'),
    validate({ body: createHallSchema }),
    createHall
  );

router.get('/manager', protect, authorize('manager'), getManagerHalls);

router.put(
  '/:id/availability',
  protect,
  authorize('admin', 'manager'),
  validate({ params: idParams, body: updateAvailabilitySchema }),
  updateHallAvailability
);

router
  .route('/:id')
  .get(validate({ params: idParams }), getHall)
  .put(
    protect,
    authorize('admin', 'manager'),
    validate({ params: idParams }),
    upload.single('image'),
    validate({ body: updateHallSchema }),
    updateHall
  )
  .delete(protect, authorize('admin', 'manager'), validate({ params: idParams }), deleteHall);

module.exports = router;
