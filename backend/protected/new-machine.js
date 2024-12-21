const machineModel = require("../models/machine");
const userModel = require("../models/user");
const bcrypt = require("bcrypt");

async function newM(req,res,next) {
    try {
        // particular machine
        const {name,password} = req.body;
        // create the particular machine in machines collection
        const existingMachine = await machineModel.findOne({ name });
        if (existingMachine) {
            return res.status(400).json({
              success: false,
              message: "Stupid you already have this machine",
            });
        }
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "Error in hashing password",
            });
        }
        // create entry for user in DB
        const machine = await machineModel.create({
            name,
            password: hashedPassword,
        });
        // add its reference
        const myUser = await userModel.findOneAndUpdate(
            {_id: req.user.id},
            {$push: {machines: machine}}
        );
        // ws logic
        //
        //
        return res.status(200).json({
            success: true,
            message: "Machine created successfully",
        }); 
    } catch(error) {
        res.status(500).json({
            success: false,
            data: "Internal server error",
            message: error.message,
        });
    }
}
module.exports = newM;