import User from "../models/User.js";

// @desc   Get current user profile
// @route  GET /api/users/profile
// @access Protected
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email phone role"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Update user profile
// @route  PATCH /api/users/update
// @access Protected
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate phone format
    if (phone && !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits" });
    }

    // For regular users (no googleId), validate password length if updating password
    if (!user.googleId && password && !/^.{6,}$/.test(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if values are the same
    const isSameName = name === undefined || name === user.name;
    const isSameEmail = email === undefined || email === user.email;
    const isSamePhone = phone === undefined || phone === user.phone;
    const isSamePassword =
      password === undefined || (await user.comparePassword(password));

    if (isSameName && isSameEmail && isSamePhone && isSamePassword) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    // Check for email/phone uniqueness only if being changed
    if (email && email !== user.email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser)
        return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    if (phone && phone !== user.phone) {
      const existingPhoneUser = await User.findOne({ phone });
      if (existingPhoneUser)
        return res.status(400).json({ message: "Phone number already in use" });
      user.phone = phone;
    }

    if (!isSameName) user.name = name;
    if (!isSamePassword && password) user.password = password; // Will be hashed by pre-save

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Delete own account
// @route  DELETE /api/users/delete
// @access Protected
export const deleteSelf = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Your account has been deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Admin deletes a user by ID (except other admins)
// @route  DELETE /api/users/:id
// @access Protected/Admin
export const adminDeleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToDelete.role === "admin") {
      return res.status(403).json({ message: "Cannot delete an admin user" });
    }

    await userToDelete.deleteOne();
    res.status(200).json({ message: "User deleted by admin" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Ban a user (admin only)
// @route  PATCH /api/users/:id/ban
// @access Protected/Admin
export const banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const userToBan = await User.findById(req.params.id);
    
    if (!userToBan) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToBan.role === "admin") {
      return res.status(403).json({ message: "Cannot ban an admin user" });
    }

    if (userToBan.isBanned) {
      return res.status(400).json({ message: "User is already banned" });
    }

    userToBan.isBanned = true;
    userToBan.bannedAt = new Date();
    userToBan.bannedBy = req.user._id;
    userToBan.banReason = reason || "No reason provided";

    await userToBan.save();

    // Cancel all upcoming events by this user
    const Event = (await import("../models/Event.js")).default;
    await Event.updateMany(
      { 
        organizerId: userToBan._id, 
        date: { $gte: new Date() },
        cancelled: { $ne: true }
      },
      { 
        cancelled: true, 
        cancelledReason: `Event cancelled due to organizer ban: ${reason || "Policy violation"}` 
      }
    );

    res.status(200).json({ 
      message: "User banned successfully",
      user: {
        _id: userToBan._id,
        name: userToBan.name,
        email: userToBan.email,
        isBanned: userToBan.isBanned,
        bannedAt: userToBan.bannedAt,
        banReason: userToBan.banReason
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Unban a user (admin only)
// @route  PATCH /api/users/:id/unban
// @access Protected/Admin
export const unbanUser = async (req, res) => {
  try {
    const userToUnban = await User.findById(req.params.id);
    
    if (!userToUnban) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!userToUnban.isBanned) {
      return res.status(400).json({ message: "User is not banned" });
    }

    userToUnban.isBanned = false;
    userToUnban.bannedAt = null;
    userToUnban.bannedBy = null;
    userToUnban.banReason = null;

    await userToUnban.save();

    res.status(200).json({ 
      message: "User unbanned successfully",
      user: {
        _id: userToUnban._id,
        name: userToUnban.name,
        email: userToUnban.email,
        isBanned: userToUnban.isBanned
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Get organizer details with events and reports
// @route  GET /api/users/:id/organizer-details
// @access Protected/Admin
export const getOrganizerDetails = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);
    
    if (!organizer) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get organizer's events
    const Event = (await import("../models/Event.js")).default;
    const events = await Event.find({ organizerId: organizer._id })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    // Get reports on organizer's events
    const Report = (await import("../models/Report.js")).default;
    const eventIds = events.map(event => event._id);
    const reports = await Report.find({ eventId: { $in: eventIds } })
      .populate("eventId", "title")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalEvents = events.length;
    const activeEvents = events.filter(e => !e.cancelled && new Date(e.date) >= new Date()).length;
    const cancelledEvents = events.filter(e => e.cancelled).length;
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === "pending").length;

    res.json({
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        phone: organizer.phone,
        role: organizer.role,
        isVerified: organizer.isVerified,
        isBanned: organizer.isBanned,
        bannedAt: organizer.bannedAt,
        banReason: organizer.banReason,
        createdAt: organizer.createdAt,
        lastLogin: organizer.lastLogin
      },
      statistics: {
        totalEvents,
        activeEvents,
        cancelledEvents,
        totalReports,
        pendingReports
      },
      events: events.slice(0, 10), // Last 10 events
      reports: reports.slice(0, 20) // Last 20 reports
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Get comprehensive organizer details with all events and reports
// @route  GET /api/users/:id/full-details
// @access Protected/Admin
export const getFullOrganizerDetails = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);
    
    if (!organizer) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all organizer's events with full details
    const Event = (await import("../models/Event.js")).default;
    const events = await Event.find({ organizerId: organizer._id })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    // Get all reports on organizer's events with full details
    const Report = (await import("../models/Report.js")).default;
    const eventIds = events.map(event => event._id);
    const reports = await Report.find({ eventId: { $in: eventIds } })
      .populate("eventId", "title date venue")
      .populate("userId", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    // Get bookings statistics
    const Booking = (await import("../models/Booking.js")).default;
    const allBookings = await Booking.find({ 
      eventId: { $in: eventIds },
      status: { $ne: "cancelled" }
    });

    // Calculate comprehensive statistics
    const totalEvents = events.length;
    const activeEvents = events.filter(e => !e.cancelled && new Date(e.date) >= new Date()).length;
    const pastEvents = events.filter(e => !e.cancelled && new Date(e.date) < new Date()).length;
    const cancelledEvents = events.filter(e => e.cancelled).length;
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === "pending").length;
    const resolvedReports = reports.filter(r => r.status === "resolved").length;
    const dismissedReports = reports.filter(r => r.status === "dismissed").length;
    
    // Calculate revenue and attendance
    const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.totalAmount || booking.priceAtBooking || 0), 0);
    const totalAttendees = allBookings.reduce((sum, booking) => {
      // Use totalQuantity for new booking system or noOfSeats for legacy bookings
      const attendeeCount = booking.totalQuantity || booking.noOfSeats || 0;
      return sum + attendeeCount;
    }, 0);

    // Group reports by event for easy display
    const reportsByEvent = {};
    reports.forEach(report => {
      const eventId = report.eventId?._id?.toString();
      if (eventId) {
        if (!reportsByEvent[eventId]) {
          reportsByEvent[eventId] = [];
        }
        reportsByEvent[eventId].push(report);
      }
    });

    // Add report counts and attendee counts to events
    const eventsWithReports = events.map(event => {
      const eventReports = reportsByEvent[event._id.toString()] || [];
      
      // Calculate attendees for this specific event
      const eventBookings = allBookings.filter(booking => 
        booking.eventId.toString() === event._id.toString()
      );
      const attendeeCount = eventBookings.reduce((sum, booking) => {
        // Use totalQuantity for new booking system or noOfSeats for legacy bookings
        const attendeeCount = booking.totalQuantity || booking.noOfSeats || 0;
        return sum + attendeeCount;
      }, 0);

      // Calculate total seats for percentage calculation
      let totalSeats = 0;
      if (event.hasTicketCategories && event.ticketCategories) {
        totalSeats = event.ticketCategories.reduce(
          (sum, cat) => sum + cat.totalSeats,
          0
        );
      } else {
        totalSeats = event.totalSeats || 0;
      }
      
      return {
        ...event.toObject(),
        reportsCount: eventReports.length,
        reports: eventReports,
        attendeeCount: attendeeCount,
        totalBooked: attendeeCount,
        totalSeats: totalSeats
      };
    });

    res.json({
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        phone: organizer.phone,
        role: organizer.role,
        isVerified: organizer.isVerified,
        isBanned: organizer.isBanned,
        bannedAt: organizer.bannedAt,
        bannedBy: organizer.bannedBy,
        banReason: organizer.banReason,
        createdAt: organizer.createdAt,
        updatedAt: organizer.updatedAt,
        lastLogin: organizer.lastLogin
      },
      statistics: {
        totalEvents,
        activeEvents,
        pastEvents,
        cancelledEvents,
        totalReports,
        pendingReports,
        resolvedReports,
        dismissedReports,
        totalRevenue,
        totalAttendees,
        averageReportsPerEvent: totalEvents > 0 ? (totalReports / totalEvents).toFixed(2) : 0
      },
      events: eventsWithReports,
      allReports: reports,
      reportsByEvent
    });
  } catch (err) {
    console.error("Error fetching full organizer details:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
