const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     InviteCode:
 *       type: object
 *       required:
 *         - code
 *         - garage
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         code:
 *           type: string
 *           description: Unique invite code
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Time when the invite code was created
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Time when the invite code expires
 *         used:
 *           type: boolean
 *           description: Whether the invite code has been used
 *         garage:
 *           type: string
 *           description: ID of the garage this invite code is for
 */
const inviteCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
    },
    used: {
        type: Boolean,
        default: false,
    },
    garage: {type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true} // <- tu som doplnil garaz nech user je viazany k garazi
});
//schema na ukladanie invite kodu
module.exports = mongoose.model('InviteCode', inviteCodeSchema);
