const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');
const Garage = require('../models/Garage');

router.get('/garage/:garageId', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    if (req.user.role !== 'admin' && garage.admin.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    const vehicles = await Vehicle.find({ garage: req.params.garageId });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/garage/:garageId', auth, async (req, res) => {
  const { brand, model, year,identification, photos } = req.body;
  try {
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    if (garage.admin.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    const vehicle = new Vehicle({ brand, model, year,identification, photos, garage: req.params.garageId });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
  
});

router.delete('/garage/:garageId/vehicle/:vehicleId', auth, async (req, res) => {
  try {
    // kontrola ci garaz existuje
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    // verifikacia ci je pouzivatel admin
    if (garage.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // kontrola ci vozidlo pod id existuje
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // kontrola ci vozidlo patri do garaze
    if (vehicle.garage.toString() !== req.params.garageId) {
      return res.status(400).json({ message: 'Vehicle does not belong to this garage' });
    }

    // delete vozidla
    await vehicle.deleteOne();
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
module.exports = router;