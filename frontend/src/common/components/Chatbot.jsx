import { useState, useRef, useEffect } from "react";
import chatbotService from "../../services/chatbotService";
import toast from "react-hot-toast";
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! 👋 I'm your event ticketing assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle sending message
  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      const response = await chatbotService.sendMessage(messageText.trim());

      const botMessage = {
        id: Date.now() + 1,
        text: response,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast.error(error.message || "Failed to get response");
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble responding right now. Please try again later or contact support.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle suggested question click
  const handleSuggestionClick = (question) => {
    handleSendMessage(question);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Reset chat
  const handleResetChat = () => {
    chatbotService.resetChat();
    setMessages([
      {
        id: 1,
        text: "Hi! 👋 I'm your event ticketing assistant. How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setShowSuggestions(true);
  };

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Chatbot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-primary text-bg-primary p-4 hover:bg-primary/90 transition-colors group shadow-lg cursor-pointer border border-primary/20"
          aria-label="Open chatbot"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-0 sm:bottom-6 right-0 sm:right-6 z-50 w-full sm:w-96 h-[100vh] sm:h-[600px] bg-bg-primary sm:rounded-lg flex flex-col overflow-hidden border-t sm:border border-border sm:shadow-xl">
          {/* Header */}
          <div className="bg-primary text-bg-primary p-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-bg-primary/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Event Assistant</h3>
                <p className="text-xs text-bg-primary/80">Always here to help!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetChat}
                className="p-2 hover:bg-white/20 transition-colors"
                aria-label="Reset chat"
                title="Reset chat"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 transition-colors"
                aria-label="Close chatbot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-secondary">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg ${
                    message.sender === "user"
                      ? "bg-primary text-bg-primary"
                      : "bg-bg-primary border border-border"
                  } px-4 py-3`}
                >
                  <p
                    className={`text-sm whitespace-pre-wrap ${
                      message.sender === "user" ? "text-bg-primary" : "text-text-primary"
                    }`}
                  >
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-bg-primary/70"
                        : "text-text-secondary"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-bg-primary border border-border rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {showSuggestions && messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-text-secondary font-medium px-2">
                  Suggested questions:
                </p>
                {chatbotService.getSuggestedQuestions().map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="w-full text-left px-4 py-2 text-sm bg-bg-primary hover:bg-bg-secondary border border-border rounded-lg transition-colors text-text-primary cursor-pointer"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-bg-primary border-t border-border rounded-b-lg">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                maxLength={100}
                className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="px-5 py-3 bg-primary text-bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-400">
                Powered by Gemini AI
              </p>
              {inputMessage.length > 0 && (
                <p className={`text-xs ${inputMessage.length > 90 ? 'text-warning' : 'text-text-secondary'}`}>
                  {inputMessage.length}/100
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
