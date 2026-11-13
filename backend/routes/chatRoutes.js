const express = require('express');
const router = express.Router();
const { chatWithAI, chatStreamWithAI, getMessages, getConversations } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { chatUserRateLimiter, chatGlobalRateLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const {
  chatMessageSchema,
  chatStreamSchema,
  chatHistoryParamsSchema,
} = require('../validators/chatValidator');

// A request that fails validation never reaches the AI, so the global budget
// only counts requests that will actually consume provider calls.
router.post(
  '/',
  protect,
  chatUserRateLimiter,
  validate({ body: chatMessageSchema }),
  chatGlobalRateLimiter,
  chatWithAI
);
router.post(
  '/stream',
  protect,
  chatUserRateLimiter,
  validate({ body: chatStreamSchema }),
  chatGlobalRateLimiter,
  chatStreamWithAI
);

// Identity is taken from the JWT; the client only supplies the other participant.
router.get(
  '/messages/:otherUserId',
  protect,
  validate({ params: chatHistoryParamsSchema }),
  getMessages
);
router.get('/conversations', protect, getConversations);

module.exports = router;
