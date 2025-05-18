const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's hashed password
 *         role:
 *           type: string
 *           enum: [admin, user]
 *           default: user
 *           description: User's role
 *         garage:
 *           type: string
 *           description: ID of the garage the user belongs to
 *         deviceToken:
 *           type: string
 *           description: Token for push notifications
 *         avatar:
 *           type: object
 *           properties:
 *             data:
 *               type: string
 *               format: binary
 *               description: Binary data of the avatar image
 *             contentType:
 *               type: string
 *               description: MIME type of the avatar image
 */
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage' },
  deviceToken: { type: String }, // For push notifications

  avatar: {
    data: { type: Buffer, required: false }, // Binary data
    contentType: { type: String, required: false }, // MIME type
  }
});

module.exports = mongoose.model('User', userSchema);