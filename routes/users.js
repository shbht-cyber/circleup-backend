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
    console.error("Update user Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

//delete a user
router.delete("/delete", userAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete({ _id: req.user._id });
    return res
      .status(200)
      .json({ success: true, message: "Profile deleted successfully" });
  } catch (err) {
    console.error("Delete user Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// get user
router.get("/get", userAuth, async (req, res) => {
  try {
    const user = req.user;

    const data = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      coverPicture: user.coverPicture,
      followers: user.followers,
      followings: user.followings,
      desc: user.desc,
      city: user.city,
      from: user.from,
      relationship: user.relationship,
      isAdmin: user.isAdmin,
    };

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user: data,
    });
  } catch (err) {
    console.error("Get user Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

//follow a user
router.put("/:id/follow", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const targetId = req.params.id;

    // Prevent self follow
    if (loggedInUser._id.toString() === targetId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow your own account",
      });
    }

    // Check target user exists
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already following
    if (targetUser.followers.includes(loggedInUser._id)) {
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
      });
    }

    // Update followers and following
    targetUser.followers.push(loggedInUser._id);
    loggedInUser.followings.push(targetId);

    await targetUser.save();
    await loggedInUser.save();

    return res.status(200).json({
      success: true,
      message: "User followed successfully",
    });
  } catch (err) {
    console.error("Follow user Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

module.exports = router;
