import express from "express";
import {
  createBooking,
  cancelBooking,
  getUserBookings,
  getBookingsByEvent,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.delete("/:id", protect, cancelBooking);
router.get("/user", protect, getUserBookings);
router.get("/event/:eventId", protect, getBookingsByEvent);

export default router;
