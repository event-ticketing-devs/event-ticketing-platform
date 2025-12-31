# Event Ticketing Platform

A full-stack event management and ticketing platform built with React and Node.js. Users can browse events, book tickets, and organizers can manage their events with QR code verification, comprehensive contact management, and venue booking capabilities.

## Features

### For Attendees

- Browse and search events by category, location, and date
- Secure ticket booking with Stripe payment integration
- QR code tickets for event entry
- Profile management and booking history
- Google OAuth authentication
- Flexible refund policy based on cancellation timing
- Contact organizers directly for event-specific inquiries
- General contact form for platform support
- Report inappropriate events to administrators

### For Organizers

- Create and manage events with detailed information
- Track bookings and attendee analytics
- QR code ticket verification system
- Event cancellation with automated refunds
- Revenue tracking and seat management
- Manage incoming contact messages from attendees
- Event-specific contact management system
- Real-time team collaboration with integrated chat
- Browse and request venue bookings through venue marketplace
- Compare venue spaces and amenities
- Request custom quotes for venue spaces
- Communicate directly with venue managers through inquiry chat

### For Admins

- User and organizer management
- Category management
- System-wide analytics and oversight
- Comprehensive contact management with status tracking
- Rate limiting protection against spam
- Event reporting and flagging system
- Review and manage flagged events
- Detailed organizer profile management and verification
- Venue management and approval system
- Monitor venue requests and quotes

### For Venue Managers

- Create and manage venue listings with multiple spaces
- Set capacity, amenities and policies for each space
- Receive and respond to venue booking requests
- Generate custom quotes for organizers
- Real-time inquiry chat with potential clients
- Manage booking calendar and availability

## Tech Stack

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
- Redis for rate limiting and caching
- Socket.io for real-time features
- Contact management system

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- Redis server
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
PORT=8000
CORS_ORIGIN=*
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
STRIPE_SECRET_KEY=your-stripe-secret-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

Create `.env` in the **frontend** directory:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
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

**Application URL:** `http://localhost:5173`

## API Documentation

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

### Contacts

- `POST /api/contacts/general` - Submit general contact form
- `POST /api/contacts/event/:eventId` - Contact event organizer
- `GET /api/contacts/general` - Get general contacts (admin)
- `GET /api/contacts/organizer` - Get organizer contacts
- `PATCH /api/contacts/:contactId/status` - Update contact status

### Reports

- `POST /api/reports` - Report an event for inappropriate content
- `GET /api/reports/my-reports` - Get user's own reports
- `GET /api/reports` - Get all reports (admin)
- `GET /api/reports/events/flagged` - Get flagged events (admin)
- `PATCH /api/reports/:reportId/status` - Update report status (admin)

### Venues

- `POST /api/venues` - Create venue listing (venue managers)
- `GET /api/venues` - List all venues with filtering options
- `GET /api/venues/:id` - Get venue details with spaces
- `PATCH /api/venues/:id` - Update venue information
- `DELETE /api/venues/:id` - Remove venue listing
- `POST /api/venues/requests` - Submit venue booking request
- `GET /api/venues/requests/organizer` - Get organizer's venue requests
- `GET /api/venues/requests/venue` - Get venue's incoming requests
- `PATCH /api/venues/requests/:id` - Update request status
- `POST /api/venues/quotes` - Generate custom quote for space
- `GET /api/venues/quotes/:requestId` - Get quotes for a request

### Venue Options

- `GET /api/venue-options` - Get venue filtering options (cities, amenities)

### Team Chat

- `GET /api/team-chat/:eventId` - Get team chat messages for event
- `POST /api/team-chat/:eventId` - Send message to team chat
- Real-time messaging via Socket.io

### Payments

- `POST /api/payments/create-payment-intent` - Create Stripe payment intent

## Project Structure

```text
event-ticketing-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Authentication, error handling, rate limiting
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   ├── redis/           # Redis client and helpers
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

## Key Features

### Venue Marketplace

- **Browse Venues** by city, capacity, amenities, and budget
- **Space Comparison** with side-by-side feature comparison
- **Detailed Venue Profiles** with images, amenities, and parking information
- **Space-Specific Details** including capacity, pricing, and equipment
- **Booking Request System** for organizers to request venue spaces
- **Quote Management** allowing venues to provide custom pricing
- **Real-Time Inquiry Chat** between organizers and venue managers
- **Interactive Maps** with Google Maps integration for venue locations

### Team Collaboration

- **Real-Time Team Chat** for event organizers and co-organizers
- **File Sharing** within team chat conversations
- **Message History** and read receipts
- **Event-Specific Channels** for focused collaboration
- **Socket.io Integration** for instant message delivery

### Contact Management System

- **General Contact Form** for platform support inquiries
- **Event-Specific Contact** for attendee-organizer communication
- **Admin Dashboard** for managing contact messages
- **Email Notifications** for contact confirmations
- **Status Tracking** for contact resolution

### Rate Limiting & Security

- **Redis-based Rate Limiting** to prevent spam and abuse
- **Contact Form Protection** with strict rate limits (1 message per 5 minutes)
- **IP-based Tracking** with sliding window algorithm
- **Graceful Degradation** when Redis is unavailable

### Payment System

- **Secure Stripe Integration** with automated refund processing
- **Flexible Refund Policy:**
  - 7+ days before event: 100% refund
  - 1-7 days before: 50% refund
  - Less than 24 hours: No refund

### Authentication & Authorization

- Email/phone login support
- Google OAuth integration
- JWT-based authentication
- Role-based access control (attendee, organizer, venue manager, admin)

### QR Code System

- Unique QR codes for each booking
- Mobile-friendly verification interface
- Real-time verification status updates

### Event Management

- Rich event creation with image uploads
- Venue location with map integration
- Seat capacity management
- Event cancellation with automated notifications

### Content Moderation & Reporting

- **Event Reporting System** for flagging inappropriate content
- **Multiple Report Categories**: spam, scam, inappropriate content, misleading information, etc.
- **Admin Review Dashboard** for managing flagged events
- **Report Status Tracking**: pending, reviewed, resolved, dismissed
- **User Report History** for transparency

## Database Models

- **User**: Handles attendee, organizer, and admin accounts
- **Event**: Stores event details and metadata
- **Booking**: Manages ticket bookings and verification
- **Category**: Event categorization system
- **Contact**: Manages contact messages and support tickets
- **Report**: Handles event reporting and flagging system
- **Venue**: Stores venue information, location, and contact details
- **Space**: Defines individual spaces within venues with capacity and pricing
- **VenueRequest**: Tracks organizer requests for venue bookings
- **VenueQuote**: Manages custom pricing quotes from venues
- **VenueInquiryChat**: Real-time chat between organizers and venue managers
- **TeamChat**: Real-time collaboration chat for event teams

## Technical Stack

### Rate Limiting Implementation

- **Redis Sorted Sets** for sliding window tracking
- **IP-based Identification** with IPv4/IPv6 support
- **Configurable Windows** for different endpoints
- **Automatic Cleanup** of expired entries

### Development Features

- ES6 modules throughout
- Async/await for better readability
- Comprehensive error handling
- Input validation and sanitization
- CORS configuration for security
- Environment-based configuration
- Real-time communication with Socket.io
- QR code generation for ticket verification

## User Roles

The platform supports four distinct user roles:

1. **Attendee** - Browse events, purchase tickets, contact organizers
2. **Organizer** - Create events, manage bookings, request venue bookings, collaborate with team
3. **Venue Manager** - List venues and spaces, manage booking requests, generate quotes
4. **Admin** - Oversee platform operations, manage users, handle reports

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Prerequisites for Development

- **Node.js** v18 or higher
- **MongoDB** database (local or cloud)
- **Redis** server for rate limiting
- **Stripe** account for payment processing
- **Google** developer account for OAuth and Maps API
- **Cloudinary** account for image storage (optional)

## Quick Start

For a quick development setup:

```bash
# Clone and setup
git clone <repository-url>
cd event-ticketing-platform

# Install all dependencies
npm run install:all

# Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
npm run dev
```

## Performance & Scalability

- **Redis Integration** for fast rate limiting and caching
- **Image Optimization** with Cloudinary CDN
- **Payment Processing** with Stripe's secure infrastructure
- **Responsive Design** for mobile-first experience
- **Real-Time Features** powered by Socket.io WebSockets
- **Efficient Database Indexing** for optimized queries

---
