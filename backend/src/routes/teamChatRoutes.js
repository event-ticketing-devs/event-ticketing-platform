import express from "express";
import {
  getEventChatMessages,
  markMessagesAsRead,
  getUnreadCount,
  resetEventChat,
  deleteMessage,
} from "../controllers/teamChatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get chat messages for an event
router.get("/:eventId", protect, getEventChatMessages);

// Mark messages as read
router.post("/:eventId/read", protect, markMessagesAsRead);

// Get unread count
router.get("/:eventId/unread", protect, getUnreadCount);

// Reset chat (delete all messages) - Main organizer only
router.delete("/:eventId/reset", protect, resetEventChat);

// Delete a single message - Organizer/Co-Organizer only
router.delete("/:eventId/message/:messageId", protect, deleteMessage);

export default router;
