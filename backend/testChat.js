const axios = require('axios');

async function testChat() {
  try {
    console.log("Testing Chat Endpoint...");
    const response = await axios.post('http://localhost:5000/api/chat', {
      message: "hello"
    });
    console.log("Response:", response.data);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

testChat();
