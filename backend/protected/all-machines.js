const userModel = require("../models/user");

async function all(req,res,next) {
    try {
        // get user
        const userId = req.user.id;
        // populate his machines
        const userWithMachines = await userModel
         .findById(userId)
         .populate('machines');
        // get his machines & username
        const machines = userWithMachines.machines;
        const username = userWithMachines.username;
        // send the response
        res.status(200).json({
            success: true,
            username: username,
            message: "Machines retrieved successfully",
            data: machines,
        })

    } catch(error) {
        res.status(500).json({
            success: false,
            data: "Internal server error",
            message: error.message,
        });
    }
}
module.exports = all;