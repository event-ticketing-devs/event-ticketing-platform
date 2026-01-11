import mongoose from "mongoose";

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Venue name is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      index: true,
    },
    fullAddress: {
      type: String,
      required: [true, "Full address is required"],
      trim: true,
    },
    location: {
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      placeId: { type: String }, // Google Places ID for reference
    },
    parking: {
      available: {
        type: Boolean,
        default: false,
      },
      notes: {
        type: String,
        trim: true,
        maxlength: 200,
      },
    },
    primaryContact: {
      name: {
        type: String,
        required: [true, "Primary contact name is required"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Primary contact phone is required"],
        trim: true,
        match: [/^\d{10}$/, "Phone number must be 10 digits"],
      },
      email: {
        type: String,
        required: [true, "Primary contact email is required"],
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, "Please enter a valid email"],
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Venue owner is required"],
      index: true,
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    verificationStatus: {
      type: String,
      enum: ["unverified", "verified", "suspended"],
      default: "unverified",
      index: true,
    },
    isListed: {
      type: Boolean,
      default: true,
      index: true,
    },
    suspendedAt: {
      type: Date,
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    suspensionReason: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    // Ownership verification document fields
    ownershipDocument: {
      url: {
        type: String,
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
      },
      fileName: {
        type: String,
        trim: true,
      },
    },
    documentType: {
      type: String,
      enum: ["pdf", "doc", "docx", "jpg", "jpeg", "png", ""],
      default: "",
    },
    documentUploadedAt: {
      type: Date,
    },
    documentVerificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected", ""],
      default: "",
      index: true,
    },
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    documentVerifiedAt: {
      type: Date,
    },
    documentVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying verified venues by city
venueSchema.index({ city: 1, verificationStatus: 1 });

const Venue = mongoose.model("Venue", venueSchema);

export default Venue;
