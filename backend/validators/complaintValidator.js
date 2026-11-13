const { z } = require('zod');
const { email, text } = require('./common');

const createComplaintSchema = z.object({
  name: text('name', { max: 100 }),
  email: email(),
  subject: text('subject', { max: 200 }),
  message: text('message', { max: 5000 }),
});

const replyComplaintSchema = z.object({
  reply: text('reply', { max: 2000 }),
});

module.exports = { createComplaintSchema, replyComplaintSchema };
