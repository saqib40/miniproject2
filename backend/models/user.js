const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    machines: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Machines",
        }
    ]
});

module.exports = mongoose.model('Users', userSchema);