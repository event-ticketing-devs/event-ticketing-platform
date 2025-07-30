# Google Maps Integration Guide

## Overview

This implementation adds Google Maps integration for venue selection and display in the event ticketing platform.

## Features

### 🗺️ For Organizers (Event Creation/Editing)

- **Interactive Venue Selection**: Search and select venues using Google Maps
- **Click-to-Select**: Click anywhere on the map to set a custom location
- **Place Search**: Search for specific venues, restaurants, halls, etc.
- **Real-time Validation**: Ensures venue is selected before form submission

### 📍 For Users (Event Viewing)

- **Venue Map Display**: Interactive map showing exact venue location
- **Static Map in Emails**: Venue map included in ticket confirmation emails
- **Directions Integration**: Direct links to Google Maps for directions
- **Venue Information**: Complete address and location details

## Setup Instructions

### 1. Google Cloud Console Setup

1. **Create a Google Cloud Project**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Required APIs**

   ```
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Static Maps API
   ```

3. **Create API Keys**

   - Create 2 separate API keys:
     - **Client-side key**: For frontend (with domain restrictions)
     - **Server-side key**: For backend (with IP restrictions)

4. **Set API Key Restrictions**
   - **Client-side**: Restrict to your domain(s)
   - **Server-side**: Restrict to your server IP(s)

### 2. Environment Variables

**Frontend (.env)**

```env
VITE_GOOGLE_MAPS_API_KEY=your_client_side_api_key_here
```

**Backend (.env)**

```env
GOOGLE_MAPS_API_KEY=your_server_side_api_key_here
```

### 3. Database Migration

Run the migration script to convert existing events:

```bash
cd backend
node scripts/migrateVenues.js
```

## New Data Structure

### Event Model Changes

```javascript
// Old structure
{
  venue: "String venue name"
}

// New structure
{
  city: "Delhi",
  venue: {
    name: "India Gate",
    address: "Rajpath, India Gate, New Delhi, Delhi 110001",
    coordinates: {
      lat: 28.6129,
      lng: 77.2295
    },
    placeId: "ChIJzw-KyYpDDTkRzKa1cOgO4g8" // Optional
  }
}
```

## Components

### VenueSelector

- **Usage**: Event creation/editing forms
- **Features**: Search, map interaction, place selection
- **Props**: `onVenueSelect`, `selectedVenue`, `city`

### VenueMap

- **Usage**: Event details display
- **Features**: Map display, directions, venue info
- **Props**: `venue`, `height`, `showDirections`

## Email Integration

Ticket confirmation emails now include:

- **Static Map Image**: Shows venue location
- **Google Maps Link**: Direct navigation to venue
- **Complete Address**: Full venue details

## Error Handling

- **API Key Issues**: Clear error messages for missing/invalid keys
- **Map Loading**: Loading states and fallback displays
- **Venue Selection**: Validation ensures venue is selected
- **Email Failures**: Non-blocking - emails fail gracefully without affecting booking

## Performance Considerations

- **Lazy Loading**: Maps load only when needed
- **Caching**: API responses cached where appropriate
- **Error Boundaries**: Graceful degradation if maps fail
- **Mobile Optimized**: Responsive design for all devices

## Testing

### Development Testing

1. **Local Testing**: Use localhost in API restrictions
2. **Venue Selection**: Test search and click-to-select
3. **Email Testing**: Check static maps in email templates
4. **Error Scenarios**: Test with invalid/missing API keys

### Production Checklist

- [ ] API keys configured with proper restrictions
- [ ] Billing enabled in Google Cloud Console
- [ ] Domain restrictions set for client-side key
- [ ] IP restrictions set for server-side key
- [ ] Migration script run for existing events
- [ ] Email templates tested with maps

## Troubleshooting

### Common Issues

1. **"Failed to load Google Maps"**

   - Check API key validity
   - Verify API restrictions match your domain/IP
   - Ensure required APIs are enabled

2. **Maps not showing in emails**

   - Verify server-side API key is set
   - Check Static Maps API is enabled
   - Ensure email service allows external images

3. **Search not working**

   - Verify Places API is enabled
   - Check API key has Places API permissions

4. **"This page can't load Google Maps correctly"**
   - Usually indicates billing not enabled
   - Check Google Cloud Console billing settings

## Cost Considerations

- **Maps JavaScript API**: $7 per 1,000 map loads
- **Places API**: $17 per 1,000 requests
- **Static Maps API**: $2 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests

**Optimization Tips:**

- Cache search results where possible
- Use map only when necessary
- Consider usage limits for development

## Security Best Practices

1. **API Key Restrictions**: Always restrict keys to specific domains/IPs
2. **Environment Variables**: Never commit API keys to version control
3. **Key Rotation**: Regularly rotate API keys
4. **Monitoring**: Monitor API usage in Google Cloud Console

## Future Enhancements

- **Distance-based Search**: Filter events by distance from user
- **Venue Analytics**: Track popular venues and areas
- **Route Planning**: Multi-stop directions for event tours
- **Offline Maps**: Cache maps for offline viewing
