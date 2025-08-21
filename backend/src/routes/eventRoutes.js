import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventSeatInfo,
  getAdminStats,
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import { checkBannedOrganizer } from "../middleware/banMiddleware.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

router.post("/", protect, checkBannedOrganizer, upload.single("photo"), createEvent);
router.get("/", getAllEvents);
router.get("/admin/stats", protect, adminOnly, getAdminStats);
router.get("/:id", getEventById);
router.patch("/:id", protect, checkBannedOrganizer, upload.single("photo"), updateEvent);
router.delete("/:id", protect, deleteEvent);
router.get("/:id/seats", getEventSeatInfo);

export default router;
