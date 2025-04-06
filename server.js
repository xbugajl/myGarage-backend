const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db.js');
const authRoutes = require('./routes/auth.js');
const garageRoutes = require('./routes/garages.js');
const vehicleRoutes = require('./routes/vehicles.js');
const taskRoutes = require('./routes/tasks.js');
const chatRoutes = require('./routes/chat.js');
const ChatMessage = require('./models/ChatMessage.js');
const inviteRoutes = require('./routes/invite.js');


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Adjust this to match your client’s origin
    methods: ["GET", "POST"]
  }
});
connectDB();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/garages', garageRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/invite', inviteRoutes);

// Serve the client.html file (optional, for testing)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client.html');
});
io.use(async (socket, next) => {
  try {
    // Add your authentication logic here
    // Example: const token = socket.handshake.auth.token;
    // Verify token and attach user to socket
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('joinGarage', (garageId) => {
    if (!garageId) {
      socket.emit('error', 'Garage ID is required');
      return;
    }
    socket.join(garageId);
    socket.emit('joined', `Successfully joined garage ${garageId}`);
    console.log(`Client ${socket.id} joined garage ${garageId}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { garageId, message, senderId } = data;

      // Validation
      if (!garageId || !message || !senderId) {
        socket.emit('error', 'Missing required fields');
        return;
      }

      // Create and save message
      const chatMessage = new ChatMessage({
        sender: senderId,
        garage: garageId,
        message,
        timestamp: new Date()
      });

      await chatMessage.save();

      // Broadcast to room
      io.to(garageId).emit('message', {
        _id: chatMessage._id,
        sender: senderId,
        garage: garageId,
        message,
        timestamp: chatMessage.timestamp
      });
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Could broadcast to rooms the user was in
  });

  socket.on('error', (error) => {
    console.error(`Socket error: ${error}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});