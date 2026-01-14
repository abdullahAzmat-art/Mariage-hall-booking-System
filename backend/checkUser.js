const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'hassanazmat079@gmail.com' });
    console.log('User:', user);
    if (user) {
        console.log('Role:', user.role);
        if (user.role !== 'manager') {
            user.role = 'manager';
            await user.save();
            console.log('Updated to manager');
        }
    } else {
        console.log('User not found');
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkUser();
