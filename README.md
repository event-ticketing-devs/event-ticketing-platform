# Event Ticketing Platform

A full-stack event management and ticketing platform built with React and Node.js. Users can browse events, book tickets, and organizers can manage their events with QR code verification.

## ✨ Features

### For Attendees
- Browse and search events by category, location, and date
- Secure ticket booking with Stripe payment integration
- QR code tickets for event entry
- Profile management and booking history
- Google OAuth authentication
- Flexible refund policy based on cancellation timing

### For Organizers
- Create and manage events with detailed information
- Track bookings and attendee analytics
- QR code ticket verification system
- Event cancellation with automated refunds
- Revenue tracking and seat management

### For Admins
- User and organizer management
- Category management
- System-wide analytics and oversight

## 🛠️ Tech Stack

**Frontend:**
- React 19 with React Router
- TailwindCSS for styling
- Axios for API calls
- React Hot Toast for notifications
- Date-fns for date handling

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- Google OAuth integration
- Stripe payment processing
- Email notifications

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database
- Stripe account
- Google OAuth credentials

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd event-ticketing-platform
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment Configuration**

Create `.env` in the **backend** directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-ticketing
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
STRIPE_SECRET_KEY=your-stripe-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

Create `.env` in the **frontend** directory:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

4. **Start the application**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

🌐 **Application URL:** `http://localhost:5173`

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/phone and password
- `POST /api/auth/google` - Google OAuth authentication
- `POST /api/auth/logout` - Logout user

### Events
- `POST /api/events` - Create event (organizers)
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Cancel event
- `GET /api/events/:id/seats` - Get available seats

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user` - Get user bookings
- `GET /api/bookings/event/:eventId` - Get event bookings
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/verify` - Verify ticket code

### Users
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/update` - Update user profile
- `DELETE /api/users/delete` - Delete own account
- `DELETE /api/users/:id` - Admin delete user

### Categories
- `POST /api/categories` - Create category (admin)
- `GET /api/categories` - List categories
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent

## 🏗️ Project Structure

```
event-ticketing-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Authentication, error handling
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── context/         # React context
    │   ├── pages/           # Route components
    │   ├── services/        # API services
    │   ├── api/             # API client setup
    │   └── App.jsx          # Main app component
    └── package.json
```

## 🔑 Key Features

### Payment System
- **Secure Stripe Integration** with automated refund processing
- **Flexible Refund Policy:**
  - 7+ days before event: 100% refund
  - 1-7 days before: 50% refund
  - Less than 24 hours: No refund

### Authentication
- Email/phone login support
- Google OAuth integration
- JWT-based authentication
- Role-based access control (attendee, organizer, admin)

### QR Code System
- Unique QR codes for each booking
- Mobile-friendly verification interface
- Real-time verification status updates

### Event Management
- Rich event creation with image uploads
- Venue location with map integration
- Seat capacity management
- Event cancellation with automated notifications

## 🗄️ Database Models

- **User**: Handles attendee, organizer, and admin accounts
- **Event**: Stores event details and metadata
- **Booking**: Manages ticket bookings and verification
- **Category**: Event categorization system

## 🧪 Development

The project follows modern development practices:
- ES6 modules throughout
- Async/await for better readability
- Comprehensive error handling
- Input validation and sanitization
- CORS configuration for security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
