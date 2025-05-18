// /models/Task.js
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - dueDate
 *         - vehicle
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Name of the task
 *         description:
 *           type: string
 *           description: Detailed description of the task
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: When the task is due
 *         vehicle:
 *           type: string
 *           description: ID of the vehicle this task is for
 *         status:
 *           type: string
 *           enum: [pending, completed]
 *           description: Current status of the task
 *         evidence:
 *           type: object
 *           properties:
 *             evidence:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: string
 *                     format: binary
 *                     description: Binary data of the evidence image
 *                   contentType:
 *                     type: string
 *                     description: MIME type of the image
 *         completedBy:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: ID of the user who completed the task
 *             email:
 *               type: string
 *               description: Email of the user who completed the task
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the task was completed
 *         location:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               description: Latitude where the task was completed
 *             longitude:
 *               type: number
 *               description: Longitude where the task was completed
 *         completionComment:
 *           type: string
 *           description: Optional comment added when completing the task
 */

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
