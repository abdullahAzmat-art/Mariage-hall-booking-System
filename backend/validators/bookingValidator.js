const { z } = require('zod');
const { BOOKING_STATUSES } = require('../services/bookingRules');
const { objectId, numberField, text, optionalText } = require('./common');

const customFoodItemSchema = z
  .object({
    itemName: z
      .string({ message: 'itemName must be text' })
      .trim()
      .min(1, 'itemName is required')
      .max(200, 'itemName is too long')
      .optional(),
    name: z
      .string({ message: 'name must be text' })
      .trim()
      .min(1, 'name is required')
      .max(200, 'name is too long')
      .optional(),
    quantity: numberField('quantity', { min: 1, max: 20, integer: true }).optional(),
  })
  .refine((item) => Boolean(item.itemName || item.name), {
    message: 'A food item name is required',
  });

const customFoodListSchema = z
  .array(customFoodItemSchema, { message: 'customFood must be a list' })
  .max(50, 'Too many custom food items');

// Format, presence and types only. Date validity, capacity, slot conflicts and
// prices are still enforced by bookingRules.js and bookingService.js.
const createBookingSchema = z.object({
  hallId: objectId('hallId'),
  eventDate: text('eventDate', { max: 40 }),
  timeSlot: text('timeSlot', { max: 30 }),
  eventType: text('eventType', { max: 50 }).optional(),
  phone: text('phone', { max: 30 }),
  cnic: text('cnic', { max: 30 }),
  guestsCount: numberField('guestsCount', { min: 1, max: 100000, integer: true }),
  customFood: customFoodListSchema.optional(),
  packageId: z.union([objectId('packageId'), z.literal(''), z.null()]).optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(BOOKING_STATUSES, {
    message: `status must be one of: ${BOOKING_STATUSES.join(', ')}`,
  }),
  reason: optionalText('reason', { max: 500 }),
});

const paymentProofSchema = z.object({
  transactionId: text('transactionId', { max: 64 }),
});

const cancelBookingSchema = z.object({
  reason: optionalText('reason', { max: 500 }),
});

const rejectBookingSchema = z.object({
  reason: optionalText('reason', { max: 500 }),
});

const customFoodSchema = z.object({
  customFood: customFoodListSchema,
});

const customFoodStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    message: 'status must be approved or rejected',
  }),
});

const idParamsSchema = z.object({ id: objectId('id') });
const hallIdParamsSchema = z.object({ hallId: objectId('hallId') });

module.exports = {
  createBookingSchema,
  statusUpdateSchema,
  paymentProofSchema,
  cancelBookingSchema,
  rejectBookingSchema,
  customFoodSchema,
  customFoodStatusSchema,
  idParamsSchema,
  hallIdParamsSchema,
};
