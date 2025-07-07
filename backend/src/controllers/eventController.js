import Event from "../models/Event.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

// @desc    Create new event
// @route   POST /api/events
// @access  Logged-in users (attendee/organizer/admin)
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      categoryId,
      venue,
      price,
      totalSeats,
      photo,
    } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      categoryId,
      venue,
      price,
      totalSeats,
      photo,
      organizerId: req.user._id,
    });

    if (req.user.role === "attendee") {
      await User.findByIdAndUpdate(req.user._id, { role: "organizer" });
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("categoryId", "name");
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "categoryId",
      "name"
    );
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update event by ID
// @route   PATCH /api/events/:id
// @access  Organizer Only
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (req.user._id.toString() !== event.organizerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this event" });
    }

    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: "Cannot update past events" });
    }

    const prevDate = event.date;
    const prevPrice = event.price;

    Object.assign(event, req.body);
    await event.save();

    if (
      req.body.date &&
      new Date(req.body.date).toString() !== new Date(prevDate).toString()
    ) {
      // TODO: notify users about date change
      console.log("Notify users about date change");
    }

    if (req.body.price && req.body.price !== prevPrice) {
      // TODO: maybe notify organizer or admin
      console.log("Price updated — bookings remain at original price");
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete or cancel event by ID
// @route   DELETE /api/events/:id
// @access  Organizer or Admin
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isOwner = req.user._id.toString() === event.organizerId.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this event" });
    }

    const hasBookings = await Booking.exists({ eventId: event._id });

    if (hasBookings) {
      event.cancelled = true;
      event.cancelledReason =
        req.body.cancelledReason || "Cancelled by organizer";
      await event.save();

      const bookings = await Booking.find({ eventId: event._id });
      for (const booking of bookings) {
        booking.cancelledByEvent = true;
        booking.refundStatus = "pending"; // placeholder for future refund processing
        await booking.save();
      }

      return res.json({
        message: "Event cancelled and refunds marked as pending",
      });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
