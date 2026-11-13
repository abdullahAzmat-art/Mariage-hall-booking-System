const { z } = require('zod');
const { numberField, text } = require('./common');

const amenitiesSchema = z.union([
  z
    .array(
      z
        .string({ message: 'Amenity must be text' })
        .trim()
        .max(100, 'Amenity name is too long'),
      { message: 'amenities must be a list' }
    )
    .max(50, 'Too many amenities'),
  z
    .string({ message: 'amenities must be a list' })
    .trim()
    .max(10000, 'amenities is too long'),
]);

const menuItemSchema = z.object({
  name: text('menu item name', { max: 200 }),
  price: numberField('menu price', { min: 0, max: 10000000 }),
  category: z
    .string({ message: 'category must be text' })
    .trim()
    .max(100, 'category is too long')
    .optional(),
  image: z
    .string({ message: 'image must be text' })
    .trim()
    .max(2000, 'image is too long')
    .optional(),
});

const menuSchema = z.union([
  z
    .array(menuItemSchema, { message: 'menu must be a list' })
    .max(200, 'Too many menu items'),
  z
    .string({ message: 'menu must be valid JSON' })
    .trim()
    .max(100000, 'menu is too long'),
]);

const createHallSchema = z.object({
  name: text('name', { max: 100 }),
  location: text('location', { max: 200 }),
  capacity: numberField('capacity', { min: 1, max: 100000, integer: true }),
  price: numberField('price', { min: 0, max: 100000000 }),
  description: text('description', { max: 5000 }),
  amenities: amenitiesSchema.optional(),
  menu: menuSchema.optional(),
  image: z
    .string({ message: 'image must be text' })
    .trim()
    .max(2000, 'image is too long')
    .optional(),
});

const updateHallSchema = createHallSchema.partial();

const updateAvailabilitySchema = z.object({
  bookedDates: z
    .array(
      z
        .string({ message: 'bookedDates must use YYYY-MM-DD format' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'bookedDates must use YYYY-MM-DD format'),
      { message: 'bookedDates must be a list of dates' }
    )
    .max(3660, 'Too many booked dates'),
});

module.exports = {
  createHallSchema,
  updateHallSchema,
  updateAvailabilitySchema,
};
