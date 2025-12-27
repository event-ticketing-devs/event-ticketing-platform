import jwt from "jsonwebtoken";
import User from "../models/User.js";
import transporter from "../utils/mailer.js";

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
    const { name, email, phone, password } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid or missing email" });
    }

    // Validate phone number (required)
    const phoneRegex = /^\d{10}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits" });
    }

    // Validate password (required)
    if (!password || !/^.{6,}$/.test(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check for existing email
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Check for existing phone
    const existingPhoneUser = await User.findOne({ phone });
    if (existingPhoneUser) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // Create new user
    const user = await User.create({ name, email, phone, password });

    // Send welcome email (Nodemailer + Mailhog)
    await transporter.sendMail({
      from: '"Event Ticketing" <welcome@example.com>',
      to: user.email,
      subject: `Welcome to Event Ticketing Platform!`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px;">
          <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
            <h1 style="color: #2d7ff9; text-align: center;">👋 Welcome, ${user.name}!</h1>
            <hr style="margin: 16px 0;">
            <p style="font-size: 1.1em;">Thank you for registering at <strong>Event Ticketing Platform</strong>!</p>
            <ul style="list-style: none; padding: 0; font-size: 1.1em;">
              <li><strong>Name:</strong> ${user.name}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Phone:</strong> ${user.phone}</li>
            </ul>
            <hr style="margin: 16px 0;">
            <p style="text-align: center; color: #888;">We’re excited to have you join our events community!</p>
          </div>
        </div>
      `,
    });

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

    // Check if user has a password (not OAuth user)
    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ 
        message: "Your account has been banned and you cannot log in.",
        banReason: user.banReason,
        bannedAt: user.bannedAt
      });
    }

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
