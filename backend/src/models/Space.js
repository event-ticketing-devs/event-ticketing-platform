import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    start: {
      type: Date,
      required: [true, "Start date is required"],
    },
    end: {
      type: Date,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      enum: ["blocked", "booked"],
      required: [true, "Status is required"],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VenueRequest",
      required: false,
    },
  },
  { _id: true }
);

const spaceSchema = new mongoose.Schema(
  {
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue reference is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Space name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["hall", "lawn", "auditorium", "open-area"],
      required: [true, "Space type is required"],
    },
    indoorOutdoor: {
      type: String,
      enum: ["indoor", "outdoor", "both"],
      required: [true, "Indoor/Outdoor specification is required"],
    },
    maxPax: {
      type: Number,
      required: [true, "Maximum capacity is required"],
      min: [1, "Maximum capacity must be at least 1"],
    },
    areaSqFt: {
      type: Number,
      required: [true, "Area in square feet is required"],
      min: [1, "Area must be at least 1 sq ft"],
    },
    supportedEventTypes: {
      type: [String],
      default: [],
    },
    bookingUnit: {
      type: String,
      enum: ["hour", "half-day", "full-day"],
      required: [true, "Booking unit is required"],
    },
    amenities: {
      standard: {
        type: [String],
        default: [],
      },
      custom: {
        type: [String],
        default: [],
        validate: {
          validator: function(arr) {
            return arr.every(item => !item.includes(','));
          },
          message: 'Custom amenities cannot contain commas'
        }
      }
    },
    policies: {
      allowedItems: {
        standard: {
          type: [String],
          default: [],
        },
        custom: {
          type: [String],
          default: [],
          validate: {
            validator: function(arr) {
              return arr.every(item => !item.includes(','));
            },
            message: 'Custom policy items cannot contain commas'
          }
        }
      },
      bannedItems: {
        standard: {
          type: [String],
          default: [],
        },
        custom: {
          type: [String],
          default: [],
          validate: {
            validator: function(arr) {
              return arr.every(item => !item.includes(','));
            },
            message: 'Custom policy items cannot contain commas'
          }
        }
      },
      additionalPolicy: {
        type: String,
        trim: true,
        default: ''
      }
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: function(arr) {
          return arr.length <= 5;
        },
        message: 'Maximum 5 photos allowed per space'
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active spaces by venue
spaceSchema.index({ venue: 1, isActive: 1 });

// Validate that end date is after start date in availability
availabilitySchema.pre("validate", function (next) {
  // Check if end date is before start date (same date is allowed)
  if (this.end < this.start) {
    next(new Error("End date cannot be before start date"));
  }
  // Check if dates are in the past
  else if (this.start < new Date().setHours(0, 0, 0, 0)) {
    next(new Error("Start date cannot be in the past"));
  }
  else {
    next();
  }
});

const Space = mongoose.model("Space", spaceSchema);

export default Space;
