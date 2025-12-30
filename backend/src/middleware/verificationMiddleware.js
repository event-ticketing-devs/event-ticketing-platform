/**
 * Middleware to ensure user has verified their email address
 * before performing certain actions like creating venues or events
 */
export const requireVerification = (req, res, next) => {
  // Check if user exists (should be set by protect middleware)
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Check if user is verified
  if (!req.user.isVerified) {
    return res.status(403).json({
      message: "Please verify your email address to perform this action.",
      requiresVerification: true,
    });
  }

  next();
};
