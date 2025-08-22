import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['general', 'event'],
    required: true
  },
  // For event-specific contacts
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: function() {
      return this.type === 'event';
    }
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.type === 'event';
    }
  },
  // Contact status and admin notes
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contactMethod: {
    type: String,
    enum: ['email', 'phone', 'both'],
    default: null
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
contactSchema.index({ type: 1, status: 1 });
contactSchema.index({ eventId: 1 });
contactSchema.index({ organizerId: 1 });
contactSchema.index({ createdAt: -1 });

export default mongoose.model('Contact', contactSchema);
