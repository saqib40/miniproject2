const userModel = require("../models/user");
const bcrypt = require("bcrypt");

async function signup(req,res) {
    try {
        // get the data
        const {email, password} = req.body;
        // check if user exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
              success: false,
              message: "User already exists",
            });
        }
        // if user doesn't already exist
        // hash the password
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
        const user = await userModel.create({
            email,
            password: hashedPassword,
        });
        return res.status(200).json({
            success: true,
            message: "User created successfully",
        });
    } catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Signup failure",
        });
    }
}
module.exports = signup;