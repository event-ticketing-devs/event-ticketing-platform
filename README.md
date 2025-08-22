# Event Ticketing Platform

A full-stack event management and ticketing platform built with React and Node.js. Users can browse events, book tickets, and organizers can manage their events with QR code verification and comprehensive contact management.

## ✨ Features

### For Attendees
- Browse and search events by category, location, and date
- Secure ticket booking with Stripe payment integration
- QR code tickets for event entry
- Profile management and booking history
- Google OAuth authentication
- Flexible refund policy based on cancellation timing
- Contact organizers directly for event-specific inquiries
- General contact form for platform support

### For Organizers
- Create and manage events with detailed information
- Track bookings and attendee analytics
- QR code ticket verification system
- Event cancellation with automated refunds
- Revenue tracking and seat management
- Manage incoming contact messages from attendees
- Event-specific contact management system

### For Admins
- User and organizer management
- Category management
- System-wide analytics and oversight
- Comprehensive contact management with status tracking
- Rate limiting protection against spam

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
- Redis for rate limiting and caching
- Contact management system

## 🚀 Getting Started

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

### Contacts

- `POST /api/contacts/general` - Submit general contact form
- `POST /api/contacts/event/:eventId` - Contact event organizer
- `GET /api/contacts/general` - Get general contacts (admin)
- `GET /api/contacts/organizer` - Get organizer contacts
- `PATCH /api/contacts/:contactId/status` - Update contact status

### Payments

- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
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

## 🔑 Key Features

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
- **Contact**: Manages contact messages and support tickets

## 🛠️ Technical Stack

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Prerequisites for Development

- **Node.js** v18 or higher
- **MongoDB** database (local or cloud)
- **Redis** server for rate limiting
- **Stripe** account for payment processing
- **Google** developer account for OAuth and Maps API
- **Cloudinary** account for image storage (optional)

## 🚀 Quick Start

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

## 📈 Performance & Scalability

- **Redis Integration** for fast rate limiting and caching
- **Database Indexing** for optimized queries
- **Image Optimization** with Cloudinary CDN
- **Payment Processing** with Stripe's secure infrastructure
- **Responsive Design** for mobile-first experience

---
