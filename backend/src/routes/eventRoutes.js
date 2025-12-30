import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventSeatInfo,
  getAdminStats,
  getCoOrganizers,
  addCoOrganizer,
  removeCoOrganizer,
  getVerifiers,
  addVerifier,
  removeVerifier,
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import { checkBannedOrganizer } from "../middleware/banMiddleware.js";
import { requireVerification } from "../middleware/verificationMiddleware.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

router.post("/", protect, requireVerification, checkBannedOrganizer, upload.single("photo"), createEvent);
router.get("/", getAllEvents);
router.get("/admin/stats", protect, adminOnly, getAdminStats);
router.get("/:id", getEventById);
router.patch("/:id", protect, requireVerification, checkBannedOrganizer, upload.single("photo"), updateEvent);
router.delete("/:id", protect, deleteEvent);
router.get("/:id/seats", getEventSeatInfo);

// Co-organizer management routes
router.get("/:id/co-organizers", protect, getCoOrganizers);
router.post("/:id/co-organizers", protect, addCoOrganizer);
router.delete("/:id/co-organizers/:userId", protect, removeCoOrganizer);

// Verifier management routes
router.get("/:id/verifiers", protect, getVerifiers);
router.post("/:id/verifiers", protect, addVerifier);
router.delete("/:id/verifiers/:userId", protect, removeVerifier);

export default router;
