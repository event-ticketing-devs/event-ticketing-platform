import mongoose from "mongoose";

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
    price: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photo: { type: String },
    cancelled: { type: Boolean, default: false },
    cancelledReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
