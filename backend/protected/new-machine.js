// protected/new-machine.js
const machineModel = require("../models/machine");
const userModel = require("../models/user");
const bcrypt = require("bcrypt");

async function newM(req, res) {
    try {
        const { name, password } = req.body;

        const existingMachine = await machineModel.findOne({ name });
        if (existingMachine) {
            return res.status(400).json({
                success: false,
                message: "Machine already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const machine = await machineModel.create({
            name,
            password: hashedPassword,
            status: 'pending',
            lastSeen: null
        });

        await userModel.findByIdAndUpdate(
            req.user.id,
            { $push: { machines: machine._id } }
        );

        return res.status(200).json({
            success: true,
            message: "Machine created successfully",
            data: {
                machineId: machine._id,
                name: machine.name,
                status: machine.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = newM;