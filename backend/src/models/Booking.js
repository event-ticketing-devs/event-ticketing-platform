import mongoose from "mongoose";

const ticketItemSchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  pricePerTicket: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
});

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
    // Legacy fields for backward compatibility
    noOfSeats: { type: Number },
    priceAtBooking: { type: Number },
    // New ticket category system
    ticketItems: [ticketItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    totalQuantity: { type: Number, required: true, min: 1 },
    hasTicketCategories: { type: Boolean, default: false },
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
