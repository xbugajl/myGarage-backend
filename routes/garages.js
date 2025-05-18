const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Garage = require('../models/Garage');
const User = require('../models/User') 
const createInviteCode = require('./invite.js');
/**
 * @swagger
 * /api/garages:
 *   get:
 *     summary: Get all garages
 *     description: Retrieve all garages. Only accessible by admin.
 *     tags:
 *       - Garages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all garages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Garage'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
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

/**
 * GET /api/user/garage-users/:garageId
 * Returns all users assigned to the specified garage.
 * Accessible by users who belong to the garage or by its admin.
 */
/**
 * @swagger
 * /api/garages/garage-users/{garageId}:
 *   get:
 *     summary: Get garage users
 *     description: Get all users assigned to a specific garage. Accessible by garage members or admin.
 *     tags:
 *       - Garages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: garageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Garage ID
 *     responses:
 *       200:
 *         description: List of garage users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/garage-users/:garageId', auth, async (req, res) => {
  try {
    const { garageId } = req.params;
    const requester = await User.findById(req.user.id);

    if (!requester) return res.status(404).json({ message: 'User not found' });

    // Check if the user belongs to the garage or is the garage's admin
    const isMember = requester.garage?.toString() === garageId;

    // Optional: Also verify admin owns the garage
    const isAdminOfGarage =
        requester.role === 'admin' &&
        (await Garage.findOne({ _id: garageId, admin: requester._id }));

    if (!isMember && !isAdminOfGarage) {
      return res.status(403).json({ message: 'Access denied to this garage' });
    }

    const users = await User.find({ garage: garageId }).select('-password');
    res.json({ users });
  } catch (err) {
    console.error('Error fetching garage users:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create a new garage (admin only)
/**
 * @swagger
 * /api/garages:
 *   post:
 *     summary: Create a new garage
 *     description: Create a new garage. Only accessible by admin.
 *     tags:
 *       - Garages
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Garage created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Garage'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
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
/**
 * @swagger
 * /api/garages/{id}:
 *   get:
 *     summary: Get garage by ID
 *     description: Get details of a specific garage. Only accessible by garage members or admin.
 *     tags:
 *       - Garages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Garage ID
 *     responses:
 *       200:
 *         description: Garage details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Garage'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Garage not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/garages/admin/me:
 *   get:
 *     summary: Get admin's garages
 *     description: Get all garages where the authenticated user is the admin
 *     tags:
 *       - Garages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin's garages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 garages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Garage'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/me', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }

  try {
    // Find all garages where the authenticated user is the admin
    const garages = await Garage.find({ admin: req.user.id }).populate('admin', 'name email');
    if (!garages || garages.length === 0) {
      return res.status(200).json({ message: 'No garages found for this admin', garages: [] });
    }

    res.status(200).json({
      message: 'Garages retrieved successfully',
      garages
    });
  } catch (error) {
    console.error('Error fetching garages for admin:', error);
    res.status(500).json({ message: 'Server error while retrieving garages' });
  }
});

// POST invite
// x-auth-token <- v headri je potrebny, v body treba {"garageId":"id"} aby sa vygeneroval kod pre garaz
/**
 * @swagger
 * /api/garages/invite:
 *   post:
 *     summary: Generate invite code for garage
 *     description: Generate an invite code for a specific garage. Only accessible by admin.
 *     tags:
 *       - Garages
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - garageId
 *             properties:
 *               garageId:
 *                 type: string
 *               expirationInHours:
 *                 type: number
 *                 default: 24
 *     responses:
 *       201:
 *         description: Invite code generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inviteCode:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: garageId is required
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
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
/**
 * @swagger
 * /api/garages/{id}:
 *   patch:
 *     summary: Update garage details
 *     description: Update name or location of a garage. Only accessible by garage admin.
 *     tags:
 *       - Garages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Garage ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Garage updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Garage'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Garage not found
 *       500:
 *         description: Server error
 */
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
