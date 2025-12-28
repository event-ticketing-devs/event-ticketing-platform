import mongoose from "mongoose";

const venueQuoteSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VenueRequest",
      required: [true, "Venue request reference is required"],
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
    },
    quotedAmount: {
      type: Number,
      required: [true, "Quoted amount is required"],
      min: [0, "Quoted amount cannot be negative"],
    },
    terms: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Quote creator is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["sent"],
      default: "sent",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying quotes by request
venueQuoteSchema.index({ request: 1, createdAt: -1 });

const VenueQuote = mongoose.model("VenueQuote", venueQuoteSchema);

export default VenueQuote;
