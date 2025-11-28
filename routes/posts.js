const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const validator = require("validator");

const { userAuth } = require("../middlewares/auth");

// Allowed fields for editing a post
const ALLOWED_UPDATES = ["desc", "img"];

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

// Update a post
router.put("/:id", userAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const loggedInUserId = req.user._id.toString();

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Ensure only post owner can update
    if (post.userId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can update only your own post.",
      });
    }

    const updates = Object.keys(req.body);

    // Validate allowed fields
    const isValidOperation = updates.every((field) =>
      ALLOWED_UPDATES.includes(field)
    );

    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: "Invalid fields provided for update",
      });
    }

    // Validate img URL if updating image
    if (req.body.img && !validator.isURL(req.body.img)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image URL format",
      });
    }

    // Apply updates safely
    updates.forEach((field) => (post[field] = req.body[field]));

    const updatedPost = await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (err) {
    console.error("Update Post Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// Delete a post
router.delete("/:id", userAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const loggedInUserId = req.user._id.toString();

    const post = await Post.findById(postId);

    // Check if post exists
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if logged-in user owns the post
    if (post.userId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own posts.",
      });
    }

    await post.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Delete Post Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// Like / Unlike a post
router.put("/:id/like", userAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const loggedInUserId = req.user._id.toString();

    const post = await Post.findById(postId);

    // Check if post exists
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.includes(loggedInUserId);

    if (!alreadyLiked) {
      await post.updateOne({ $push: { likes: loggedInUserId } });

      return res.status(200).json({
        success: true,
        message: "Post liked successfully",
      });
    } else {
      await post.updateOne({ $pull: { likes: loggedInUserId } });

      return res.status(200).json({
        success: true,
        message: "Post unliked successfully",
      });
    }
  } catch (err) {
    console.error("Like Post Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// Get post by ID
router.get("/:id", userAuth, async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);

    // If no post found
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      post: {
        id: post._id,
        userId: post.userId,
        desc: post.desc,
        img: post.img,
        likes: post.likes,
        likesCount: post.likes.length,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (err) {
    console.error("Get Post Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// Get timeline posts
router.get("/timeline/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // 1. Get user's own posts
    const userPosts = await Post.find({ userId: loggedInUser._id });

    // 2. Get posts of users they follow
    const friendPosts = await Post.find({
      userId: { $in: loggedInUser.followings },
    });

    // 3. Combine & sort by newest
    const timelinePosts = [...userPosts, ...friendPosts].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    return res.status(200).json({
      success: true,
      message: "Timeline fetched successfully",
      count: timelinePosts.length,
      posts: timelinePosts.map((post) => ({
        id: post._id,
        userId: post.userId,
        desc: post.desc,
        img: post.img,
        likes: post.likes,
        likesCount: post.likes.length,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Timeline Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});
module.exports = router;
