const express = require('express');
const dotenv = require('dotenv');

// Load env vars - MUST BE FIRST
dotenv.config();

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const passport = require('./config/passport');

// Connect to database
connectDB();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const Message = require('./models/Message');

// Socket.io Logic
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_room', (data) => {
        socket.join(data);
        console.log(`User with ID: ${socket.id} joined room: ${data}`);
    });

    socket.on('send_message', async (data) => {
        // data = { room, author, message, time, ... }
        // Broadcast to room
        socket.to(data.room).emit('receive_message', data);

        // Save to DB
        try {
            await Message.create({
                room: data.room,
                author: data.author,
                message: data.message,
                time: data.time
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

// Make io accessible in routes if needed (e.g. for notifications)
app.set('io', io);

// ... Middlewares ...

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(passport.initialize());

// Basic route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/emails', require('./routes/emailRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/communication', require('./routes/communicationRoutes'));
app.use('/api/wellness', require('./routes/wellnessRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));
app.use('/api/rag', require('./routes/ragRoutes'));

const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
