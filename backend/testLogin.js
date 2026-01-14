const axios = require('axios');

const testLogin = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/users/login', {
      email: 'hassanazmat079@gmail.com',
      password: '12345'
    });
    console.log('Login Successful:', response.data);
  } catch (error) {
    console.error('Login Failed:', error.response ? error.response.data : error.message);
  }
};

testLogin();
