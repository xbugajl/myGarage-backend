// backend/routes/user.js

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const upload  = multer({ storage: multer.memoryStorage() });
const auth    = require('../middleware/auth');
const User    = require('../models/User');
/**
 * GET /api/user/myGarageID
 * Returns users garage ID, or admin's role because then garage ID is null.
 */
router.get('/myGarageID', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      user: {
        id:        user._id,
        role:      user.role,
        garage:    user.garage,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});
// for push notifications
router.post('/device-token', auth, async (req, res) => {
  if (!req.body.token) return res.status(400).json({ message: 'token required' });
  await User.findByIdAndUpdate(req.user.id, { deviceToken: req.body.token });
  res.sendStatus(204);
});
/**
 * GET /api/user/profile
 * Returns user info plus a URL for the avatar if set.
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Build full URL to serve the avatar
    const avatarUrl = user.avatar?.data
      ? `${req.protocol}://${req.get('host')}/api/user/avatar`
      : null;

    return res.json({
      user: {
        email:     user.email,
        name:      user.name,
        role:      user.role,
        garage:    user.garage,
        avatarUrl,              // <-- drop this into your profile response
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/user/update
 * Accepts multipart (avatar upload) or JSON (name only).
 */
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

      // Return the new avatar URL (if any) just as GET /profile does
      const avatarUrl = user.avatar?.data
        ? `${req.protocol}://${req.get('host')}/api/user/avatar`
        : null;

      return res.json({
        message: 'Profile updated',
        user: {
          email:     user.email,
          name:      user.name,
          role:      user.role,
          garage:    user.garage,
          avatarUrl,
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

/**
 * GET /api/user/avatar
 * Streams the raw avatar bytes out.
 */
router.get('/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.avatar?.data) return res.status(404).end();
    res.contentType(user.avatar.contentType);
    res.send(user.avatar.data);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting self
    if (userToDelete.id === requester.id) {
      return res.status(400).json({ message: "You can't delete yourself" });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});
module.exports = router;
