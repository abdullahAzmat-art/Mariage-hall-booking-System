const express = require('express');
const router = express.Router();
const { chatWithAI, chatStreamWithAI, getMessages, getConversations } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { chatRateLimiter } = require('../middleware/rateLimiter');

router.post('/', protect, chatRateLimiter, chatWithAI);
router.post('/stream', protect, chatRateLimiter, chatStreamWithAI);

// Identity is taken from the JWT; the client only supplies the other participant.
router.get('/messages/:otherUserId', protect, getMessages);
router.get('/conversations', protect, getConversations);

module.exports = router;
