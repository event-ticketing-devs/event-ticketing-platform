import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message sender is required"],
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      maxlength: 2000,
    },
    attachments: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const venueInquiryChatSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VenueRequest",
      required: [true, "Venue request reference is required"],
      unique: true,
      index: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const VenueInquiryChat = mongoose.model("VenueInquiryChat", venueInquiryChatSchema);

export default VenueInquiryChat;
