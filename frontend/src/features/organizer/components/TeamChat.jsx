import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../api/apiClient';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import ConfirmModal from '../../../common/components/ConfirmModal';
import { Send, MessageCircle, RotateCcw, ChevronDown } from 'lucide-react';

export default function TeamChat({ eventId, eventTitle }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMainOrganizer, setIsMainOrganizer] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isOrganizerOrCoOrganizer, setIsOrganizerOrCoOrganizer] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const shouldScrollRef = useRef(false);

  // Get token from localStorage
  const getToken = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const { token } = JSON.parse(storedUser);
      return token;
    }
    return null;
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll effect - only when user sends a message
  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom();
      shouldScrollRef.current = false;
    }
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    const token = getToken();
    
    if (!eventId || !token) return;

    // Empty string means use same origin (works with Nginx proxy in production)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
    
    const newSocket = io(socketUrl, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-event-chat', { eventId });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to chat server');
    });

    newSocket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('user-typing', ({ userId, userName, isTyping }) => {
      if (userId !== currentUser._id) {
        setTypingUsers((prev) => {
          if (isTyping) {
            return prev.includes(userName) ? prev : [...prev, userName];
          } else {
            return prev.filter((name) => name !== userName);
          }
        });
      }
    });

    newSocket.on('message-deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Socket error');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave-event-chat', { eventId });
        newSocket.disconnect();
      }
    };
  }, [eventId, currentUser._id]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/team-chat/${eventId}`);
        setMessages(response.data.messages);
        setIsInitialLoad(false); // Mark initial load as complete
        
        // Fetch event details to check permissions
        const eventResponse = await apiClient.get(`/events/${eventId}`);
        const event = eventResponse.data;
        
        const organizerId = event.organizerId?._id || event.organizerId;
        const coOrganizerIds = event.coOrganizers?.map(co => co._id || co) || [];
        
        const isOrg = organizerId === currentUser._id;
        const isCoOrg = coOrganizerIds.includes(currentUser._id);
        
        setIsMainOrganizer(isOrg);
        setIsOrganizerOrCoOrganizer(isOrg || isCoOrg);
        
        // Scroll to bottom on initial load
        setTimeout(() => scrollToBottom(), 100);
      } catch (error) {
        toast.error('Failed to load messages');
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchMessages();
    }
  }, [eventId, currentUser._id]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing', { eventId, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { eventId, isTyping: false });
    }, 1000);
  };

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      setSending(true);

      // Send text message
      if (socket && socket.connected) {
        socket.emit('send-message', {
          eventId,
          message: newMessage.trim(),
          messageType: 'text',
        });
        setNewMessage('');
        shouldScrollRef.current = true; // Scroll after sending message
      } else {
        toast.error('Not connected to chat. Please refresh the page.');
      }
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle reset chat
  const handleResetChat = async () => {
    try {
      await apiClient.delete(`/team-chat/${eventId}/reset`);
      setMessages([]);
      setShowResetModal(false);
      toast.success('Chat reset successfully');
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Only the main event organizer can reset the chat');
      } else {
        toast.error('Failed to reset chat');
      }
      console.error('Error resetting chat:', error);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      await apiClient.delete(`/team-chat/${eventId}/message/${messageToDelete}`);
      
      // Emit socket event for real-time deletion
      if (socket) {
        socket.emit('delete-message', { eventId, messageId: messageToDelete });
      }
      
      setShowDeleteModal(false);
      setMessageToDelete(null);
      toast.success('Message deleted successfully');
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Only the main event organizer can delete messages');
      } else {
        toast.error('Failed to delete message');
      }
      console.error('Error deleting message:', error);
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const grouped = {};
    messages.forEach((message) => {
      const date = formatDate(message.createdAt);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-t-transparent border-b-2 rounded-full border-primary animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading chat...</p>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="flex flex-col h-[750px] bg-bg-primary border border-border">
      {/* Chat Header */}
      <div className="bg-primary px-6 py-4 border-t-2 border-border flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-bg-primary">{eventTitle}</h3>
          <p className="text-bg-primary/80 text-sm">Team Chat</p>
        </div>
        {isMainOrganizer && (
          <button
            onClick={() => setShowResetModal(true)}
            className="p-2 hover:bg-bg-primary/20 border border-bg-primary/30 rounded-lg transition-colors text-bg-primary"
            aria-label="Reset chat"
            title="Reset chat (delete all messages)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-secondary">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-text-secondary/50 mx-auto mb-4" />
            <p className="text-text-primary font-medium">No messages yet</p>
            <p className="text-text-secondary text-sm">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-bg-primary px-4 py-1 border border-border rounded-md">
                  <span className="text-xs font-medium text-text-secondary">{date}</span>
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message) => {
                const isOwnMessage = message.senderId?._id === currentUser._id;
                const isSystemMessage = message.messageType === 'system';

                if (isSystemMessage) {
                  return (
                    <div key={message._id} className="flex justify-center my-2">
                      <div className="bg-secondary/10 px-4 py-1 border border-secondary/30 rounded-md">
                        <p className="text-xs text-text-secondary">{message.message}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
                    onMouseLeave={() => setExpandedMessageId(null)}
                  >
                    <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && (
                        <p className="text-xs text-text-secondary font-medium mb-1 px-1">
                          {message.senderId?.name}
                        </p>
                      )}
                      <div className="relative">
                        <div
                          className={`px-4 py-3 relative rounded-lg ${
                            isOwnMessage
                              ? 'bg-primary text-bg-primary border-2 border-primary'
                              : 'bg-bg-primary border-2 border-border text-text-primary'
                          }`}
                        >
                          {/* Message tail/arrow at bottom */}
                          <div
                            className={`absolute bottom-0 w-0 h-0 ${
                              isOwnMessage
                                ? 'right-0 translate-x-full border-l-[12px] border-l-primary border-b-[12px] border-b-transparent'
                                : 'left-0 -translate-x-full border-r-[12px] border-r-border border-b-[12px] border-b-transparent'
                            }`}
                          ></div>
                          {message.messageType === 'text' && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.message}
                            </p>
                          )}

                          <p
                            className={`text-xs mt-2 ${
                              isOwnMessage ? 'text-bg-primary/80' : 'text-text-secondary'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>

                          {/* Arrow Button - Inside message, top-right corner */}
                          {isMainOrganizer && expandedMessageId !== message._id && (
                            <button
                              onClick={() => setExpandedMessageId(message._id)}
                              className={`absolute top-2 right-2 p-1.5 border rounded-md transition-colors ${
                                isOwnMessage
                                  ? 'border-bg-primary/30 hover:bg-bg-primary/20 text-bg-primary'
                                  : 'border-border hover:bg-bg-secondary text-text-secondary'
                              } opacity-0 group-hover:opacity-100`}
                              title="Show options"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Delete Button - Half inside, half outside message */}
                        {isMainOrganizer && expandedMessageId === message._id && (
                          <button
                            onClick={() => {
                              setMessageToDelete(message._id);
                              setShowDeleteModal(true);
                              setExpandedMessageId(null);
                            }}
                            className="absolute top-2 right-2 px-3 py-1.5 text-xs font-semibold border border-error rounded-md transition-all opacity-0 group-hover:opacity-100 bg-error hover:bg-error/90 text-bg-primary whitespace-nowrap z-10 transform translate-x-1/2"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-text-secondary px-4">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-secondary border border-border rounded-full animate-bounce"></span>
              <span
                className="w-2 h-2 bg-secondary border border-border rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></span>
              <span
                className="w-2 h-2 bg-secondary border border-border rounded-full animate-bounce"
                style={{ animationDelay: '0.4s' }}
              ></span>
            </div>
            <span>{typingUsers.join(', ')} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-bg-primary border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:bg-bg-secondary"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="h-[50px] px-4 sm:px-6 bg-primary text-bg-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </form>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        open={showResetModal}
        title="Reset Team Chat"
        description="Are you sure you want to delete all chat messages? This action cannot be undone."
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetChat}
        confirmText="Delete All Messages"
        variant="danger"
      />

      {/* Delete Message Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
        onClose={() => {
          setShowDeleteModal(false);
          setMessageToDelete(null);
        }}
        onConfirm={handleDeleteMessage}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
