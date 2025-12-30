import express from "express";
import { register, login, logout, verifyEmail, resendVerification } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

// Protected routes
router.post("/logout", protect, logout);

export default router;
