const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
//ziskavanie historie sprav garaze konkretnej
router.get('/garage/:garageId', auth, async(req, res) => {
  try {
    const messages = await ChatMessage.find({ garage: req.params.garageId })
        .sort({ timestamp: 1 })
        .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;