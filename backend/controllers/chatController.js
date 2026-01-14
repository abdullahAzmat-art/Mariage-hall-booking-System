const Message = require('../models/messageModel');
const User = require('../models/userModel');

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMsg = message.toLowerCase();

    let reply = "";

    // Rule-Based Logic
    if (lowerMsg.includes("book") || lowerMsg.includes("booking")) {
      reply = "To book a hall, browse our 'Halls' page, select your preferred venue, check availability for your date, and click 'Book Now'. You'll need to pay a 10% advance to confirm.";
    } else if (lowerMsg.includes("price") || lowerMsg.includes("cost") || lowerMsg.includes("rates")) {
      reply = "Prices vary by hall and capacity. You can use the price filter on the Halls page to find venues within your budget.";
    } else if (lowerMsg.includes("pre-booking") || lowerMsg.includes("advance")) {
      reply = "For pre-booking, a 10% advance payment is required. You can upload the payment proof directly in your dashboard after booking.";
    } else if (lowerMsg.includes("filter") || lowerMsg.includes("search")) {
      reply = "You can filter halls by Location, Capacity, and Price range on the Halls page to find the perfect match for your event.";
    } else if (lowerMsg.includes("manager") || lowerMsg.includes("apply")) {
      reply = "To apply as a manager, go to the 'Register' page and select 'Manager' as your role. Your application will be reviewed by the admin.";
    } else if (lowerMsg.includes("verify") || lowerMsg.includes("verification")) {
      reply = "Halls are verified by our admin team to ensure quality and authenticity before they are listed on the platform.";
    } else if (lowerMsg.includes("calendar") || lowerMsg.includes("availability")) {
      reply = "The availability calendar on each hall's detail page shows available (green) and booked (red) dates.";
    } else if (lowerMsg.includes("commission")) {
      reply = "We charge a standard commission of 8% on bookings to maintain the platform and services.";
    } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
      reply = "Hello! I am your Marriage Hall Booking Assistant. How can I help you today?";
    } else {
      reply = "I'm sorry, I can only answer questions about booking, payments, filters, manager applications, and general platform policies. Please try rephrasing your question.";
    }

    // Simulate a small delay for "thinking" effect
    setTimeout(() => {
      res.json({ reply });
    }, 500);

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again." });
  }
};

const getMessages = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};

const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all messages involving the user
    const messages = await Message.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    }).sort({ timestamp: -1 });

    const conversationsMap = new Map();

    for (const msg of messages) {
      const partnerId = msg.fromUserId.toString() === userId ? msg.toUserId.toString() : msg.fromUserId.toString();

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          lastMessage: msg.message,
          time: msg.timestamp,
        });
      }
    }

    const conversations = [];
    for (const [partnerId, data] of conversationsMap.entries()) {
      const partner = await User.findById(partnerId).select('name role');
      if (partner) {
        conversations.push({
          id: partnerId,
          name: partner.name,
          lastMessage: data.lastMessage,
          time: new Date(data.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: `https://ui-avatars.com/api/?name=${partner.name}&background=random`
        });
      }
    }

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Error fetching conversations" });
  }
};

module.exports = { chatWithAI, getMessages, getConversations };
