import Event from "../models/Event.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import { deleteImage } from "../utils/cloudinary.js";

// @desc    Create new event
// @route   POST /api/events
// @access  Logged-in users (attendee/organizer/admin)
export const createEvent = async (req, res) => {
  try {
    let {
      title,
      description,
      date,
      categoryId,
      city,
      venue,
      price,
      totalSeats,
      ticketCategories,
      hasTicketCategories,
    } = req.body;

    // Parse venue if it's a JSON string (from FormData)
    if (typeof venue === "string") {
      try {
        venue = JSON.parse(venue);
      } catch (error) {
        return res.status(400).json({ message: "Invalid venue format" });
      }
    }

    // Parse ticketCategories if it's a JSON string (from FormData)
    if (typeof ticketCategories === "string") {
      try {
        ticketCategories = JSON.parse(ticketCategories);
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid ticket categories format" });
      }
    }

    // Convert boolean fields from strings (FormData)
    if (typeof hasTicketCategories === "string") {
      hasTicketCategories = hasTicketCategories === "true";
    }

    // Get photo URL from uploaded file
    const photo = req.file ? req.file.path : null;

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!date) missingFields.push("date");
    if (!categoryId) missingFields.push("categoryId");
    if (!city) missingFields.push("city");
    if (
      !venue ||
      !venue.name ||
      !venue.address ||
      !venue.coordinates ||
      !venue.coordinates.lat ||
      !venue.coordinates.lng
    ) {
      missingFields.push("venue (with name, address, and coordinates)");
    }

    // Validate ticket categories or legacy pricing
    if (hasTicketCategories) {
      if (
        !ticketCategories ||
        !Array.isArray(ticketCategories) ||
        ticketCategories.length === 0
      ) {
        missingFields.push("ticketCategories");
      } else if (ticketCategories.length > 5) {
        return res.status(400).json({
          message: "Maximum 5 ticket categories allowed",
        });
      } else {
        // Validate each ticket category
        for (let i = 0; i < ticketCategories.length; i++) {
          const category = ticketCategories[i];
          if (!category.name || !category.price || !category.totalSeats) {
            return res.status(400).json({
              message: `Ticket category ${
                i + 1
              } must have name, price, and totalSeats`,
            });
          }
          // Convert numeric fields
          category.price = Number(category.price);
          category.totalSeats = Number(category.totalSeats);

          if (isNaN(category.price) || category.price < 0) {
            return res.status(400).json({
              message: `Ticket category "${category.name}" price must be a non-negative number`,
            });
          }
          if (
            !Number.isInteger(category.totalSeats) ||
            category.totalSeats <= 0
          ) {
            return res.status(400).json({
              message: `Ticket category "${category.name}" total seats must be a positive integer`,
            });
          }
        }
      }
    } else {
      // Legacy pricing validation
      if (price == null) missingFields.push("price");
      if (totalSeats == null) missingFields.push("totalSeats");

      if (price != null) {
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
          return res
            .status(400)
            .json({ message: "Price must be a non-negative number" });
        }
        price = numericPrice;
      }

      if (totalSeats != null) {
        const numericTotalSeats = Number(totalSeats);
        if (!Number.isInteger(numericTotalSeats) || numericTotalSeats <= 0) {
          return res
            .status(400)
            .json({ message: "Total seats must be a positive integer" });
        }
        totalSeats = numericTotalSeats;
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    // Validate categoryId exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid categoryId" });
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

    // Prevent creating events with past dates
    if (new Date(date) < new Date()) {
      return res
        .status(400)
        .json({ message: "Event date must be in the future" });
    }

    // Create event object
    const eventData = {
      title,
      description,
      date,
      categoryId,
      city,
      venue,
      photo,
      organizerId: req.user._id,
      hasTicketCategories: hasTicketCategories || false,
    };

    // Add pricing data based on event type
    if (hasTicketCategories) {
      eventData.ticketCategories = ticketCategories;
    } else {
      eventData.price = price;
      eventData.totalSeats = totalSeats;
    }

    const event = await Event.create(eventData);

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

    // Enrich events with availability data
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        if (event.hasTicketCategories && event.ticketCategories) {
          const bookings = await Booking.find({ eventId: event._id });

          // Calculate availability for each ticket category
          const enrichedCategories = event.ticketCategories.map((category) => {
            let bookedSeats = 0;

            // Sum booked seats for this category
            bookings.forEach((booking) => {
              if (booking.hasTicketCategories && booking.ticketItems) {
                const categoryBooking = booking.ticketItems.find(
                  (item) => item.categoryName === category.name
                );
                if (categoryBooking) {
                  bookedSeats += categoryBooking.quantity;
                }
              }
            });

            return {
              ...category.toObject(),
              bookedSeats,
              availableSeats: category.totalSeats - bookedSeats,
            };
          });

          // Return event with enriched ticket categories
          const eventData = event.toObject();
          eventData.ticketCategories = enrichedCategories;
          return eventData;
        } else {
          return event.toObject();
        }
      })
    );

    res.json(enrichedEvents);
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

    // If the event has ticket categories, enrich with availability data
    if (event.hasTicketCategories && event.ticketCategories) {
      const bookings = await Booking.find({ eventId: req.params.id });

      // Calculate availability for each ticket category
      const enrichedCategories = event.ticketCategories.map((category) => {
        let bookedSeats = 0;

        // Sum booked seats for this category
        bookings.forEach((booking) => {
          if (booking.hasTicketCategories && booking.ticketItems) {
            const categoryBooking = booking.ticketItems.find(
              (item) => item.categoryName === category.name
            );
            if (categoryBooking) {
              bookedSeats += categoryBooking.quantity;
            }
          }
        });

        return {
          ...category.toObject(),
          bookedSeats,
          availableSeats: category.totalSeats - bookedSeats,
        };
      });

      // Return event with enriched ticket categories
      const eventData = event.toObject();
      eventData.ticketCategories = enrichedCategories;
      res.json(eventData);
    } else {
      res.json(event);
    }
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

    if (req.body.venue && typeof req.body.venue === "string") {
      try {
        req.body.venue = JSON.parse(req.body.venue);
      } catch (error) {
        return res.status(400).json({ message: "Invalid venue format" });
      }
    }

    if (req.body.price !== undefined) {
      req.body.price = Number(req.body.price);
    }
    if (req.body.totalSeats !== undefined) {
      req.body.totalSeats = Number(req.body.totalSeats);
    }

    const newPhoto = req.file ? req.file.path : null;

    if (
      Object.prototype.hasOwnProperty.call(req.body, "categoryId") &&
      req.body.categoryId &&
      req.body.categoryId !== String(event.categoryId)
    ) {
      const category = await Category.findById(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid categoryId" });
      }
    }

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
        {
          $match: {
            eventId: event._id,
            cancelledByUser: { $ne: true },
            cancelledByEvent: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            legacySeats: {
              $sum: {
                $cond: [
                  { $eq: ["$hasTicketCategories", true] },
                  0,
                  "$noOfSeats",
                ],
              },
            },
            categorySeats: {
              $sum: {
                $cond: [
                  { $eq: ["$hasTicketCategories", true] },
                  "$totalQuantity",
                  0,
                ],
              },
            },
          },
        },
      ]);

      const bookedSeats = totalBooked[0]
        ? totalBooked[0].legacySeats + totalBooked[0].categorySeats
        : 0;
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
    const oldPhotoUrl = event.photo;

    const updatableFields = [
      "title",
      "description",
      "date",
      "categoryId",
      "city",
      "venue",
      "price",
      "totalSeats",
    ];

    // Handle photo update separately
    if (newPhoto) {
      req.body.photo = newPhoto;
      updatableFields.push("photo");
    }

    let isDifferent = false;
    for (const field of updatableFields) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;
      const oldVal = event[field];
      const newVal = req.body[field];
      let changed = false;
      if (field === "date") {
        // Compare as timestamps
        changed = new Date(oldVal).getTime() !== new Date(newVal).getTime();
      } else if (field === "price" || field === "totalSeats") {
        changed = Number(oldVal) !== Number(newVal);
      } else if (field === "categoryId" || field === "organizerId") {
        changed = String(oldVal) !== String(newVal);
      } else if (typeof oldVal === "string" && typeof newVal === "string") {
        changed = oldVal.trim() !== newVal.trim();
      } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
      } else {
        changed = String(oldVal) !== String(newVal);
      }
      if (changed) {
        isDifferent = true;
        break;
      }
    }
    if (!isDifferent) {
      return res
        .status(200)
        .json({ message: "No changes detected. Event not updated." });
    }

    Object.assign(event, req.body);
    await event.save();

    // Delete old image from Cloudinary if a new one was uploaded
    if (newPhoto && oldPhotoUrl) {
      try {
        await deleteImage(oldPhotoUrl);
      } catch (error) {
        console.error("Failed to delete old image:", error);
        // Don't fail the request if image deletion fails
      }
    }

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

    // Clean up image from Cloudinary before deletion
    if (event.photo) {
      try {
        await deleteImage(event.photo);
      } catch (error) {
        console.error("Failed to delete event image:", error);
        // Don't fail the deletion if image cleanup fails
      }
    }

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get seat availability for a specific event
// @route GET /api/events/:id/seats
// @access Public
export const getEventSeatInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const bookings = await Booking.find({ eventId: id });

    if (event.hasTicketCategories) {
      // Calculate availability for each ticket category
      const categoryAvailability = event.ticketCategories.map((category) => {
        let bookedSeats = 0;

        // Sum booked seats for this category
        bookings.forEach((booking) => {
          if (booking.hasTicketCategories && booking.ticketItems) {
            const categoryBooking = booking.ticketItems.find(
              (item) => item.categoryName === category.name
            );
            if (categoryBooking) {
              bookedSeats += categoryBooking.quantity;
            }
          }
        });

        return {
          name: category.name,
          price: category.price,
          description: category.description,
          totalSeats: category.totalSeats,
          bookedSeats,
          remainingSeats: category.totalSeats - bookedSeats,
        };
      });

      // Calculate total availability
      const totalSeats = event.ticketCategories.reduce(
        (sum, cat) => sum + cat.totalSeats,
        0
      );
      const totalBookedSeats = categoryAvailability.reduce(
        (sum, cat) => sum + cat.bookedSeats,
        0
      );

      return res.status(200).json({
        id: event._id,
        hasTicketCategories: true,
        ticketCategories: categoryAvailability,
        totalSeats,
        bookedSeats: totalBookedSeats,
        remainingSeats: totalSeats - totalBookedSeats,
      });
    } else {
      // Legacy seat calculation
      const bookedSeats = bookings.reduce((sum, b) => {
        if (b.hasTicketCategories) {
          return sum + (b.totalQuantity || 0);
        }
        return sum + (b.noOfSeats || 0);
      }, 0);

      return res.status(200).json({
        id: event._id,
        hasTicketCategories: false,
        totalSeats: event.totalSeats,
        bookedSeats,
        remainingSeats: event.totalSeats - bookedSeats,
        price: event.price,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
