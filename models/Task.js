  // /models/Task.js
  const mongoose = require('mongoose');

  const imageSchema = new mongoose.Schema({
    data:        Buffer,
    contentType: String
  }, { _id: false });

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
    evidence: {
      evidence: [imageSchema],       
    },  
    completedBy: {                           // <── NEW
      _id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: String,
    },   
    completedAt: Date,
    location: {             // GPS location when completed
      latitude:  { type: Number },
      longitude: { type: Number }
    },
    completionComment: {
      type: String,
      required: false
    }
  });

  module.exports = mongoose.model('Task', taskSchema);
