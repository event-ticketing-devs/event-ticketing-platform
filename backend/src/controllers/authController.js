import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Utility to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, googleId } = req.body;

    // Validate email format (required for both regular and Google users)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid or missing email" });
    }

    // If registering via Google OAuth (googleId present)
    if (googleId) {
      // Check if user already exists with this googleId or email
      let user = await User.findOne({ $or: [{ googleId }, { email }] });
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }
      // Phone is optional for Google users
      user = await User.create({ name, email, googleId, phone });
      return res
        .status(201)
        .json({ message: "User registered via Google OAuth" });
    }

    // For regular signup, phone is required
    const phoneRegex = /^\d{10}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits" });
    }

    // Require password for regular signup
    if (!password || !/^.{6,}$/.test(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser)
      return res.status(400).json({ message: "Email already in use" });

    const existingPhoneUser = await User.findOne({ phone });
    if (existingPhoneUser)
      return res.status(400).json({ message: "Phone number already in use" });

    const user = await User.create({ name, email, phone, password });

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Login user with email or phone
// @route  POST /api/auth/login
// @access Public
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // use "identifier" instead of just email

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email/phone and password" });
    }

    // Try finding the user by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Logout user
// @route  POST /api/auth/logout
// @access Protected
export const logout = (req, res) => {
  res
    .status(200)
    .json({ message: "Logout successful — delete token on client" });
};
