import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import apiClient from "../../../api/apiClient";
import toast from "react-hot-toast";
import { MessageCircle } from "lucide-react";

export default function VenueEnquiryChat({ requestId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserId = JSON.parse(localStorage.getItem("user"))?._id;

  // Get token from localStorage
  const getToken = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const { token } = JSON.parse(storedUser);
      return token;
    }
    return localStorage.getItem("token");
  };

  useEffect(() => {
    fetchMessages();

    // Initialize socket connection
    const token = getToken();
    
    if (!requestId || !token) {
      console.error("Missing requestId or token");
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";
    
    const socket = io(socketUrl, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Venue chat socket connected");
      // Join venue chat room
      socket.emit("join-venue-chat", { requestId });
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Failed to connect to chat server");
    });

    socket.on("disconnect", () => {
      console.log("Venue chat socket disconnected");
    });

    // Listen for new messages
    socket.on("new-venue-message", (message) => {
      console.log("Received new venue message:", message);
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicator
    socket.on("venue-user-typing", ({ userId, userName, isTyping }) => {
      if (userId !== currentUserId) {
        setTypingUser(isTyping ? userName : null);
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error(error.message || "Socket connection error");
    });

    // Cleanup on unmount
    return () => {
      socket.emit("leave-venue-chat", { requestId });
      socket.disconnect();
    };
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/venue-requests/${requestId}/messages`);
      setMessages(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit("venue-typing", { requestId, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("venue-typing", { requestId, isTyping: false });
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      return toast.error("Message cannot be empty");
    }

    // Check socket connection
    if (!socketRef.current || !socketRef.current.connected) {
      toast.error("Not connected to chat. Please refresh the page.");
      return;
    }

    setSending(true);
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    socketRef.current.emit("venue-typing", { requestId, isTyping: false });

    try {
      // Send via socket.io for real-time delivery
      socketRef.current.emit("send-venue-message", {
        requestId,
        message: newMessage.trim(),
      });
      
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (loading) {
    return (
      <div className="bg-bg-primary border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Chat</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-text-secondary">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Chat</h2>

      {/* Messages Container */}
      <div className="border border-border rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-bg-secondary">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-text-secondary/50 mb-3" />
            <p className="text-text-primary">No messages yet</p>
            <p className="text-sm text-text-secondary mt-1">
              Start a conversation to discuss venue details
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isCurrentUser = msg.sender._id === currentUserId;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      isCurrentUser
                        ? "bg-primary text-bg-primary"
                        : "bg-bg-primary border border-border text-text-primary"
                    } rounded-lg px-4 py-2 shadow-sm`}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs font-semibold mb-1 text-text-secondary">
                        {msg.sender.name}
                      </p>
                    )}
                    <p className="text-sm break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser ? "text-bg-primary/80" : "text-text-secondary"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Typing Indicator */}
        {typingUser && (
          <div className="text-sm text-text-secondary italic mt-2">
            {typingUser} is typing...
          </div>
        )}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-primary text-bg-primary px-4 sm:px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed flex-shrink-0"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
