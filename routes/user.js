// backend/routes/user.js

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const upload  = multer({ storage: multer.memoryStorage() });
const auth    = require('../middleware/auth');
const User    = require('../models/User');

// GET   /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User
      .findById(req.user.id)
      .select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT   /api/user/update
// multipart if file, otherwise json
router.put(
  '/update',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // name is required
      if (!req.body.name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      user.name = req.body.name;

      // optional avatar upload
      if (req.file) {
        user.avatar = {
          data:        req.file.buffer,
          contentType: req.file.mimetype
        };
      }

      await user.save();

      res.json({
        message: 'Profile updated',
        user: {
          email: user.email,
          name:  user.name,
          role:  user.role,
          garage:user.garage
          // optionally avatar URL here
        }
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

module.exports = router;
