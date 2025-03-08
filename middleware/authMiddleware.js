const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

// Only login user can access
const protect = expressAsyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login.");
    }

    //   Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // Get user id from token
    const user = await User.findById(verified.id).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }
    if (user.role === "suspended") {
      res.status(400);
      throw new Error("User suspended, please contact support.");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login.");
  }
});

// Only author/admin can do this operation
const authorOnly = expressAsyncHandler(async (req, res, next) => {
  if (req.user.role === "author" || req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized, Only author/admin can do this operation.");
  }
});

// Only verified can do this operation
const verifiedOnly = expressAsyncHandler(async (req, res, next) => {
  if (req.user && req.user.isVerified) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized, account not verified.");
  }
});

// Only admin can do this operation
const adminOnly = expressAsyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized, Only admin can do this operation.");
  }
});

module.exports = { protect, authorOnly, verifiedOnly, adminOnly };
