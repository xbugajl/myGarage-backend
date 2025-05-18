// backend/routes/user.js

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const upload  = multer({ storage: multer.memoryStorage() });
const auth    = require('../middleware/auth');
const User    = require('../models/User');
/**
 * @swagger
 * /api/user/myGarageID:
 *   get:
 *     summary: Get user's garage ID
 *     description: Returns the user's garage ID or admin role if the user is an admin
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's garage ID and role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User's ID
 *                     role:
 *                       type: string
 *                       enum: [admin, user]
 *                       description: User's role
 *                     garage:
 *                       type: string
 *                       nullable: true
 *                       description: ID of the garage user belongs to (null for admins)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
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
/**
 * @swagger
 * /api/user/device-token:
 *   post:
 *     summary: Register device token
 *     description: Register a device token for push notifications
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Device token for push notifications
 *     responses:
 *       204:
 *         description: Token registered successfully
 *       400:
 *         description: Token is required
 *       500:
 *         description: Server error
 */
router.post('/device-token', auth, async (req, res) => {
  if (!req.body.token) return res.status(400).json({ message: 'token required' });
  await User.findByIdAndUpdate(req.user.id, { deviceToken: req.body.token });
  res.sendStatus(204);
});
/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get the current user's profile information including avatar URL
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       description: User's email address
 *                     name:
 *                       type: string
 *                       description: User's name
 *                     role:
 *                       type: string
 *                       enum: [admin, user]
 *                       description: User's role
 *                     garage:
 *                       type: string
 *                       nullable: true
 *                       description: ID of the garage user belongs to
 *                     avatarUrl:
 *                       type: string
 *                       nullable: true
 *                       description: URL to user's avatar image
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
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
 * @swagger
 * /api/user/update:
 *   put:
 *     summary: Update user profile
 *     description: Update user's name and optionally upload a new avatar
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's new name
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: User's new avatar image
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, user]
 *                     garage:
 *                       type: string
 *                       nullable: true
 *                     avatarUrl:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Name is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
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
 * @swagger
 * /api/user/avatar:
 *   get:
 *     summary: Get user avatar
 *     description: Get the current user's avatar image
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar image
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: No avatar found
 *       500:
 *         description: Server error
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
/**
 * @swagger
 * /api/user/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user account. Only accessible by admin and cannot delete self.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Cannot delete yourself
 *       403:
 *         description: Access denied - not an admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
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
