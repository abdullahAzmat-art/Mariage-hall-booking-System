const { z } = require('zod');
const { email, text, stringError } = require('./common');

const registerSchema = z.object({
  name: text('name', { min: 2, max: 100 }),
  email: email(),
  // Passwords are never trimmed: whitespace is part of the secret.
  password: z
    .string({ error: stringError('password') })
    .min(8, 'password must be at least 8 characters')
    .max(128, 'password is too long'),
  phone: text('phone', { min: 7, max: 30 }),
});

const loginSchema = z.object({
  email: email(),
  password: z
    .string({ error: stringError('password') })
    .min(1, 'password is required')
    .max(128, 'password is too long'),
});

module.exports = { registerSchema, loginSchema };
