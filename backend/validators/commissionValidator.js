const { z } = require('zod');
const { text } = require('./common');

const rejectCommissionSchema = z.object({
  reason: text('reason', { max: 500 }),
});

module.exports = { rejectCommissionSchema };
