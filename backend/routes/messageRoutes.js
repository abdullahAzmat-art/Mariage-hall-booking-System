const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');
const router = express.Router();


router.get("/messages/:userId/:managerId" , protect , messageController)
module.exports = router;