import express from "express";
import {
  createReview,
  getVenueReviews,
  getReviewEligibility,
  deleteReview,
  reportReview,
  addOwnerResponse,
  updateOwnerResponse,
  deleteOwnerResponse,
  getMyReviews,
  getOwnerReviews,
  getReportedReviews,
  adminDeleteReview,
  dismissReport,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes
router.get("/venue/:venueId", getVenueReviews);

// Protected routes - User reviews
router.post("/venue/:venueId", protect, createReview);
router.get("/venue/:venueId/eligibility", protect, getReviewEligibility);
router.get("/my-reviews", protect, getMyReviews);
router.delete("/:id", protect, deleteReview);
router.post("/:id/report", protect, reportReview);

// Protected routes - Owner responses
router.post("/:id/response", protect, addOwnerResponse);
router.patch("/:id/response", protect, updateOwnerResponse);
router.delete("/:id/response", protect, deleteOwnerResponse);
router.get("/owner-reviews", protect, getOwnerReviews);

// Admin routes
router.get("/admin/reported", protect, admin, getReportedReviews);
router.delete("/admin/:id", protect, admin, adminDeleteReview);
router.patch("/admin/:id/dismiss-report", protect, admin, dismissReport);

export default router;
