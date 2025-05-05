const mongoose = require('mongoose');

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
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
