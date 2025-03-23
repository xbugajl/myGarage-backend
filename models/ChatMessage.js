const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);