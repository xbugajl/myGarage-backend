const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const garageRoutes = require('./routes/garages');
const vehicleRoutes = require('./routes/vehicles');
const taskRoutes = require('./routes/tasks');
const chatRoutes = require('./routes/chat');
const ChatMessage = require('./models/ChatMessage');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/garages', garageRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinGarage', (garageId) => {
    socket.join(garageId);
  });

  socket.on('sendMessage', async (data) => {
    const { garageId, message, senderId } = data;
    const chatMessage = new ChatMessage({ sender: senderId, garage: garageId, message });
    await chatMessage.save();
    io.to(garageId).emit('message', chatMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));