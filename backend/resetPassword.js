const mongoose = require('mongoose');
const User = require('./models/userModel');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'hassanazmat079@gmail.com' });
    if (user) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash('12345', salt);
        await user.save();
        console.log('Password reset successfully');
    } else {
        console.log('User not found');
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

resetPassword();
