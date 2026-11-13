const { z } = require('zod');
const { objectId, stringError } = require('./common');

const messageSchema = z
  .string({ error: stringError('message') })
  .trim()
  .min(1, 'message must be between 1 and 4000 characters')
  .max(4000, 'message must be between 1 and 4000 characters');

const chatMessageSchema = z.object({
  message: messageSchema,
});

const chatStreamSchema = z.object({
  message: messageSchema,
  threadId: z
    .string({ error: stringError('threadId') })
    .trim()
    .max(200, 'threadId is too long')
    .optional(),
});

const chatHistoryParamsSchema = z.object({
  otherUserId: objectId('otherUserId'),
});

module.exports = { chatMessageSchema, chatStreamSchema, chatHistoryParamsSchema };
