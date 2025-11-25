const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const validator = require("validator");

const { userAuth } = require("../middlewares/auth");

// Allowed fields to update
const ALLOWED_UPDATES = [
  "username",
  "password",
  "profilePicture",
  "coverPicture",
  "desc",
  "city",
  "from",
  "relationship",
];

// update user
router.put("/update", userAuth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);

    // Check if request contains invalid fields
    const isValid = updates.every((key) => ALLOWED_UPDATES.includes(key));
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid fields in request",
      });
    }

    const user = req.user;

    // VALIDATIONS
    if (req.body.username) {
      if (req.body.username.length < 3 || req.body.username.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Username must be 3–20 characters",
        });
      }
    }

    if (req.body.password) {
      if (!validator.isStrongPassword(req.body.password, { minLength: 6 })) {
        return res.status(400).json({
          success: false,
          message: "Password must be strong (min 6 chars and mix of types)",
        });
      }

      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    // UPDATE fields
    updates.forEach((key) => {
      user[key] = req.body[key];
    });

    const updatedUser = await user.save();

    // safe user object
    const safeUser = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      coverPicture: updatedUser.coverPicture,
      followers: updatedUser.followers,
      followings: updatedUser.followings,
      desc: updatedUser.desc,
      city: updatedUser.city,
      from: updatedUser.from,
      relationship: updatedUser.relationship,
      isAdmin: updatedUser.isAdmin,
    };

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("Update Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

module.exports = router;
