import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

// Generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Google OAuth login/signup
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    if (!email || !googleId) {
      return res
        .status(400)
        .json({ message: "Google account missing email or ID" });
    }

    // Check if user already exists by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    let isNewUser = false;
    if (!user) {
      const newUserData = {
        name: name || email,
        email,
        googleId,
        role: "attendee",
        isVerified: true,
      };
      user = await User.create(newUserData);
      isNewUser = true;
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // Send welcome email for new Google OAuth users
    if (isNewUser) {
      const transporter = (await import("../utils/mailer.js")).default;
      await transporter.sendMail({
        from: '"Event Ticketing" <welcome@example.com>',
        to: user.email,
        subject: `Welcome to Event Ticketing Platform!`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px;">
            <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
              <h1 style="color: #2d7ff9; text-align: center;">👋 Welcome, ${
                user.name || user.email
              }!</h1>
              <hr style="margin: 16px 0;">
              <p style="font-size: 1.1em;">Thank you for registering at <strong>Event Ticketing Platform</strong>!</p>
              <ul style="list-style: none; padding: 0; font-size: 1.1em;">
                <li><strong>Name:</strong> ${user.name || user.email}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                ${
                  user.phone
                    ? `<li><strong>Phone:</strong> ${user.phone}</li>`
                    : ""
                }
              </ul>
              <hr style="margin: 16px 0;">
              <p style="text-align: center; color: #888;">We’re excited to have you join our events community!</p>
            </div>
          </div>
        `,
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        googleId: user.googleId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Google Auth Error:", err);

    if (err.message.includes("E11000")) {
      return res.status(409).json({
        message: "Duplicate key error",
        error: err.message,
      });
    }

    return res.status(401).json({
      message: "Invalid Google token or server error",
      error: err.message,
    });
  }
};
