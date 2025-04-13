const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const InviteCode = require('../models/InviteCode');

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


router.post('/register', auth, async (req, res) => {
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



module.exports = router;