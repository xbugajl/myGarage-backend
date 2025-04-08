const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Garage = require('../models/Garage');
const createInviteCode = require('./invite.js'); 
// GET all garages (admin only) <- toto by som asi vymazal
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') 
    return res.status(403).json({ message: 'Access denied' });
  try {
    const garages = await Garage.find().populate('admin', 'name email');
    res.json(garages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create a new garage (admin only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') 
    return res.status(403).json({ message: 'Access denied' });
  const { name, location } = req.body;
  try {
    const garage = new Garage({ name, location, admin: req.user.id });
    await garage.save();
    res.status(201).json(garage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET garageId, toto by som upravil co by iba admin tej garaze a useri tej garaze mali k nej pristup !DONE!
router.get('/:id', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id).populate('admin', 'name email');
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    if (!req.user.garage || req.user.garage.toString() !== garage._id.toString())
      //toto som zmenil, lebo my mame admina tiez priradeneho k garazi
      {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(garage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST invite 
// x-auth-token <- v headri je potrebny, v body treba {"garageId":"id"} aby sa vygeneroval kod pre garaz
router.post('/invite', auth, async (req, res) => {
  if (req.user.role !== 'admin') 
    return res.status(403).json({ message: 'Access denied' });
  
  const { garageId, expirationInHours } = req.body;
  if (!garageId) {
    return res.status(400).json({ message: 'garageId is required' });
  }
  
  try {
    const invite = await createInviteCode(garageId, expirationInHours || 24);
    res.status(201).json({ inviteCode: invite.code, expiresAt: invite.expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT update detailov garaze (admin only)
router.patch('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') 
    return res.status(403).json({ message: 'Access denied' });

  const { name, location } = req.body;

  try {
    //najdenie garaze
    const garage = await Garage.findById(req.params.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    // verifikacia ci je pouzivatel admin
    if (garage.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // update fieldov
    if (name) garage.name = name;
    if (location) garage.location = location;

 
    await garage.save();
    res.json(garage);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
