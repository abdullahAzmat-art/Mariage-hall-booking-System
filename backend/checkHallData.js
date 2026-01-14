const mongoose = require('mongoose');
const Hall = require('./models/hallModel');
require('dotenv').config();

const checkHall = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const hall = await Hall.findById('6923226e903415bc677a5185');
    console.log('Hall Data:', hall);
    if (hall) {
        console.log('Description:', hall.description);
        console.log('Amenities:', hall.amenities);
    } else {
        console.log('Hall not found');
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkHall();
