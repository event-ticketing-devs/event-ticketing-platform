# Event Ticketing Platform - Chatbot Integration

## Overview
This chatbot is powered by Google's Gemini AI (free tier - gemini-2.0-flash-exp model) and provides intelligent FAQ support to users across the platform. It includes built-in security restrictions, input validation, and edge case handling to ensure safe and on-topic responses.

## Features
- **AI-Powered Responses**: Uses Gemini 2.0 Flash Experimental model (free tier) for natural language understanding
- **FAQ Knowledge Base**: Pre-loaded with comprehensive platform information
- **Security & Validation**: Input validation, content restrictions, and edge case handling built-in
- **Suggested Questions**: Quick access to common queries
- **Chat History**: Maintains conversation context within session
- **Reset Functionality**: Clear chat and start fresh
- **Character Counter**: Real-time character count with 100 character limit
- **Responsive Design**: Consistent with platform's blue-teal gradient theme
- **Mobile-Friendly**: Works seamlessly on all devices

## Setup Instructions

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variable
Open `/frontend/.env` and replace the placeholder with your actual API key:

```env
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
```

### 3. Start the Development Server
```bash
cd frontend
npm run dev
```

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Chatbot.jsx              # Main chatbot UI component
│   ├── services/
│   │   └── chatbotService.js        # Gemini AI service & FAQ logic
│   └── pages/
│       └── Home.jsx                 # Integrated on home page
```

## Component Architecture

### `Chatbot.jsx`
- **Location**: `/src/components/Chatbot.jsx`
- **Purpose**: UI component with floating button and chat window
- **Features**:
  - Floating chat button (bottom-right)
  - Expandable chat window
  - Message history
  - Typing indicator
  - Suggested questions
  - Reset chat functionality

### `chatbotService.js`
- **Location**: `/src/services/chatbotService.js`
- **Purpose**: Handles Gemini AI integration and chat logic
- **Model**: gemini-2.0-flash-exp (Free tier experimental model)
- **Features**:
  - Gemini API initialization
  - Chat session management
  - FAQ context injection with strict rules
  - Input validation (length, special characters, empty messages)
  - Message handling with error recovery
  - Comprehensive error handling

## Usage

### Adding to Other Pages

The chatbot is already integrated globally in `App.jsx` and appears on all pages. If you need to add it to specific pages only, import and include the component:

```jsx
import Chatbot from "../components/Chatbot";

function YourPage() {
  return (
    <div>
      {/* Your page content */}
      
      {/* Add chatbot */}
      <Chatbot />
    </div>
  );
}
```

### Customizing FAQ Content

Edit the `FAQ_CONTEXT` constant in `/src/services/chatbotService.js` to update the knowledge base:

```javascript
const FAQ_CONTEXT = `
Your updated FAQ content here...
`;
```

### Customizing Suggested Questions

Update the `getSuggestedQuestions()` method in `chatbotService.js`:

```javascript
getSuggestedQuestions() {
  return [
    "Your custom question 1?",
    "Your custom question 2?",
    // Add more questions...
  ];
}
```

## Styling

The chatbot uses Tailwind CSS classes consistent with your platform's design:
- **Primary Colors**: Blue gradient (`from-blue-600 to-teal-500`)
- **Typography**: Matches platform fonts
- **Shadows**: Consistent with other modals/cards
- **Animations**: Smooth transitions and hover effects

### Customizing Colors

To change the chatbot theme, update the gradient classes in `Chatbot.jsx`:

```jsx
// Change from blue-teal to your preferred colors
className="bg-gradient-to-r from-blue-600 to-teal-500"
// To, for example:
className="bg-gradient-to-r from-purple-600 to-pink-500"
```

## API Configuration

### Model Settings
Current configuration in `chatbotService.js`:

**Model**: `gemini-2.0-flash-exp` (Free Tier Experimental)
- No billing required
- Experimental model with latest features
- Fast response times
- Suitable for chatbot applications

```javascript
generationConfig: {
  temperature: 0.6,    // Creativity (0-1, lower = more focused)
  topK: 40,           // Token selection diversity
  topP: 0.95,         // Cumulative probability threshold
  maxOutputTokens: 800, // Maximum response length
}
```

### Adjusting Response Style

- **More Creative**: Increase `temperature` to 0.8
- **More Focused**: Decrease `temperature` to 0.4
- **Shorter Responses**: Decrease `maxOutputTokens` to 512
- **Longer Responses**: Increase `maxOutputTokens` to 1024

## Security & Validation

The chatbot includes comprehensive security measures:

- **Input Validation**: 100 character limit, special character detection, empty message blocking
- **Content Restrictions**: Only answers platform-related questions, refuses off-topic/inappropriate requests
- **Error Handling**: Graceful fallbacks for API failures, quota exceeded, network issues
- **Privacy Protection**: Never accesses or shares user account data

All security features are built into the chatbot service with no additional configuration needed.

## Best Practices

1. **Keep FAQ Current**: Update `FAQ_CONTEXT` when platform features change
2. **Monitor Usage**: Check console for any API errors
3. **Privacy**: Don't include sensitive user data in prompts
4. **Testing**: Test chatbot responses regularly with various question types

## Troubleshooting

### Chatbot Not Appearing
- Check if `<Chatbot />` is included in the page component
- Verify component import path is correct
- Check browser console for errors

### "API Key Error"
- Ensure `VITE_GEMINI_API_KEY` is set in `.env`
- Verify API key is valid and active
- Restart dev server after changing `.env`

### Poor Responses
- Review and update `FAQ_CONTEXT` for clarity
- Adjust `temperature` setting (currently 0.6)
- Add more specific information to knowledge base
- Note: Bot will refuse off-topic questions by design

### Styling Issues
- Check Tailwind CSS classes are correct
- Verify no CSS conflicts with other components
- Test on different screen sizes

## Future Enhancements

Potential improvements for later versions:

1. **Backend Proxy**: Move API calls to backend for better security and analytics
2. **Admin Panel**: Update FAQ content without code changes
3. **Conversation Logging**: Store conversations for analytics (with user consent)
4. **Multi-language**: Support for different languages
5. **Feedback System**: Rate bot responses
6. **Integration**: Connect with support ticket system

## Security Notes

- API key stored in environment variables (never commit `.env` to Git)
- Input validation prevents spam and abuse
- Content restrictions ensure on-topic, professional responses
- No user account data is accessed or shared by the chatbot

## Support

For issues or questions about the chatbot:
1. Check this documentation first
2. Review Gemini API documentation
3. Contact the development team

## License

This chatbot integration is part of the Event Ticketing Platform project.
