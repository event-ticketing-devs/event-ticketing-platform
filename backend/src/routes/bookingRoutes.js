import express from "express";
import {
  createBooking,
  cancelBooking,
  getUserBookings,
  getBookingsByEvent,
  verifyBookingCode,
  getTicketQR,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.delete("/:id", protect, cancelBooking);
router.get("/user", protect, getUserBookings);
router.get("/event/:eventId", protect, getBookingsByEvent);
router.get("/:id/qr", protect, getTicketQR);
router.post("/verify", protect, verifyBookingCode);

export default router;
