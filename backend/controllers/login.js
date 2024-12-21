const userModel = require("../models/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");

async function login(req,res) {
    try {
        // get the data
        const {email,password} = req.body;
        // check for registered user
        let user = await userModel.findOne({email});
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "User is not registered",
          });
        }
        // verify password and generate a JWT token
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
              email: user.email,
              id: user._id,
            };
            let token = jwt.sign(payload, process.env.JWT_SECRET, {
              expiresIn: "2h",
            });
            res.status(200).json({
                success: true,
                token,
                message: "User logged in successfully",
            });
        }

    } catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Login failure",
        });
    }
}

module.exports = login;