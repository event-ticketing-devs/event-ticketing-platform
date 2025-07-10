import express from "express";
import {
  createBooking,
  cancelBooking,
  getUserBookings,
  getBookingsByEvent,
  verifyBookingCode, // add this import
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.delete("/:id", protect, cancelBooking);
router.get("/user", protect, getUserBookings);
router.get("/event/:eventId", protect, getBookingsByEvent);

// Route for organizers to verify ticket codes
router.post("/verify", verifyBookingCode);

export default router;
