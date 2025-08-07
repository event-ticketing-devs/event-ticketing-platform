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
      enum: ["none", "pending", "processed", "failed"],
      default: "none",
    },
    cancelledByEvent: { type: Boolean, default: false },
    cancelledByUser: { type: Boolean, default: false },
    cancellationDate: { type: Date },
    cancellationReason: { type: String },
    refundAmount: { type: Number },
    refundId: { type: String }, // Stripe refund ID
    ticketId: { type: String, unique: true, required: true },
    qrCode: { type: String, required: true }, // Base64 data URL of QR code
    verified: { type: Boolean, default: false },
    paymentIntentId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
