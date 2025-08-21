import mongoose from "mongoose";

const ticketCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  totalSeats: { type: Number, required: true, min: 1 },
  description: { type: String, trim: true },
});

const customRefundPolicySchema = new mongoose.Schema({
  sevenDaysOrMore: { type: Number, min: 0, max: 100, default: 100 }, // Refund percentage
  oneToDays: { type: Number, min: 0, max: 100, default: 50 },
  lessThanDay: { type: Number, min: 0, max: 100, default: 0 },
  description: { type: String, trim: true }, // Custom description
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    date: { type: Date, required: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    city: { type: String, required: true, trim: true },
    venue: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      placeId: { type: String }, // Google Places ID for reference
    },
    // Legacy fields for backward compatibility
    price: { type: Number },
    totalSeats: { type: Number },
    // New ticket category system
    ticketCategories: {
      type: [ticketCategorySchema],
      validate: {
        validator: function (categories) {
          // Only validate if hasTicketCategories is true
          if (this.hasTicketCategories) {
            return categories.length >= 1 && categories.length <= 5;
          }
          // If not using ticket categories, allow empty array
          return true;
        },
        message: "Event must have between 1 and 5 ticket categories",
      },
    },
    hasTicketCategories: { type: Boolean, default: false },
    // Refund policy settings
    useDefaultRefundPolicy: { type: Boolean, default: true },
    customRefundPolicy: {
      type: customRefundPolicySchema,
      default: null,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photo: { type: String },
    cancelled: { type: Boolean, default: false },
    cancelledReason: { type: String },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
