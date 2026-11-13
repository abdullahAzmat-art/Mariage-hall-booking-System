const { z } = require('zod');
const { objectId, numberField, text } = require('./common');

const servicesSchema = z
  .array(
    z
      .string({ message: 'service must be text' })
      .trim()
      .min(1, 'service is required')
      .max(200, 'service is too long'),
    { message: 'services must be a list' }
  )
  .max(50, 'Too many services');

const createPackageSchema = z.object({
  hallId: objectId('hallId'),
  title: text('title', { max: 200 }),
  price: numberField('price', { min: 0, max: 100000000 }),
  services: servicesSchema,
});

const updatePackageSchema = z
  .object({
    hallId: objectId('hallId').optional(),
    title: z
      .string({ message: 'title must be text' })
      .trim()
      .min(1, 'title is required')
      .max(200, 'title is too long')
      .optional(),
    price: numberField('price', { min: 0, max: 100000000 }).optional(),
    services: servicesSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one package field is required',
  });

module.exports = { createPackageSchema, updatePackageSchema };
