const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       required:
 *         - brand
 *         - model
 *         - year
 *         - identification
 *         - garage
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         brand:
 *           type: string
 *           description: Brand of the vehicle
 *         model:
 *           type: string
 *           description: Model of the vehicle
 *         year:
 *           type: number
 *           description: Year of manufacture
 *         identification:
 *           type: string
 *           description: Vehicle identification number or plate
 *         photos:
 *           type: object
 *           properties:
 *             data:
 *               type: string
 *               format: binary
 *               description: Binary data of the vehicle photo
 *             contentType:
 *               type: string
 *               description: MIME type of the photo
 *         garage:
 *           type: string
 *           description: ID of the garage this vehicle belongs to
 */
const vehicleSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  identification: { type: String, required: true },
  photos: {
    data: { type: Buffer, required: false }, // Binary data
    contentType: { type: String, required: false }, // MIME type
  },
  garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
}); // only test
vehicleSchema.index({ garage: 1 });
module.exports = mongoose.model('Vehicle', vehicleSchema);
