const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String
    },
    status: {
        type: String,
        enum: ['locked', 'unlocked', 'offline', 'pending'],
        default: 'offline'
    },
    lastSeen: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Machines', machineSchema);