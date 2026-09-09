const express = require('express');
const router = express.Router();
const { chatWithAI, chatStreamWithAI, getMessages, getConversations } = require('../controllers/chatController');

router.post('/', chatWithAI);
router.post('/stream', chatStreamWithAI);
router.get('/messages/:fromUserId/:toUserId', getMessages);
router.get('/conversations/:userId', getConversations);

module.exports = router;
