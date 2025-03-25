const crypto = require('crypto');
const mongoose = require('mongoose');
const InviteCode = require('../models/InviteCode');

function generateRandomCode(byteLength = 4) {
    return crypto.randomBytes(byteLength).toString('hex');//funkcia co generuje invite
}
async function createInviteCode(expirationInHours = 24) {
    const code = generateRandomCode(4); // napr. 8 znakov
    const expiresAt = new Date(Date.now() + expirationInHours * 60 * 60 * 1000);
    const invite = new InviteCode({
        code: code,
        expiresAt: expiresAt,
        used: false
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

module.exports = createInviteCode;
