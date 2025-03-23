const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/garage/:garageId', auth, (req, res) => {
  res.json({ message: 'Chat initialized, use WebSocket for real-time communication' });
});

module.exports = router;