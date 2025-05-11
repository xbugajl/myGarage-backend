const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
//ziskavanie historie sprav garaze konkretnej
router.get('/garage/:garageId', auth, async (req, res) => {
  try {
    const garageId = req.params.garageId;

    if (!mongoose.Types.ObjectId.isValid(garageId)) {
      return res.status(400).json({ error: 'Invalid garage ID' });
    }

    const messages = await ChatMessage.find({ garage: garageId })
        .populate('sender', 'name email') // Načítanie mena a emailu odosielateľa
        .sort({ timestamp: 1 })
        .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Chyba pri načítavaní správ:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;
