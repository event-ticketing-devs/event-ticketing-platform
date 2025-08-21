import Report from "../models/Report.js";
import Event from "../models/Event.js";

// @desc    Create a report for an event
// @route   POST /api/reports
// @access  Private (authenticated users)
export const createReport = async (req, res) => {
  try {
    const { eventId, reason, description } = req.body;
    const userId = req.user._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user has already reported this event
    const existingReport = await Report.findOne({ eventId, userId });
    if (existingReport) {
      return res.status(400).json({ message: "You have already reported this event" });
    }

    // Create the report
    const report = new Report({
      eventId,
      userId,
      reason,
      description,
    });

    await report.save();

    // Increment report count on the event
    await Event.findByIdAndUpdate(eventId, { $inc: { reportCount: 1 } });

    res.status(201).json({
      message: "Report submitted successfully",
      report: {
        _id: report._id,
        reason: report.reason,
        description: report.description,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reports (admin only)
// @route   GET /api/reports
// @access  Admin Only
export const getAllReports = async (req, res) => {
  try {
    const { status, sortBy = "createdAt", order = "desc" } = req.query;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate("eventId", "title date city venue organizerId reportCount")
      .populate("userId", "name email")
      .populate("reviewedBy", "name email")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .exec();

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get events sorted by report count (admin only)
// @route   GET /api/reports/events/flagged
// @access  Admin Only
export const getFlaggedEvents = async (req, res) => {
  try {
    const events = await Event.find({ reportCount: { $gt: 0 } })
      .populate("categoryId", "name")
      .populate("organizerId", "name email phone role isVerified isBanned")
      .sort({ reportCount: -1 })
      .exec();

    // Get reports for each event
    const eventsWithReports = await Promise.all(
      events.map(async (event) => {
        const reports = await Report.find({ eventId: event._id })
          .populate("userId", "name email")
          .sort({ createdAt: -1 });
        
        return {
          ...event.toObject(),
          reports,
        };
      })
    );

    res.json(eventsWithReports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update report status (admin only)
// @route   PATCH /api/reports/:id
// @access  Admin Only
export const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const reportId = req.params.id;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Update report
    report.status = status;
    report.adminNotes = adminNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    const updatedReport = await Report.findById(reportId)
      .populate("eventId", "title")
      .populate("userId", "name email")
      .populate("reviewedBy", "name email");

    res.json({
      message: "Report updated successfully",
      report: updatedReport,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's reports
// @route   GET /api/reports/my-reports
// @access  Private
export const getUserReports = async (req, res) => {
  try {
    const userId = req.user._id;

    const reports = await Report.find({ userId })
      .populate("eventId", "title date city venue")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
