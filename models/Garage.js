const mongoose = require('mongoose');

const garageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Garage', garageSchema);