import mongoose from "mongoose";

const venueOptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["amenity", "eventType", "policyItem"],
      required: [true, "Option type is required"],
      index: true,
    },
    value: {
      type: String,
      required: [true, "Value is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    label: {
      type: String,
      required: [true, "Label is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
venueOptionSchema.index({ type: 1, isActive: 1 });

const VenueOption = mongoose.model("VenueOption", venueOptionSchema);

export default VenueOption;
