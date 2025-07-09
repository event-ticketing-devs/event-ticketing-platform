import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventSeatInfo,
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.patch("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);
router.get("/:id/seats", getEventSeatInfo);

export default router;
