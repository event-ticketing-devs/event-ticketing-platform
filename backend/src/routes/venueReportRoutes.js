import express from "express";
import {
  createVenueReport,
  getAllVenueReports,
  getFlaggedVenues,
  updateVenueReportStatus,
  getUserVenueReports,
} from "../controllers/venueReportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// User routes
router.post("/", protect, createVenueReport);
router.get("/my-reports", protect, getUserVenueReports);

// Admin routes
router.get("/", protect, adminOnly, getAllVenueReports);
router.get("/venues/flagged", protect, adminOnly, getFlaggedVenues);
router.patch("/:id", protect, adminOnly, updateVenueReportStatus);

export default router;
