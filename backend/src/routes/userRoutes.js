import express from "express";
import {
  getProfile,
  updateUser,
  deleteSelf,
  adminDeleteUser,
  banUser,
  unbanUser,
  getOrganizerDetails,
  getFullOrganizerDetails,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.patch("/update", protect, updateUser);
router.delete("/delete", protect, deleteSelf);

// Admin-only routes
router.delete("/:id", protect, adminOnly, adminDeleteUser);
router.patch("/:id/ban", protect, adminOnly, banUser);
router.patch("/:id/unban", protect, adminOnly, unbanUser);
router.get("/:id/organizer-details", protect, adminOnly, getOrganizerDetails);
router.get("/:id/full-details", protect, adminOnly, getFullOrganizerDetails);

export default router;
