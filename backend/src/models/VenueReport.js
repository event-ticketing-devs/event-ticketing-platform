import mongoose from "mongoose";

const venueReportSchema = new mongoose.Schema(
  {
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "inappropriate_content",
        "spam",
        "scam_or_fraud",
        "misleading_information",
        "offensive_language",
        "false_information",
        "safety_concerns",
        "other"
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate reports from same user for same venue
venueReportSchema.index({ venueId: 1, userId: 1 }, { unique: true });

export default mongoose.model("VenueReport", venueReportSchema);
