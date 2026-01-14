const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const testCreateHall = async () => {
  try {
    // Login first to get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'hassanazmat079@gmail.com',
      password: '12345'
    });
    const token = loginRes.data.token;

    const form = new FormData();
    form.append('name', 'Debug Hall');
    form.append('location', 'Debug Location');
    form.append('capacity', '100');
    form.append('price', '1000');
    form.append('description', 'Debug Description');
    form.append('amenities', 'Wifi');
    form.append('amenities', 'AC');
    // We need a file. Let's create a dummy one.
    fs.writeFileSync('dummy.jpg', 'dummy content');
    form.append('image', fs.createReadStream('dummy.jpg'));

    const config = {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    };

    const res = await axios.post('http://localhost:5000/api/halls', form, config);
    console.log('Hall Created:', JSON.stringify(res.data, null, 2));
    
    // Clean up
    fs.unlinkSync('dummy.jpg');

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

testCreateHall();
