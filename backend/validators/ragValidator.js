const { z } = require('zod');
const { objectId } = require('./common');

// File type and size are enforced by multer on the route. These schemas cover
// the multipart metadata and the request parameters.
const ragUploadSchema = z.object({
  name: z
    .string({ message: 'name must be text' })
    .trim()
    .min(1, 'name must not be empty')
    .max(200, 'name is too long')
    .optional(),
});

const ragDeleteParamsSchema = z.object({ id: objectId('id') });

module.exports = { ragUploadSchema, ragDeleteParamsSchema };
