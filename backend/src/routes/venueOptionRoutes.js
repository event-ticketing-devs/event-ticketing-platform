import express from "express";
import {
  getVenueOptions,
  getVenueOption,
  createVenueOption,
  updateVenueOption,
  deleteVenueOption,
} from "../controllers/venueOptionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public route - get all active options
router.get("/", getVenueOptions);

// Admin routes
router.post("/", protect, adminOnly, createVenueOption);
router.get("/:id", protect, adminOnly, getVenueOption);
router.patch("/:id", protect, adminOnly, updateVenueOption);
router.delete("/:id", protect, adminOnly, deleteVenueOption);

export default router;
