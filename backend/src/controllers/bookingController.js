import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import crypto from "crypto";

function generateTicketCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// @desc Create a new booking
// @route POST /api/bookings
// @access Logged-in users
export const createBooking = async (req, res) => {
  try {
    const { eventId, noOfSeats } = req.body;
    const userId = req.user._id;

    if (!eventId || noOfSeats == null) {
      return res
        .status(400)
        .json({ message: "Event ID and seat count are required" });
    }
    if (!Number.isInteger(noOfSeats) || noOfSeats <= 0 || noOfSeats > 10) {
      return res
        .status(400)
        .json({ message: "Seat count must be between 1 and 10" });
    }

    // Validate eventId exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Validate userId exists (should always exist if authenticated, but for completeness)
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (event.cancelled) {
      return res.status(400).json({ message: "Cannot book a cancelled event" });
    }

    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: "Cannot book past events" });
    }

    const existing = await Booking.findOne({ eventId, userId });
    if (existing)
      return res.status(400).json({ message: "You already booked this event" });

    const totalBooked = await Booking.aggregate([
      { $match: { eventId: event._id } },
      { $group: { _id: null, total: { $sum: "$noOfSeats" } } },
    ]);
    const bookedSeats = totalBooked[0]?.total || 0;

    if (bookedSeats + noOfSeats > event.totalSeats) {
      return res.status(400).json({ message: "Not enough seats available" });
    }

    // Generate unique ticket code
    let ticketCode;
    let codeExists = true;
    while (codeExists) {
      ticketCode = generateTicketCode();
      codeExists = await Booking.exists({ ticketCode });
    }

    const booking = await Booking.create({
      eventId,
      userId,
      noOfSeats,
      priceAtBooking: event.price,
      ticketCode,
      verified: false,
    });

    // TODO: Send confirmation email with ticketCode

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Cancel a booking
// @route DELETE /api/bookings/:id
// @access Booking owner only
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this booking" });
    }

    const event = await Event.findById(booking.eventId);
    if (event && new Date(event.date) < new Date()) {
      return res
        .status(400)
        .json({ message: "Cannot cancel booking for past events" });
    }

    await booking.deleteOne();
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get bookings for logged-in user
// @route GET /api/bookings/user
// @access Logged-in users
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("eventId")
      .select("+ticketCode +verified"); // ensure ticketCode and verified are included
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get bookings for a specific event
// @route GET /api/bookings/event/:eventId
// @access Organizer or Admin
export const getBookingsByEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      event.organizerId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these bookings" });
    }

    const bookings = await Booking.find({ eventId: event._id }).populate(
      "userId",
      "name email"
    );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Organizer verifies ticket code
// @route POST /api/bookings/verify
// @access Organizer
export const verifyBookingCode = async (req, res) => {
  try {
    const { code, eventId } = req.body;
    const booking = await Booking.findOne({ ticketCode: code });
    if (!booking)
      return res
        .status(404)
        .json({ message: "Invalid code or booking cancelled" });

    // Check if booking belongs to the selected event
    if (eventId && booking.eventId.toString() !== eventId) {
      return res
        .status(400)
        .json({ message: "Ticket code does not belong to this event" });
    }

    if (booking.verified)
      return res.status(400).json({ message: "Already verified" });

    booking.verified = true;
    await booking.save();
    res.json({ message: "Booking verified", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
