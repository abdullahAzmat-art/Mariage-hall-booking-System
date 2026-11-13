const express = require('express');
const router = express.Router();
const { chatWithAI, chatStreamWithAI, getMessages, getConversations } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { chatRateLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const {
  chatMessageSchema,
  chatStreamSchema,
  chatHistoryParamsSchema,
} = require('../validators/chatValidator');

router.post('/', protect, chatRateLimiter, validate({ body: chatMessageSchema }), chatWithAI);
router.post('/stream', protect, chatRateLimiter, validate({ body: chatStreamSchema }), chatStreamWithAI);

// Identity is taken from the JWT; the client only supplies the other participant.
router.get(
  '/messages/:otherUserId',
  protect,
  validate({ params: chatHistoryParamsSchema }),
  getMessages
);
router.get('/conversations', protect, getConversations);

module.exports = router;
