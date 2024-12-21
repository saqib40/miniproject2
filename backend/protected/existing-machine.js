const machineModel = require("../models/machine");
const bcrypt = require("bcrypt");
const WebSocket = require('ws');

// ws logic as well




async function existing(req,res,next) {
    try {
        // we have to write websocket logic
        const {machineName, password} = req.body;
        const machine = await machineModel.findOne({machineName});
        if(!await bcrypt.compare(password, machine.password)) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }
        // if the password is correct

    } catch(error) {
        res.status(500).json({
            success: false,
            data: "Internal server error",
            message: error.message,
        });
    }
}
module.exports = existing;