const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const InviteCode = require('../models/InviteCode');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Verify user credentials (email & password) and return a JWT if valid
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login',  async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Include the garage field in the JWT payload if it exists
    const payload = { 
      user: { 
        id: user.id, 
        role: user.role,
        garage: user.garage 
      } 
    };

    const token = jwt.sign(payload, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with optional invite code. Without invite code registers as admin, with invite code as user.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               inviteCode:
 *                 type: string
 *                 description: Required for registering as a user, not required for admin
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User already exists or invalid invite code
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  const { name, email, password, inviteCode } = req.body; // inviteCode for admin-generated invites
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    
    let role = "admin";
    let garage = null;
    console.log(inviteCode);
    if(inviteCode){
      const validCode = await InviteCode.findOne({
        code: inviteCode,
        used: false,
        expiresAt: { $gt: new Date() }
        
      });
        if(!validCode){
            return res.status(400).json({ message: 'Invalid invite code' });
        }
        role = "user";
        garage = validCode.garage;
        validCode.used = true;
        await validCode.save();
    }

    // In a real app, validate inviteCode here
    user = new User({ name, email, password, role, garage}); // vytvorenie usera s id garaze
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    res.status(500).json({ message: 'Server  ', error });
  }
});

/**
 * @swagger
 * /api/auth/validate-invite:
 *   post:
 *     summary: Validate an invite code
 *     description: Check if an invite code is valid and not expired
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invite code is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired invite code
 *       500:
 *         description: Server error
 */
router.post('/validate-invite', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Invite code required' });

  try {
    const invite = await InviteCode.findOne({
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    if (!invite) {
      return res.status(400).json({ message: 'Invalid or expired invite code' });
    }

    // (optional) return invite.garage if the front-end needs it 
    return res.status(200).json({ message: 'Valid invite code' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;