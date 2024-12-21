const jwt = require("jsonwebtoken");

async function auth(req,res,next) {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({
                success:false,
                message:"Token missing",
            });
        }
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        const isTokenExpired = decoded.exp < Date.now() / 1000;
        if (isTokenExpired) {
            return res.status(401).json({
                success: false,
                message: "Token has expired, login again",
            });
        }
        req.user = decoded;
        next();
    } catch(error) {
        return res.status(401).json({
            success: false,
            message: "Something went wrong while verifying the user",
        });
    }
}
module.exports = auth;