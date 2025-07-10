import express from "express";
import { googleAuth } from "../controllers/googleAuthController.js";

const router = express.Router();

// @route   POST /api/auth/google
// @desc    Google OAuth login/registration
// @access  Public
router.post("/google", googleAuth);

export default router;
