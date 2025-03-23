const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  identification: {type: String, required: true},
  photos: [String], // URLs or file paths
  garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);