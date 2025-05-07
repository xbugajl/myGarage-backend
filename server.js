
require('dotenv').config();

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
const userRoutes = require('./routes/user.js');
const setupSocket = require('./socket/socketHandler.js');

// docs
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');


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

setupSocket(io);

//require('./cron/reminders');

app.use('/api/auth', authRoutes);
app.use('/api/garages', garageRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/user', userRoutes);

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));



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