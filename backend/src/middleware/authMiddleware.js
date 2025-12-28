import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  // Test mode: allow x-test-user header for testing
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    const testUser = req.get('x-test-user');
    if (testUser) {
      try {
        req.user = JSON.parse(testUser);
        return next();
      } catch (err) {
        // Fall through to normal auth if parsing fails
      }
    }
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    
    // Check if user is banned
    if (req.user && req.user.isBanned) {
      return res.status(403).json({ 
        message: "Your account has been banned and you cannot perform this action.",
        banReason: req.user.banReason,
        bannedAt: req.user.bannedAt
      });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// Optional: restrict based on roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
};
