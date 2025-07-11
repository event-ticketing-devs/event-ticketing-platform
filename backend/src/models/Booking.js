import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    noOfSeats: { type: Number, required: true },
    priceAtBooking: { type: Number, required: true },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "processed"],
      default: "none",
    },
    cancelledByEvent: { type: Boolean, default: false },
    ticketCode: { type: String, unique: true, required: true },
    verified: { type: Boolean, default: false },
    paymentIntentId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
