const mongoose = require('mongoose');

const packageSchema = mongoose.Schema({
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Hall',
  },
  title: {
    type: String,
    required: [true, 'Please add a package title'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  services: {
    type: [String],
    required: [true, 'Please add services'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Package', packageSchema);
