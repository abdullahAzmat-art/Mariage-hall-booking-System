const Package = require('../models/packageModel');
const Hall = require('../models/hallModel');

const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const sendError = (res, error, fallback) => {
  if (error && Number.isInteger(error.status)) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return res.status(400).json({ message: error.message });
  }

  console.error('Package error:', error);
  return res.status(500).json({ message: fallback });
};

// Ownership is enforced here, not in Zod: managers may only manage packages
// for halls they own. Admins may manage all halls.
const assertHallAccess = async (hallId, user) => {
  const hall = await Hall.findById(hallId);

  if (!hall) {
    throw createError('Hall not found', 404);
  }

  if (user.role !== 'admin' && hall.manager.toString() !== user.id) {
    throw createError('Not authorized to manage packages for this hall', 403);
  }

  return hall;
};

// Allow-list package fields so the request body can never set unexpected data.
const readPackageFields = (body) => {
  const fields = {};
  if (body.title !== undefined) fields.title = body.title;
  if (body.price !== undefined) fields.price = body.price;
  if (body.services !== undefined) fields.services = body.services;
  return fields;
};

// @desc    Get packages for a hall
// @route   GET /api/packages/:hallId
// @access  Public
const getPackages = async (req, res) => {
  try {
    const packages = await Package.find({ hallId: req.params.hallId });
    res.status(200).json(packages);
  } catch (error) {
    sendError(res, error, 'Could not load packages');
  }
};

// @desc    Create new package
// @route   POST /api/packages
// @access  Private/Admin/Manager (own hall)
const createPackage = async (req, res) => {
  try {
    await assertHallAccess(req.body.hallId, req.user);

    const newPackage = await Package.create({
      hallId: req.body.hallId,
      ...readPackageFields(req.body),
    });
    res.status(201).json(newPackage);
  } catch (error) {
    sendError(res, error, 'Could not create package');
  }
};

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Private/Admin/Manager (own hall)
const updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    await assertHallAccess(pkg.hallId, req.user);

    // Moving a package requires ownership of the destination hall as well.
    if (req.body.hallId !== undefined && String(req.body.hallId) !== String(pkg.hallId)) {
      await assertHallAccess(req.body.hallId, req.user);
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      {
        ...readPackageFields(req.body),
        ...(req.body.hallId !== undefined ? { hallId: req.body.hallId } : {}),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedPackage);
  } catch (error) {
    sendError(res, error, 'Could not update package');
  }
};

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Private/Admin/Manager (own hall)
const deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    await assertHallAccess(pkg.hallId, req.user);
    await pkg.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    sendError(res, error, 'Could not delete package');
  }
};

module.exports = {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
};
