const Hall = require('../models/hallModel');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

class HallValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

const isOwner = (hall, user) =>
  user.role === 'admin' || hall.manager.toString() === user.id;

const readString = (value, field, maxLength) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HallValidationError(`${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HallValidationError(`${field} is too long`);
  }
  return trimmed;
};

const readNumber = (value, field, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}) => {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    throw new HallValidationError(`${field} must be a number`);
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new HallValidationError(`${field} must be a number`);
  }
  if (integer && !Number.isInteger(number)) {
    throw new HallValidationError(`${field} must be a whole number`);
  }
  if (number < min || number > max) {
    throw new HallValidationError(`${field} is out of range`);
  }
  return number;
};

const readOptionalString = (value, field, maxLength) => {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    return undefined;
  }
  return readString(value, field, maxLength);
};

const readAmenities = (value) => {
  const items = typeof value === 'string' ? value.split(',') : value;

  if (!Array.isArray(items)) {
    throw new HallValidationError('amenities must be a list');
  }

  const amenities = items
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  if (amenities.length > 50) {
    throw new HallValidationError('Too many amenities');
  }
  if (amenities.some((item) => item.length > 100)) {
    throw new HallValidationError('Amenity name is too long');
  }

  return amenities;
};

const readMenu = (value) => {
  let items = value;

  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (error) {
      throw new HallValidationError('menu must be valid JSON');
    }
  }

  if (!Array.isArray(items)) {
    throw new HallValidationError('menu must be a list');
  }
  if (items.length > 200) {
    throw new HallValidationError('Too many menu items');
  }

  return items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new HallValidationError(`menu[${index}] is invalid`);
    }

    const parsed = {
      name: readString(item.name, `menu[${index}].name`, 200),
      price: readNumber(item.price, `menu[${index}].price`, { min: 0, max: 10000000 }),
    };

    if (item.category !== undefined) {
      parsed.category = readOptionalString(item.category, `menu[${index}].category`, 100) || '';
    }
    if (item.image !== undefined) {
      parsed.image = readOptionalString(item.image, `menu[${index}].image`, 2000) || '';
    }

    return parsed;
  });
};

const resolveImage = (req, required) => {
  if (req.file) return req.file.path;
  if (req.body.image !== undefined) {
    return readString(req.body.image, 'image', 2000);
  }
  if (required) {
    throw new HallValidationError('image is required');
  }
  return undefined;
};

// Only these fields may be set by a manager. Protected fields such as manager,
// rating, reviews and bookedDates are never read from the request body here.
const buildHallFields = (req, { required }) => {
  const body = req.body || {};
  const fields = {};

  if (required || body.name !== undefined) {
    fields.name = readString(body.name, 'name', 100);
  }
  if (required || body.location !== undefined) {
    fields.location = readString(body.location, 'location', 200);
  }
  if (required || body.capacity !== undefined) {
    fields.capacity = readNumber(body.capacity, 'capacity', { min: 1, max: 100000, integer: true });
  }
  if (required || body.price !== undefined) {
    fields.price = readNumber(body.price, 'price', { min: 0, max: 100000000 });
  }
  if (required || body.description !== undefined) {
    fields.description = readString(body.description, 'description', 5000);
  }
  if (body.amenities !== undefined) {
    fields.amenities = readAmenities(body.amenities);
  }
  if (body.menu !== undefined) {
    fields.menu = readMenu(body.menu);
  }

  const image = resolveImage(req, required);
  if (image !== undefined) {
    fields.image = image;
  }

  return fields;
};

const sendError = (res, error) => {
  if (error.status === 400 || error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: error.message });
};

// @desc    Get all halls
// @route   GET /api/halls
// @access  Public
const getHalls = async (req, res) => {
  try {
    const halls = await Hall.find();
    res.status(200).json(halls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get manager halls
// @route   GET /api/halls/manager
// @access  Private/Manager
const getManagerHalls = async (req, res) => {
  try {
    const halls = await Hall.find({ manager: req.user.id });
    res.status(200).json(halls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single hall
// @route   GET /api/halls/:id
// @access  Public
const getHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }
    res.status(200).json(hall);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new hall
// @route   POST /api/halls
// @access  Private/Admin/Manager
const createHall = async (req, res) => {
  try {
    const fields = buildHallFields(req, { required: true });

    // Ownership always comes from the authenticated user, never the body.
    const hall = await Hall.create({
      ...fields,
      manager: req.user.id,
    });
    res.status(201).json(hall);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Update hall
// @route   PUT /api/halls/:id
// @access  Private/Admin/Manager
const updateHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    if (!isOwner(hall, req.user)) {
      return res.status(403).json({ message: 'Not authorized to update this hall' });
    }

    const fields = buildHallFields(req, { required: false });

    const updatedHall = await Hall.findByIdAndUpdate(
      req.params.id,
      fields,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedHall);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Update hall availability (booked dates)
// @route   PUT /api/halls/:id/availability
// @access  Private/Admin/Manager (own hall)
const updateHallAvailability = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    if (!isOwner(hall, req.user)) {
      return res.status(403).json({ message: 'Not authorized to update this hall' });
    }

    const { bookedDates } = req.body;

    if (!Array.isArray(bookedDates)) {
      return res.status(400).json({ message: 'bookedDates must be a list of dates' });
    }
    if (bookedDates.length > 3660) {
      return res.status(400).json({ message: 'Too many booked dates' });
    }

    const normalized = [...new Set(bookedDates.map((date) => {
      if (typeof date !== 'string' || !DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) {
        throw new HallValidationError('bookedDates must use YYYY-MM-DD format');
      }
      return date;
    }))];

    const updatedHall = await Hall.findByIdAndUpdate(
      req.params.id,
      { bookedDates: normalized },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedHall);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Delete hall
// @route   DELETE /api/halls/:id
// @access  Private/Admin/Manager
const deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    if (!isOwner(hall, req.user)) {
      return res.status(403).json({ message: 'Not authorized to delete this hall' });
    }

    await hall.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHalls,
  getManagerHalls,
  getHall,
  createHall,
  updateHall,
  updateHallAvailability,
  deleteHall,
};
