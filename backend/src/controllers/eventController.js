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

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!date) missingFields.push("date");
    if (!categoryId) missingFields.push("categoryId");
    if (!venue) missingFields.push("venue");
    if (price == null) missingFields.push("price");
    if (totalSeats == null) missingFields.push("totalSeats");
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    // Check for duplicate event title (case-insensitive)
    const existingEvent = await Event.findOne({
      title: { $regex: `^${title}$`, $options: "i" },
    });
    if (existingEvent) {
      return res
        .status(400)
        .json({ message: "Event with same title already exists" });
    }

    // Validate price and totalSeats
    if (isNaN(price) || price < 0) {
      return res
        .status(400)
        .json({ message: "Price must be a non-negative number" });
    }
    if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
      return res
        .status(400)
        .json({ message: "Total seats must be a positive integer" });
    }

    // Prevent creating events with past dates
    if (new Date(date) < new Date()) {
      return res
        .status(400)
        .json({ message: "Event date must be in the future" });
    }

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

    // Check for duplicate event title (case-insensitive) if title is being updated
    if (
      Object.prototype.hasOwnProperty.call(req.body, "title") &&
      req.body.title &&
      req.body.title !== event.title
    ) {
      const duplicate = await Event.findOne({
        title: { $regex: `^${req.body.title}$`, $options: "i" },
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        return res
          .status(400)
          .json({ message: "Event with same title already exists" });
      }
    }

    const isOwner = req.user._id.toString() === event.organizerId.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this event" });
    }

    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: "Cannot update past events" });
    }

    // Validate fields if present in update
    if (Object.prototype.hasOwnProperty.call(req.body, "price")) {
      if (isNaN(req.body.price) || req.body.price < 0) {
        return res
          .status(400)
          .json({ message: "Price must be a non-negative number" });
      }
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "totalSeats")) {
      if (!Number.isInteger(req.body.totalSeats) || req.body.totalSeats <= 0) {
        return res
          .status(400)
          .json({ message: "Total seats must be a positive integer" });
      }
      // Check if reducing totalSeats below already booked seats
      const totalBooked = await Booking.aggregate([
        { $match: { eventId: event._id } },
        { $group: { _id: null, total: { $sum: "$noOfSeats" } } },
      ]);
      const bookedSeats = totalBooked[0]?.total || 0;
      if (req.body.totalSeats < bookedSeats) {
        return res.status(400).json({
          message: `Cannot set totalSeats below already booked seats (${bookedSeats})`,
        });
      }
    }
    if (req.body.date && new Date(req.body.date) < new Date()) {
      return res
        .status(400)
        .json({ message: "Event date must be in the future" });
    }

    const prevDate = event.date;
    const prevPrice = event.price;

    const updatableFields = [
      "title",
      "description",
      "date",
      "categoryId",
      "venue",
      "price",
      "totalSeats",
      "photo",
    ];
    let isDifferent = false;
    for (const field of updatableFields) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, field) &&
        String(event[field]) !== String(req.body[field])
      ) {
        isDifferent = true;
        break;
      }
    }
    if (!isDifferent) {
      return res
        .status(400)
        .json({ message: "No changes detected. Event not updated." });
    }

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

      await Booking.updateMany(
        { eventId: event._id },
        { $set: { cancelledByEvent: true, refundStatus: "pending" } }
      );

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
