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
    garage: {type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true} // <- tu som doplnil garaz nech user je viazany k garazi
});
//schema na ukladanie invite kodu
module.exports = mongoose.model('InviteCode', inviteCodeSchema);
