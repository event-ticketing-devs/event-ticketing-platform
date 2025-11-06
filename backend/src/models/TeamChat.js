import mongoose from "mongoose";

const teamChatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return this.messageType !== 'system';
      },
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'system'],
      default: 'text',
    },
    message: {
      type: String,
      required: function() {
        return this.messageType === 'text' || this.messageType === 'system';
      },
      trim: true,
      maxlength: 2000,
    },
    fileUrl: {
      type: String,
      required: function() {
        return this.messageType === 'file' || this.messageType === 'image';
      },
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for efficient querying
teamChatSchema.index({ eventId: 1, createdAt: -1 });

export default mongoose.model("TeamChat", teamChatSchema);
