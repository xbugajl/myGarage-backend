const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Garage = require('../models/Garage');

router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  try {
    const garages = await Garage.find().populate('admin', 'name email');
    res.json(garages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  const { name, location } = req.body;
  try {
    const garage = new Garage({ name, location, admin: req.user.id });
    await garage.save();
    res.status(201).json(garage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id).populate('admin', 'name email');
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    if (req.user.role !== 'admin' && garage.admin.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    res.json(garage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;