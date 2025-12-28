import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { shutdownRedisClient } from "./redis/helper.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Event from "./models/Event.js";
import TeamChat from "./models/TeamChat.js";
import VenueRequest from "./models/VenueRequest.js";
import VenueInquiryChat from "./models/VenueInquiryChat.js";
import Venue from "./models/Venue.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    const httpServer = createServer(app);
    
    // Configure Socket.io
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      },
    });

    // Socket.io authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        
        if (!user) {
          return next(new Error("User not found"));
        }

        socket.user = user;
        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });

    // Socket.io connection handler
    io.on("connection", (socket) => {
      // Join event room
      socket.on("join-event-chat", async ({ eventId }) => {
        try {
          const event = await Event.findById(eventId);
          
          if (!event) {
            socket.emit("error", { message: "Event not found" });
            return;
          }

          // Check if user has access (organizer, co-organizer, or verifier)
          const userId = socket.user._id.toString();
          const isOrganizer = event.organizerId.toString() === userId;
          const isCoOrganizer = event.coOrganizers?.some(
            coOrgId => coOrgId.toString() === userId
          );
          const isVerifier = event.verifiers?.some(
            verifierId => verifierId.toString() === userId
          );

          if (!isOrganizer && !isCoOrganizer && !isVerifier) {
            socket.emit("error", { message: "Access denied" });
            return;
          }

          // Join the room
          socket.join(`event-chat-${eventId}`);
        } catch (error) {
          console.error("Error joining event chat:", error);
          socket.emit("error", { message: "Failed to join chat" });
        }
      });

      // Leave event room
      socket.on("leave-event-chat", async ({ eventId }) => {
        socket.leave(`event-chat-${eventId}`);
      });

      // Send message
      socket.on("send-message", async ({ eventId, message, messageType, fileUrl, fileName, fileSize }) => {
        try {
          const event = await Event.findById(eventId);
          
          if (!event) {
            socket.emit("error", { message: "Event not found" });
            return;
          }

          // Verify access
          const userId = socket.user._id.toString();
          const isOrganizer = event.organizerId.toString() === userId;
          const isCoOrganizer = event.coOrganizers?.some(
            coOrgId => coOrgId.toString() === userId
          );
          const isVerifier = event.verifiers?.some(
            verifierId => verifierId.toString() === userId
          );

          if (!isOrganizer && !isCoOrganizer && !isVerifier) {
            socket.emit("error", { message: "Access denied" });
            return;
          }

          // Create message
          const chatMessage = await TeamChat.create({
            eventId,
            senderId: socket.user._id,
            messageType: messageType || 'text',
            message: messageType === 'text' ? message : undefined,
            fileUrl: (messageType === 'file' || messageType === 'image') ? fileUrl : undefined,
            fileName: (messageType === 'file' || messageType === 'image') ? fileName : undefined,
            fileSize: (messageType === 'file' || messageType === 'image') ? fileSize : undefined,
          });

          const populatedMessage = await TeamChat.findById(chatMessage._id)
            .populate('senderId', 'name email');

          // Broadcast to all users in the room
          io.to(`event-chat-${eventId}`).emit("new-message", populatedMessage);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // Typing indicator
      socket.on("typing", ({ eventId, isTyping }) => {
        socket.to(`event-chat-${eventId}`).emit("user-typing", {
          userId: socket.user._id,
          userName: socket.user.name,
          isTyping,
        });
      });

      // --- Venue Enquiry Chat Handlers ---
      
      // Join venue request chat room
      socket.on("join-venue-chat", async ({ requestId }) => {
        try {
          console.log("User joining venue chat:", { requestId, userId: socket.user._id });
          
          const venueRequest = await VenueRequest.findById(requestId).populate("venue");
          
          if (!venueRequest) {
            console.error("Venue request not found:", requestId);
            socket.emit("error", { message: "Venue request not found" });
            return;
          }

          const venue = await Venue.findById(venueRequest.venue);
          const userId = socket.user._id.toString();
          const isOrganizer = venueRequest.organizer.toString() === userId;
          const isVenueOwner = venue.owner.toString() === userId;
          const isTeamMember = venue.teamMembers.some(
            (member) => member.toString() === userId
          );

          if (!isOrganizer && !isVenueOwner && !isTeamMember) {
            console.error("Access denied for user:", userId);
            socket.emit("error", { message: "Access denied" });
            return;
          }

          socket.join(`venue-chat-${requestId}`);
          console.log("User successfully joined venue-chat-" + requestId);
        } catch (error) {
          console.error("Error joining venue chat:", error);
          socket.emit("error", { message: "Failed to join chat" });
        }
      });

      // Leave venue request chat room
      socket.on("leave-venue-chat", async ({ requestId }) => {
        socket.leave(`venue-chat-${requestId}`);
      });

      // Send venue chat message
      socket.on("send-venue-message", async ({ requestId, message }) => {
        try {
          console.log("Received send-venue-message:", { requestId, message, userId: socket.user._id });
          
          if (!message || message.trim() === "") {
            socket.emit("error", { message: "Message cannot be empty" });
            return;
          }

          const venueRequest = await VenueRequest.findById(requestId).populate("venue");
          if (!venueRequest) {
            console.error("Venue request not found:", requestId);
            socket.emit("error", { message: "Venue request not found" });
            return;
          }

          const venue = await Venue.findById(venueRequest.venue);
          const userId = socket.user._id.toString();
          const isOrganizer = venueRequest.organizer.toString() === userId;
          const isVenueOwner = venue.owner.toString() === userId;
          const isTeamMember = venue.teamMembers.some(
            (member) => member.toString() === userId
          );

          if (!isOrganizer && !isVenueOwner && !isTeamMember) {
            console.error("Access denied for user:", userId);
            socket.emit("error", { message: "Access denied" });
            return;
          }

          // Find or create chat
          let chat = await VenueInquiryChat.findOne({ request: requestId });
          if (!chat) {
            chat = await VenueInquiryChat.create({ request: requestId });
          }

          // Add message to chat
          const newMessage = {
            sender: socket.user._id,
            text: message.trim(),
            createdAt: new Date()
          };

          chat.messages.push(newMessage);
          await chat.save();

          // Populate sender info
          await chat.populate("messages.sender", "name email");
          const addedMessage = chat.messages[chat.messages.length - 1];

          // Transform to match expected format
          const responseMessage = {
            _id: addedMessage._id,
            message: addedMessage.text,
            sender: addedMessage.sender,
            createdAt: addedMessage.createdAt
          };

          console.log("Broadcasting message to venue-chat-" + requestId, responseMessage);

          // Broadcast to all users in the room
          io.to(`venue-chat-${requestId}`).emit("new-venue-message", responseMessage);
        } catch (error) {
          console.error("Error sending venue message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // Venue chat typing indicator
      socket.on("venue-typing", ({ requestId, isTyping }) => {
        socket.to(`venue-chat-${requestId}`).emit("venue-user-typing", {
          userId: socket.user._id,
          userName: socket.user.name,
          isTyping,
        });
      });

      // Delete message
      socket.on("delete-message", async ({ eventId, messageId }) => {
        try {
          const event = await Event.findById(eventId);
          
          if (!event) {
            socket.emit("error", { message: "Event not found" });
            return;
          }

          // Verify user is the main organizer (only they can delete messages)
          const userId = socket.user._id.toString();
          const isMainOrganizer = event.organizerId.toString() === userId;

          if (!isMainOrganizer) {
            socket.emit("error", { message: "Access denied. Only the main event organizer can delete messages." });
            return;
          }

          // Broadcast deletion to all users in the room
          io.to(`event-chat-${eventId}`).emit("message-deleted", { messageId });
        } catch (error) {
          console.error("Error deleting message:", error);
          socket.emit("error", { message: "Failed to delete message" });
        }
      });

      // Disconnect
      socket.on("disconnect", () => {
        // Silent disconnect
      });
    });

    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    await shutdownRedisClient();
    console.log('Redis client closed');
  } catch (error) {
    console.error('Error closing Redis client:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  try {
    await shutdownRedisClient();
    console.log('Redis client closed');
  } catch (error) {
    console.error('Error closing Redis client:', error);
  }
  process.exit(0);
});
