import jwt from "jsonwebtoken";
import crypto from "crypto";
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

    // Generate verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email (Nodemailer + Mailhog) - non-blocking
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    try {
      await transporter.sendMail({
        from: '"Event Ticketing" <noreply@example.com>',
        to: user.email,
        subject: `Verify Your Email - Event Ticketing Platform`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px;">
            <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
              <h1 style="color: #2d7ff9; text-align: center;">Verify Your Email</h1>
              <hr style="margin: 16px 0;">
              <p style="font-size: 1.1em;">Hi ${user.name},</p>
              <p style="font-size: 1.1em;">Thank you for registering at <strong>Event Ticketing Platform</strong>!</p>
              <p style="font-size: 1.1em;">Please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${verificationUrl}" style="background: #2d7ff9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 1.1em;">Verify Email</a>
              </div>
              <p style="font-size: 0.9em; color: #666;">Or copy and paste this link in your browser:</p>
              <p style="font-size: 0.9em; color: #666; word-break: break-all;">${verificationUrl}</p>
              <hr style="margin: 16px 0;">. Please check your email to verify your account.
              <p style="text-align: center; color: #888; font-size: 0.9em;">This link will expire in 24 hours.</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr.message);
      // Continue anyway - email failure shouldn't block registration
    }

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

// @desc   Verify email address
// @route  GET /api/auth/verify-email/:token
// @access Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token and check expiry
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired verification token. Please request a new verification email." 
      });
    }

    // Mark user as verified and clear verification fields
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully! You can now log in and access all features.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Resend verification email
// @route  POST /api/auth/resend-verification
// @access Public
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    try {
      await transporter.sendMail({
        from: '"Event Ticketing" <noreply@example.com>',
        to: user.email,
        subject: `Verify Your Email - Event Ticketing Platform`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px;">
            <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
              <h1 style="color: #2d7ff9; text-align: center;">Verify Your Email</h1>
              <hr style="margin: 16px 0;">
              <p style="font-size: 1.1em;">Hi ${user.name},</p>
              <p style="font-size: 1.1em;">You requested a new verification email for <strong>Event Ticketing Platform</strong>!</p>
              <p style="font-size: 1.1em;">Please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${verificationUrl}" style="background: #2d7ff9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 1.1em;">Verify Email</a>
              </div>
              <p style="font-size: 0.9em; color: #666;">Or copy and paste this link in your browser:</p>
              <p style="font-size: 0.9em; color: #666; word-break: break-all;">${verificationUrl}</p>
              <hr style="margin: 16px 0;">
              <p style="text-align: center; color: #888; font-size: 0.9em;">This link will expire in 24 hours.</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr.message);
      return res.status(500).json({ message: "Failed to send verification email" });
    }

    res.status(200).json({
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
