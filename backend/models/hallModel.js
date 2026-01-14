const mongoose = require('mongoose');

const hallSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
  },
  capacity: {
    type: Number,
    required: [true, 'Please add capacity'],
  },
  price: {
    type: Number,
    required: [true, 'Please add price'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  amenities: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    required: [true, 'Please add an image'],
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookedDates: {
    type: [String],
    default: [],
  },
  menu: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String },
    image: { type: String }
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Hall', hallSchema);
