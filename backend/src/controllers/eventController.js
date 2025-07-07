import Event from "../models/Event";
import User from "../models/User";

// @desc    Create new event
// @route   POST /api/events
// @access  Logged-in users (attendee/organizer)
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, categoryId, price, totalSeats, photo } =
      req.body;

    // Create the event
    const event = await Event.create({
      title,
      description,
      date,
      categoryId,
      price,
      totalSeats,
      photo,
      organizerId: req.user._id,
    });

    // If user is attendee, promote to organizer
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
