const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
//ziskavanie historie sprav garaze konkretnej
router.get('/garage/:garageId', auth, async(req, res) => {
  try {
    const messages = await ChatMessage.find({ garage: req.params.garageId })
        .sort({ timestamp: 1 })
        .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});
/*
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
});*/
module.exports = router;