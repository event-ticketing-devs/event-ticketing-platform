import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue is required"],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    reviewText: {
      type: String,
      trim: true,
      maxlength: [500, "Review text cannot exceed 500 characters"],
    },
    ownerResponse: {
      type: String,
      trim: true,
      maxlength: [300, "Response cannot exceed 300 characters"],
    },
    ownerRespondedAt: {
      type: Date,
    },
    isReported: {
      type: Boolean,
      default: false,
      index: true,
    },
    reportReason: {
      type: String,
      trim: true,
      maxlength: [500, "Report reason cannot exceed 500 characters"],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reportedAt: {
      type: Date,
    },
  },
  { 
    timestamps: true,
  }
);

// Compound index to ensure one review per user per venue
reviewSchema.index({ userId: 1, venueId: 1 }, { unique: true });

// Index for efficient venue review queries
reviewSchema.index({ venueId: 1, createdAt: -1 });

// Index for reported reviews
reviewSchema.index({ isReported: 1, reportedAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
