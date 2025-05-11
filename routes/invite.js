const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crypto = require('crypto');
const InviteCode = require('../models/InviteCode');
const { sendEmail } = require('../utils/firebase');

// Function to generate a random invite code
function generateRandomCode(byteLength = 4) {
  return crypto.randomBytes(byteLength).toString('hex');
}

// Function to create an invite code associated with a garage
async function createInviteCode(garageId, expirationInHours = 24) {
  if (!garageId) throw new Error('garageId is required');
  const code = generateRandomCode(4); // e.g., 8 characters
  const expiresAt = new Date(Date.now() + expirationInHours * 60 * 60 * 1000);
  const invite = new InviteCode({
    code: code,
    expiresAt: expiresAt,
    used: false,
    garage: garageId,
  });
  try {
    const savedInvite = await invite.save();
    console.log('Generated invite code:', savedInvite.code);
    return savedInvite;
  } catch (error) {
    console.error('Error creating invite code:', error);
    throw error;
  }
}

// POST /api/invite - generate an invite code for a given garage and send email
router.post('/', auth, async (req, res) => {
  // Only allow admins to generate invite codes
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { garageId, email } = req.body;
  if (!garageId || !email) {
    return res.status(400).json({ message: 'garageId and email are required' });
  }

  try {
    const invite = await createInviteCode(garageId);
    
    // Send email with invite code
    const emailResult = await sendEmail(
      email,
      'Your MyGarage Invite Code',
      `Hello! Your invite code for joining the garage is: ${invite.code}. It expires at ${invite.expiresAt.toISOString()}.`,
      `<p>Hello!</p><p>Your invite code for joining the garage is: <strong>${invite.code}</strong>. It expires at ${invite.expiresAt.toISOString()}.</p>`
    );

    if (!emailResult.success) {
      throw new Error('Failed to send email');
    }

    res.status(201).json({ code: invite.code, expiresAt: invite.expiresAt, message: 'Invite code generated and email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/invite/verify - verify an invite code
router.post('/verify', auth, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Invite code is required' });
  }

  try {
    const invite = await InviteCode.findOne({ code, used: false });
    if (!invite) {
      throw new Error('Invalid or used invite code');
    }
    if (invite.expiresAt < new Date()) {
      throw new Error('Invite code has expired');
    }
    res.status(200).json({
      message: 'Invite code verified successfully',
      garageId: invite.garage,
      code: invite.code,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;