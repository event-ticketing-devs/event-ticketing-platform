import TeamChat from "../models/TeamChat.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

// @desc    Get chat messages for an event
// @route   GET /api/team-chat/:eventId
// @access  Organizer/Co-Organizer/Verifier
export const getEventChatMessages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user has access (organizer, co-organizer, or verifier)
    const userId = req.user._id.toString();
    const isOrganizer = event.organizerId.toString() === userId;
    const isCoOrganizer = event.coOrganizers?.some(
      coOrgId => coOrgId.toString() === userId
    );
    const isVerifier = event.verifiers?.some(
      verifierId => verifierId.toString() === userId
    );

    if (!isOrganizer && !isCoOrganizer && !isVerifier) {
      return res.status(403).json({ message: "Access denied. Only team members can view this chat." });
    }

    // Fetch messages with pagination
    const skip = (page - 1) * limit;
    
    const messages = await TeamChat.find({ eventId })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalMessages = await TeamChat.countDocuments({ eventId });

    return res.status(200).json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: skip + messages.length < totalMessages,
      },
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
      },
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark messages as read
// @route   POST /api/team-chat/:eventId/read
// @access  Organizer/Co-Organizer/Verifier
export const markMessagesAsRead = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: "Message IDs are required" });
    }

    const userId = req.user._id;

    // Update messages to mark as read
    await TeamChat.updateMany(
      {
        _id: { $in: messageIds },
        eventId,
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );

    return res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get unread message count
// @route   GET /api/team-chat/:eventId/unread
// @access  Organizer/Co-Organizer/Verifier
export const getUnreadCount = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const unreadCount = await TeamChat.countDocuments({
      eventId,
      senderId: { $ne: userId },
      'readBy.userId': { $ne: userId }
    });

    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Reset chat (delete all messages) - Organizer only
// @route   DELETE /api/team-chat/:eventId/reset
// @access  Main Organizer only
export const resetEventChat = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is the main organizer (only they can reset)
    const userId = req.user._id.toString();
    const isMainOrganizer = event.organizerId.toString() === userId;

    if (!isMainOrganizer) {
      return res.status(403).json({ 
        message: "Access denied. Only the main event organizer can reset the chat." 
      });
    }

    // Delete all chat messages for this event
    const result = await TeamChat.deleteMany({ eventId });

    return res.status(200).json({ 
      message: "Chat reset successfully",
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error("Error resetting chat:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a single chat message
// @route   DELETE /api/team-chat/:eventId/message/:messageId
// @access  Organizer/Co-Organizer
export const deleteMessage = async (req, res) => {
  try {
    const { eventId, messageId } = req.params;
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is the main organizer (only they can delete messages)
    const userId = req.user._id.toString();
    const isMainOrganizer = event.organizerId.toString() === userId;

    if (!isMainOrganizer) {
      return res.status(403).json({ 
        message: "Access denied. Only the main event organizer can delete messages." 
      });
    }

    // Find and delete the message
    const message = await TeamChat.findOne({ _id: messageId, eventId });
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await TeamChat.findByIdAndDelete(messageId);

    return res.status(200).json({ 
      message: "Message deleted successfully",
      messageId 
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default {
  getEventChatMessages,
  markMessagesAsRead,
  getUnreadCount,
  resetEventChat,
  deleteMessage,
};
