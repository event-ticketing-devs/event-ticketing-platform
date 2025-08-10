# Event Ticketing Platform - Time-based Refund Policy Implementation

## Overview
This implementation adds a comprehensive time-based refund policy system to the event ticketing platform, providing users with clear refund information and automated refund processing.

## Refund Policy Rules
- **7+ days before event**: 100% refund
- **1-7 days before event**: 50% refund  
- **Less than 24 hours before event**: No refund

## Backend Implementation

### 1. Enhanced Booking Model (`backend/src/models/Booking.js`)
Added new fields to track cancellation details:
- `cancelledByUser`: Boolean indicating user-initiated cancellation
- `cancelledByEvent`: Boolean indicating event cancellation
- `cancellationDate`: Timestamp of cancellation
- `cancellationReason`: Text description of cancellation reason
- `refundStatus`: Status of refund processing ('none', 'processing', 'processed', 'failed')
- `refundAmount`: Actual refund amount processed
- `refundId`: Stripe refund ID for tracking

### 2. Refund Policy Utility (`backend/src/utils/refundPolicy.js`)
Central utility function for consistent refund calculations:
- Handles floating-point precision issues with epsilon comparison
- Returns refund percentage, amount, and policy description
- Used across both backend and frontend for consistency

### 3. Enhanced Booking Controller (`backend/src/controllers/bookingController.js`)
#### Key Functions:
- **`cancelBooking`**: Processes cancellations with automatic refund calculation
- **`getUserCancelledBookings`**: Retrieves user's cancellation history
- **`getRefundStatusEndpoint`**: Checks Stripe refund status

#### Features:
- Automatic Stripe refund processing
- Detailed email notifications with refund information
- Comprehensive cancellation tracking
- Error handling and logging

### 4. Stripe Integration (`backend/src/utils/stripeRefund.js`)
- Automated refund processing through Stripe API
- Refund status tracking and verification
- Error handling for failed refunds

## Frontend Implementation

### 1. Enhanced Dashboard (`frontend/src/pages/Dashboard.jsx`)
- Categorizes bookings into upcoming, past, and cancelled
- Displays refund information for cancelled bookings
- Shows cancellation reasons and refund status
- Quick link to detailed cancelled bookings page

### 2. Cancelled Bookings Page (`frontend/src/pages/CancelledBookings.jsx`)
Dedicated page for viewing cancellation history:
- Detailed refund information display
- Refund status tracking with visual indicators
- Support contact links for failed refunds
- Real-time refund status checking

### 3. Enhanced Event Details (`frontend/src/pages/EventDetails.jsx`)
- Prominent refund policy information display
- Real-time refund calculation based on current date
- Enhanced cancellation confirmation with refund preview
- Color-coded refund policy indicators

### 4. Refund Policy Components
- Visual refund policy grid showing all time periods
- Calculated refund amounts before booking
- Interactive cancellation confirmations with policy details

## API Endpoints

### Existing Enhanced Endpoints:
- `DELETE /api/bookings/:id` - Enhanced with refund processing
- `GET /api/bookings/user` - Enhanced with cancellation data

### New Endpoints:
- `GET /api/bookings/user/cancelled` - Get user's cancelled bookings
- `GET /api/bookings/:id/refund-status` - Check refund status

## User Experience Features

### 1. Transparency
- Clear refund policy display before booking
- Real-time refund calculation
- Detailed cancellation confirmations

### 2. Communication
- Comprehensive email notifications
- Refund status tracking
- Support contact integration

### 3. Accessibility
- Color-coded refund indicators
- Clear policy explanations
- Mobile-responsive design

## Technical Considerations

### 1. Precision Handling
- Floating-point precision issues resolved with epsilon comparison
- Consistent time calculations across backend and frontend

### 2. Error Handling
- Graceful handling of Stripe API failures
- User-friendly error messages
- Fallback procedures for refund issues

### 3. Data Integrity
- Comprehensive cancellation tracking
- Audit trail for all refund operations
- Consistent data validation

## Testing
- Comprehensive test suite for refund policy calculations
- Edge case handling for boundary conditions
- Integration testing with Stripe API

## Future Enhancements
- Admin dashboard for refund management
- Bulk refund processing for event cancellations
- Advanced refund policy configurations
- Refund analytics and reporting

## Security Considerations
- User authorization for booking access
- Secure Stripe API integration
- Data validation and sanitization
- Protection against refund manipulation

This implementation provides a complete, user-friendly refund system that enhances the platform's trustworthiness and user experience while maintaining operational efficiency.
