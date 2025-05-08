// /models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true       
  },
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  evidence: [String],      // URLs or file paths
  completedAt: Date,
  location: {             // GPS location when completed
    latitude:  { type: Number },
    longitude: { type: Number }
  }
});

module.exports = mongoose.model('Task', taskSchema);
