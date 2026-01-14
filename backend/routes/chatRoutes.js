const express = require('express');
const router = express.Router();
const { chatWithAI, getMessages, getConversations } = require('../controllers/chatController');

router.post('/', chatWithAI);
router.get('/messages/:fromUserId/:toUserId', getMessages);
router.get('/conversations/:userId', getConversations);

module.exports = router;
