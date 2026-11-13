const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const userModel = require('./models/userModel');
const Booking = require('./models/bookingModel');
const { expireStaleBookings } = require('./services/availabilityService');
const { createServer } = require('http');
const messageModel = require('./models/messageModel');

dotenv.config();
connectDB();

// Surface index build problems instead of crashing when a deployment already
// contains duplicate active bookings. Run scripts/ensureBookingIndexes.js once
// to resolve duplicates and build the unique slot/transaction indexes.
Booking.on('index', (error) => {
    if (error) console.error('Booking index build failed:', error.message);
});

// Release date slots whose payment window has expired.
const PAYMENT_EXPIRY_INTERVAL_MS = 15 * 60 * 1000;
const expiryTimer = setInterval(() => {
    expireStaleBookings().catch((error) => console.error('Booking expiry job failed:', error.message));
}, PAYMENT_EXPIRY_INTERVAL_MS);
expiryTimer.unref();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', require('./routes/authRoutes'));
app.use('/api/halls', require('./routes/hallRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/commissions', require('./routes/commissionRoutes'));
app.use('/api/utility', require('./routes/utilityRoutes'));
app.use('/api/rag', require('./routes/ragRoutes'));

const server = createServer(app);

// ✅ Correct Socket.IO initialization
const io = new Server(server, {
    cors: { origin: '*' }
});

const MAX_SOCKET_MESSAGE_LENGTH = 2000;

// Reject socket connections that do not present a valid JWT.
io.use((socket, next) => {
    const authHeader = socket.handshake.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;
    const token = socket.handshake.auth?.token || headerToken;

    if (!token) {
        return next(new Error('Not authorized'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        return next();
    } catch (error) {
        return next(new Error('Not authorized'));
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // ✅ Users always join a room derived from their JWT identity
    socket.join(socket.userId);

    // ✅ Handle chat message
    socket.on('send-message', async (data) => {
        try {
            const { toUserId, message } = data || {};
            const fromUserId = socket.userId;

            if (typeof message !== 'string') return;
            const text = message.trim();
            if (!text || text.length > MAX_SOCKET_MESSAGE_LENGTH) return;
            if (!mongoose.isValidObjectId(toUserId) || toUserId === fromUserId) return;

            const findUser = await userModel.findById(toUserId).select('_id');

            if (!findUser) return;

            // ✅ Save message to database
            const newMessage = await messageModel.create({
                fromUserId,
                toUserId,
                message: text,
                timestamp: new Date()
            });

            const messageData = {
                fromUserId,
                toUserId,
                message: text,
                timestamp: newMessage.timestamp
            };

            // ✅ Send to receiver
            io.to(toUserId).emit('receive-message', messageData);

            // ✅ Send back to sender
            io.to(fromUserId).emit('receive-message', messageData);
        } catch (error) {
            console.error('Socket message error:', error.message);
        }
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
