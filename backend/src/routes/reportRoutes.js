import express from "express";
import {
  createReport,
  getAllReports,
  getFlaggedEvents,
  updateReportStatus,
  getUserReports,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// User routes
router.post("/", protect, createReport);
router.get("/my-reports", protect, getUserReports);

// Admin routes
router.get("/", protect, adminOnly, getAllReports);
router.get("/events/flagged", protect, adminOnly, getFlaggedEvents);
router.patch("/:id", protect, adminOnly, updateReportStatus);

export default router;
