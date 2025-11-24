const User = require("../models/User");
const jwt = require("jsonwebtoken");

async function userAuth(req, res, next) {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied, no token provided" });
    }

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decodedToken;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User does not exist" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = {
  userAuth,
};
