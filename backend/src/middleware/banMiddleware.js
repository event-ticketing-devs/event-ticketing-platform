import User from "../models/User.js";

// Middleware to check if a user is banned
export const checkBannedUser = async (req, res, next) => {
  try {
    // Only check for authenticated users
    if (!req.user || !req.user._id) {
      return next();
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ 
        message: "Your account has been banned and you cannot perform this action.",
        banReason: user.banReason,
        bannedAt: user.bannedAt
      });
    }

    next();
  } catch (error) {
    console.error("Error checking banned user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Middleware to check if a user is banned for organizer-specific actions
export const checkBannedOrganizer = async (req, res, next) => {
  try {
    // Only check for authenticated users with organizer role
    if (!req.user || !req.user._id) {
      return next();
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is banned and trying to perform organizer actions
    if (user.isBanned && user.role === "organizer") {
      return res.status(403).json({ 
        message: "Your organizer account has been banned. You cannot create or manage events.",
        banReason: user.banReason,
        bannedAt: user.bannedAt
      });
    }

    next();
  } catch (error) {
    console.error("Error checking banned organizer:", error);
    res.status(500).json({ message: "Server error" });
  }
};
