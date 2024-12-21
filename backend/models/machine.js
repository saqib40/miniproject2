const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        required: true,
    },
    password: {
        type: String,
    }
});

module.exports = mongoose.model('Machines', machineSchema);