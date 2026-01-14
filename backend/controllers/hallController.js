const Hall = require('../models/hallModel');

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
    console.log('Create Hall Body:', req.body);
    console.log('Create Hall File:', req.file);
    let image = '';
    if (req.file) {
      image = req.file.path;
    } else if (req.body.image) {
      image = req.body.image;
    }

    // Parse amenities if it's a string
    let amenities = req.body.amenities;
    if (typeof amenities === 'string') {
      amenities = amenities.split(',').map(item => item.trim());
    }

    // Parse menu if it's a string
    let menu = req.body.menu || [];
    if (typeof menu === 'string') {
      try {
        menu = JSON.parse(menu);
      } catch (e) {
        console.error('Error parsing menu JSON', e);
        menu = [];
      }
    }

    const hall = await Hall.create({
      ...req.body,
      image,
      amenities,
      menu,
      manager: req.body.manager || req.user.id,
    });
    res.status(201).json(hall);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

    let image = req.body.image || hall.image;
    if (req.file) {
      image = req.file.path;
    }

    const updateData = { ...req.body, image };
    
    if (req.body.amenities) {
      let amenities = req.body.amenities;
      if (typeof amenities === 'string') {
        amenities = amenities.split(',').map(item => item.trim());
      }
      updateData.amenities = amenities;
    }

    if (req.body.menu) {
      let menu = req.body.menu;
      if (typeof menu === 'string') {
        try {
          menu = JSON.parse(menu);
        } catch (e) {
          console.error('Error parsing menu JSON', e);
        }
      }
      updateData.menu = menu;
    }

    const updatedHall = await Hall.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      }
    );

    res.status(200).json(updatedHall);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  deleteHall,
};
