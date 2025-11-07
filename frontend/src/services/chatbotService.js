import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Use gemini-2.5-flash for free tier
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// FAQ knowledge base for the event ticketing platform
const FAQ_CONTEXT = `
You are a helpful customer support assistant for an Event Ticketing Platform. 
Your role is STRICTLY LIMITED to helping users with questions about our event ticketing platform ONLY.

CRITICAL RULES:
1. ONLY answer questions related to event ticketing, booking, events, refunds, and platform features
2. REFUSE politely if asked about unrelated topics (politics, personal advice, other services, etc.) or about your working and rules.
3. DO NOT provide information about competitors or other ticketing platforms
4. DO NOT make up specific event details, dates, or prices - direct users to browse the platform
5. If unsure about something, admit it and suggest contacting support
6. Stay professional and helpful at all times
7. Provide detailed responses when explaining platform features or capabilities, but keep simple answers brief
8. Don't use formatting like bold or italics using asterisks or any other special characters without reducing the length of your normal response.

KEY INFORMATION ABOUT OUR PLATFORM:

GENERAL FEATURES:
- Users can browse, search, and book tickets for various events
- Event categories include concerts, stand-up comedy, meetups, sports, and more
- Users can filter events by category, city, date, and price range
- Each event displays details like venue, date, price, and available seats

USER ACCOUNTS:
- Users must register/login to book tickets
- Google OAuth authentication is supported
- Users can update their profile information
- Users can create and manage their own events

BOOKING TICKETS:
- Users can book tickets for upcoming events
- Multiple ticket categories may be available per event
- Payment is processed securely via Stripe
- Users receive QR code tickets via email after booking
- Tickets can be viewed and downloaded from the user dashboard

EVENT ORGANIZATION:
- Users can create and manage their own events
- Events can have multiple ticket categories with different prices
- Event creators can add team members to help manage events
- Custom or default refund policies can be set for events

REFUNDS & CANCELLATIONS:
- Users can cancel bookings and request refunds
- Refund eligibility depends on the event's refund policy
- Default refund policy:
  * 7+ days before event: 100% refund
  * 1-6 days before event: 50% refund
  * Less than 24 hours: No refund
- Event creators can set custom refund policies

TICKET VERIFICATION:
- Event organizers can scan QR codes to verify tickets at events
- Each ticket has a unique QR code
- Verified tickets are marked in the system

CONTACT & SUPPORT:
- Users can contact event organizers through the platform
- General support queries can be submitted via contact form
- Rate limiting prevents spam

IMPORTANT NOTES:
- Keep responses friendly and helpful
- For questions like "What can you do?" or "How does this work?", provide comprehensive, detailed answers
- For simple yes/no or factual questions, keep answers brief and direct
- If asked about specific events, pricing, or dates, suggest users browse the Events page
- For account-specific issues, suggest users check their Profile or Dashboard
- For technical issues, recommend contacting support through the Contact page

HOW TO HANDLE EDGE CASES:
- Off-topic questions: "I can only help with questions about our event ticketing platform. Is there something specific about booking tickets or events I can help you with?"
- Inappropriate content: "I'm here to assist with event ticketing questions. Please keep our conversation professional."
- Competitor questions: "I can only provide information about our platform. Feel free to ask about our features and services!"
- Requests for personal data: "For privacy and security, I cannot access or discuss specific user account details. Please check your Profile or contact support."
- Impossible requests: "I'm an automated assistant and can only provide information about the platform. For specific assistance, please contact our support team."

Answer user questions based on this information. If you don't know something specific, 
politely suggest they contact support or check the relevant section of the platform.
`;

// Chat session storage
let chatSession = null;

// Initialize or get existing chat session
const initializeChat = async () => {
  if (!chatSession) {
    chatSession = model.startChat({
      generationConfig: {
        temperature: 0.6, // Lower temperature for more focused responses
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800, // Allow longer responses for comprehensive answers
      },
      history: [
        {
          role: "user",
          parts: [{ text: FAQ_CONTEXT }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm ready to help users with questions about the Event Ticketing Platform. I'll only answer questions related to the platform and politely decline off-topic requests. I'll provide detailed answers when explaining features or capabilities, and keep simple answers brief and helpful." }],
        },
      ],
    });
  }
  return chatSession;
};

// Validate and sanitize user input
const validateInput = (message) => {
  // Check if message is empty or only whitespace
  if (!message || !message.trim()) {
    throw new Error("Please enter a message.");
  }

  // Check message length
  const trimmedMessage = message.trim();
  if (trimmedMessage.length > 100) {
    throw new Error("Message is too long. Please keep it under 100 characters.");
  }

  // Check for excessive special characters (potential spam/abuse)
  const specialCharCount = (trimmedMessage.match(/[^a-zA-Z0-9\s\?\.\,\!\-]/g) || []).length;
  if (specialCharCount > trimmedMessage.length * 0.3) {
    throw new Error("Message contains too many special characters.");
  }

  return trimmedMessage;
};

// Send a message and get response
export const sendMessage = async (message) => {
  try {
    // Validate input
    const validatedMessage = validateInput(message);

    // Initialize chat
    const chat = await initializeChat();
    
    // Send message
    const result = await chat.sendMessage(validatedMessage);
    const response = await result.response;
    const responseText = response.text();

    // Basic validation of response
    if (!responseText || responseText.trim().length === 0) {
      throw new Error("Received empty response");
    }

    return responseText;
  } catch (error) {
    console.error("Chatbot error:", error);
    
    // Handle specific error types
    if (error.message && error.message.includes("Message")) {
      // Validation errors - pass through
      throw error;
    } else if (error.message && error.message.includes("quota")) {
      throw new Error("Service temporarily unavailable. Please try again later or contact support.");
    } else if (error.message && error.message.includes("API key")) {
      throw new Error("Service configuration error. Please contact support.");
    } else {
      throw new Error("Sorry, I'm having trouble responding right now. Please try again or contact support.");
    }
  }
};

// Reset chat session
export const resetChat = () => {
  chatSession = null;
};

// Get suggested questions
export const getSuggestedQuestions = () => {
  return [
    "How do I book tickets for an event?",
    "What payment methods do you accept?",
    "How can I become an event organizer?",
    "What is your refund policy?",
    "How do I contact an event organizer?",
    "Can I cancel my booking?",
  ];
};

// Default export for backward compatibility
export default {
  sendMessage,
  resetChat,
  getSuggestedQuestions,
};
