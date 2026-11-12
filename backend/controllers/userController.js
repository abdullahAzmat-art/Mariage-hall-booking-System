// const hallModel = require('../models/hallModel');
const User = require('../models/userModel');
const Hall = require('../models/hallModel');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select(
      'name email phone role managerApplication paymentWarnings accountSuspended createdAt'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const ALLOWED_ROLES = ['admin', 'manager', 'customer'];
const ALLOWED_APPLICATION_STATUSES = ['approved', 'rejected'];

// @desc    Update user role
// @route   PUT /api/users/role/:id
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);

    if (user) {
      user.role = role;
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const findUserThroughHall = async (req, res) => {
  try {
    const hallId = req.params.hallId;
    console.log(hallId);
    const hallget = await Hall.findById(hallId);
    console.log(hallget)

    if (!hallget) {
      return res.status(404).json({ message: 'Hall not found' });
    }
    const user = await User.findById(hallget.manager).select('_id name role');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'No user found for this hall' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// @desc    Apply for manager position
// @route   POST /api/users/apply-manager
// @access  Private
const applyForManager = async (req, res) => {
  try {
    const { businessName, businessAddress, description } = req.body;
    const user = await User.findById(req.user.id);

    if (user) {
      user.managerApplication = {
        status: 'pending',
        businessName,
        businessAddress,
        description,
        appliedAt: Date.now(),
      };
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        managerApplication: updatedUser.managerApplication,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all manager applications
// @route   GET /api/users/manager-applications
// @access  Private/Admin
const getManagerApplications = async (req, res) => {
  try {
    const users = await User.find({ 'managerApplication.status': 'pending' }).select(
      'name email phone role managerApplication'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update manager application status
// @route   PUT /api/users/manager-application/:id
// @access  Private/Admin
const updateManagerApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!ALLOWED_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid application status' });
    }

    const user = await User.findById(req.params.id);

    if (user) {
      user.managerApplication.status = status;
      if (status === 'approved') {
        user.role = 'manager';
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        managerApplication: updatedUser.managerApplication,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/user/:id
// @access  Public (or Protected)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('_id name role');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  applyForManager,
  getManagerApplications,
  updateManagerApplicationStatus,
  deleteUser,
  findUserThroughHall,
  getUserById
};
