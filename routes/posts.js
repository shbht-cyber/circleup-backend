const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const validator = require("validator");

const { userAuth } = require("../middlewares/auth");

// Create a post
router.post("/", userAuth, async (req, res) => {
  try {
    const { desc, img } = req.body;

    // Validation: at least one field must exist
    if (!desc && !img) {
      return res.status(400).json({
        success: false,
        message: "Post content cannot be empty. Please add text or an image.",
      });
    }

    if (img && !validator.isURL(img)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image URL format",
      });
    }

    // Create new post
    const newPost = new Post({
      userId: req.user._id.toString(),
      desc,
      img,
    });

    const savedPost = await newPost.save();

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: savedPost,
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
