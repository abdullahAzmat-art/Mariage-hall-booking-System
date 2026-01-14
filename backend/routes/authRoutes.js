const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { getUsers, updateUserRole, applyForManager, getManagerApplications, updateManagerApplicationStatus, deleteUser, findUserThroughHall, getUserById } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');


router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

router.get('/users', protect, authorize('admin'), getUsers);
router.get('/user/:id', getUserById);

router.get("/getuserthroughhall/:hallId", findUserThroughHall);
router.put('/users/role/:id', protect, authorize('admin'), updateUserRole);

router.post('/users/apply-manager', protect, applyForManager);
router.get('/users/manager-applications', protect, authorize('admin'), getManagerApplications);
router.put('/users/manager-application/:id', protect, authorize('admin'), updateManagerApplicationStatus);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
