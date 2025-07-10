# Event Ticketing Platform

A full-stack web application for managing events, ticket bookings, and user authentication.

## Features

- User registration and login (including Google OAuth)
- Role-based access: Attendee, Organizer, Admin
- Event creation, update, and cancellation
- Category management for events
- Ticket booking with seat availability checks
- Soft cancellation for bookings
- RESTful API with validation and error handling

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT, Google OAuth

## Getting Started

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/event-ticketing-platform.git
   ```
2. Install dependencies for backend and frontend:
   ```sh
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the `backend` directory with the following (example):

```
PORT=8000
CORS_ORIGIN=*
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
NODE_ENV=development/production
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Create a `.env` file in the `frontend` directory with the following (example):

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Running the App

- Start MongoDB
- Start backend:
  ```sh
  cd backend
  npm run dev
  ```
- Start frontend:
  ```sh
  cd frontend
  npm run dev
  ```

### Google OAuth Setup

- **Authorized JavaScript origins:** `http://localhost:5173`
- **Authorized redirect URIs:** `http://localhost:8000/api/auth/google/callback`

## API Endpoints

### Events

- `POST /api/events` - Create event
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event by ID
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Cancel event

### Categories

- `POST /api/categories` - Create category
- `GET /api/categories` - List categories
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings
- `PATCH /api/bookings/:id/cancel` - Cancel booking
