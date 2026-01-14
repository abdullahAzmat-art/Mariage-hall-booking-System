const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const userModel = require('./models/userModel');
const { createServer } = require('http');
const messageModel = require('./models/messageModel');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/example', require('./routes/exampleRoutes'));
app.use('/api', require('./routes/authRoutes'));
app.use('/api/halls', require('./routes/hallRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/commissions', require('./routes/commissionRoutes'));
app.use('/api/utility', require('./routes/utilityRoutes'));

const server = createServer(app);

// ✅ Correct Socket.IO initialization
const io = new Server(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // ✅ User joins their own room
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    // ✅ Handle chat message
    socket.on('send-message', async (data) => {
        const { fromUserId, toUserId, message } = data;

        const findUser = await userModel.findById(toUserId);

        if (!findUser) return;

        // ✅ Save message to database
        const newMessage = await messageModel.create({
            fromUserId,
            toUserId,
            message,
            timestamp: new Date()
        });

        const messageData = {
            fromUserId,
            toUserId,
            message,
            timestamp: newMessage.timestamp
        };

        console.log('✅ Message saved to database');
        console.log('✅ Message saved to database');
        // console.log(data)
        console.log(messageData);

        // console.log(findUser)   
        // ✅ Send to receiver
        io.to(toUserId).emit('receive-message', messageData);

        // ✅ Send back to sender
        io.to(fromUserId).emit('receive-message', messageData);
    });

    // ✅ Correct disconnect event
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

// ✅ MUST listen with server, not app
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
