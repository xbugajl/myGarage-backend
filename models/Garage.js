const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Garage:
 *       type: object
 *       required:
 *         - name
 *         - location
 *         - admin
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Name of the garage
 *         location:
 *           type: string
 *           description: Location of the garage
 *         admin:
 *           type: string
 *           description: ID of the admin user
 */
const garageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Garage', garageSchema);