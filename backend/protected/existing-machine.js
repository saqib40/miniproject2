// protected/existing-machine.js
const machineModel = require("../models/machine");
const bcrypt = require("bcrypt");
const { sendCommandToMachine } = require('../config/ws');

async function existing(req, res) {
    try {
        const { machineName, password, command } = req.body;
        
        if (!command || !['lock', 'unlock'].includes(command)) {
            return res.status(400).json({
                success: false,
                message: "Invalid command. Use 'lock' or 'unlock'"
            });
        }

        const machine = await machineModel.findOne({ name: machineName });
        
        if (!machine) {
            return res.status(404).json({
                success: false,
                message: 'Machine not found'
            });
        }

        if (!await bcrypt.compare(password, machine.password)) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        try {
            await sendCommandToMachine(machine._id.toString(), command);
            res.status(200).json({
                success: true,
                message: 'Command sent successfully'
            });
        } catch (error) {
            res.status(503).json({
                success: false,
                message: 'Machine is not connected'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = existing;