const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       required:
 *         - sender
 *         - garage
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         sender:
 *           type: string
 *           description: ID of the user who sent the message
 *         garage:
 *           type: string
 *           description: ID of the garage where the message was sent
 *         message:
 *           type: string
 *           description: Content of the message
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Time when the message was sent
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Time when the message was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Time when the message was last updated
 */
const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garage',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);