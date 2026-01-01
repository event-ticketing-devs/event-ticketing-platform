import VenueReport from "../models/VenueReport.js";
import Venue from "../models/Venue.js";

// @desc    Create a report for a venue
// @route   POST /api/venue-reports
// @access  Private (authenticated users)
export const createVenueReport = async (req, res) => {
  try {
    const { venueId, reason, description } = req.body;
    const userId = req.user._id;

    // Check if venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Check if user has already reported this venue
    const existingReport = await VenueReport.findOne({ venueId, userId });
    if (existingReport) {
      return res.status(400).json({ message: "You have already reported this venue" });
    }

    // Create the report
    const report = new VenueReport({
      venueId,
      userId,
      reason,
      description,
    });

    await report.save();

    // Increment report count on the venue
    await Venue.findByIdAndUpdate(venueId, { $inc: { reportCount: 1 } });

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

// @desc    Get all venue reports (admin only)
// @route   GET /api/venue-reports
// @access  Admin Only
export const getAllVenueReports = async (req, res) => {
  try {
    const { status, sortBy = "createdAt", order = "desc" } = req.query;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const reports = await VenueReport.find(filter)
      .populate("venueId", "name city fullAddress owner reportCount verificationStatus")
      .populate("userId", "name email")
      .populate("reviewedBy", "name email")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .exec();

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get venues sorted by report count (admin only)
// @route   GET /api/venue-reports/venues/flagged
// @access  Admin Only
export const getFlaggedVenues = async (req, res) => {
  try {
    const venues = await Venue.find({ reportCount: { $gt: 0 } })
      .populate("owner", "name email phone role isVerified isBanned")
      .sort({ reportCount: -1 })
      .exec();

    // Get reports for each venue
    const venuesWithReports = await Promise.all(
      venues.map(async (venue) => {
        const reports = await VenueReport.find({ venueId: venue._id })
          .populate("userId", "name email")
          .sort({ createdAt: -1 });
        
        return {
          ...venue.toObject(),
          reports,
        };
      })
    );

    res.json(venuesWithReports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update venue report status (admin only)
// @route   PATCH /api/venue-reports/:id
// @access  Admin Only
export const updateVenueReportStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const reportId = req.params.id;

    const report = await VenueReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Update report
    report.status = status;
    report.adminNotes = adminNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    const updatedReport = await VenueReport.findById(reportId)
      .populate("venueId", "name city")
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

// @desc    Get user's venue reports
// @route   GET /api/venue-reports/my-reports
// @access  Private
export const getUserVenueReports = async (req, res) => {
  try {
    const userId = req.user._id;

    const reports = await VenueReport.find({ userId })
      .populate("venueId", "name city fullAddress")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
