const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');


router.put('/update', auth, async (req, res) => {//put na usera na zmenu mena
    const { email, name } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (name) {
            user.name = name;
        } else {
            return res.status(400).json({ message: 'Name is required for update' });
        }
        await user.save();

        res.status(200).json({
            message: 'User name updated successfully',
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                garage: user.garage
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error during update',
            error: error.message
        });
    }
});
module.exports = router;