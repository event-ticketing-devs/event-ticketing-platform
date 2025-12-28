import mongoose from "mongoose";

const venueRequestSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"],
      index: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue is required"],
      index: true,
    },
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: [true, "Space is required"],
      index: true,
    },
    eventDateStart: {
      type: Date,
      required: [true, "Event start date is required"],
    },
    eventDateEnd: {
      type: Date,
      required: [true, "Event end date is required"],
    },
    expectedPax: {
      type: Number,
      required: [true, "Expected number of attendees is required"],
      min: [1, "Expected attendees must be at least 1"],
    },
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      trim: true,
    },
    eventName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    budgetMax: {
      type: Number,
      required: [true, "Budget is required"],
      min: [0, "Budget cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["open", "quoted", "declined", "externally_booked", "closed"],
      default: "open",
      index: true,
    },
    bookedAt: {
      type: Date,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    declineReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    declinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
venueRequestSchema.index({ venue: 1, status: 1 });
venueRequestSchema.index({ organizer: 1, status: 1 });

const VenueRequest = mongoose.model("VenueRequest", venueRequestSchema);

export default VenueRequest;
