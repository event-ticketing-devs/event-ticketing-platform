import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import ConfirmModal from './ConfirmModal';

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

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
    
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
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="flex flex-col h-[750px] bg-white rounded-2xl shadow-lg border border-slate-200">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-4 rounded-t-2xl flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">{eventTitle}</h3>
          <p className="text-blue-100 text-sm">Team Chat</p>
        </div>
        {isMainOrganizer && (
          <button
            onClick={() => setShowResetModal(true)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            aria-label="Reset chat"
            title="Reset chat (delete all messages)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-slate-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-slate-500 font-medium">No messages yet</p>
            <p className="text-slate-400 text-sm">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-slate-200">
                  <span className="text-xs font-medium text-slate-600">{date}</span>
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message) => {
                const isOwnMessage = message.senderId?._id === currentUser._id;
                const isSystemMessage = message.messageType === 'system';

                if (isSystemMessage) {
                  return (
                    <div key={message._id} className="flex justify-center my-2">
                      <div className="bg-slate-200 px-4 py-1 rounded-full">
                        <p className="text-xs text-slate-600">{message.message}</p>
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
                        <p className="text-xs text-slate-600 font-medium mb-1 px-1">
                          {message.senderId?.name}
                        </p>
                      )}
                      <div className="relative">
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white'
                              : 'bg-white border border-slate-200 text-slate-800'
                          }`}
                        >
                          {message.messageType === 'text' && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.message}
                            </p>
                          )}

                          <p
                            className={`text-xs mt-2 ${
                              isOwnMessage ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>

                          {/* Arrow Button - Inside message, top-right corner */}
                          {isMainOrganizer && expandedMessageId !== message._id && (
                            <button
                              onClick={() => setExpandedMessageId(message._id)}
                              className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${
                                isOwnMessage
                                  ? 'hover:bg-white/20 text-white'
                                  : 'hover:bg-slate-100 text-slate-600'
                              } opacity-0 group-hover:opacity-100`}
                              title="Show options"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
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
                            className="absolute top-2 right-2 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-lg transition-all opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white whitespace-nowrap z-10 transform translate-x-1/2"
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
          <div className="flex items-center gap-2 text-sm text-slate-600 px-4">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></span>
              <span
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.4s' }}
              ></span>
            </div>
            <span>{typingUsers.join(', ')} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 rounded-b-2xl">
        <div className="flex items-end gap-2">
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
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
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
