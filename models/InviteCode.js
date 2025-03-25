const mongoose = require('mongoose');

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
});
//schema na ukladanie invite kodu
module.exports = mongoose.model('InviteCode', inviteCodeSchema);
