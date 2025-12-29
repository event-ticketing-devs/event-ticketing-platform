import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [featuredVenues, setFeaturedVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [userCity, setUserCity] = useState("Your City");

  const fetchFeaturedEvents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/events?limit=20&sortBy=createdAt&sortOrder=desc");
      
      // Handle both old and new API response formats
      const allEvents = res.data.events || res.data;
      
      // Get the latest 6 events as featured events
      const events = allEvents.filter(
        (event) => !event.cancelled && new Date(event.date) > new Date()
      );
      setFeaturedEvents(events.slice(0, 6));

      // Try to get user's city from the first event or set a default
      if (events.length > 0 && events[0].city) {
        setUserCity(events[0].city);
      } else {
        setUserCity("Mumbai");
      }
    } catch (err) {
      console.error("Error fetching featured events:", err);
    }
    setLoading(false);
  };

  const fetchFeaturedVenues = async () => {
    setVenuesLoading(true);
    try {
      const res = await apiClient.get("/venues?limit=6&status=verified");
      const venues = Array.isArray(res.data) ? res.data : res.data.venues || [];
      setFeaturedVenues(venues.slice(0, 6));
    } catch (err) {
      console.error("Error fetching featured venues:", err);
    }
    setVenuesLoading(false);
  };

  useEffect(() => {
    fetchFeaturedEvents();
    fetchFeaturedVenues();
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: `url('hero_bg.png')`
        }}></div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Live Events & Venues in Your City
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-primary leading-tight shadow-xl">
              Your Gateway to 
              <span className="block bg-gradient-to-r from-bg-secondary/80 to-bg-secondary bg-clip-text text-transparent">
                Unforgettable Experiences
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              Discover concerts, conferences, workshops, and more. Book the perfect venue for your next event or attend amazing experiences happening around you.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Browse Events
              </Link>

              <Link
                to="/venues"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Explore Venues
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 pb-8 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-3">
              HAPPENING NOW
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
              Trending Events
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Don't miss out on the hottest events happening around you
            </p>
          </div>

          {loading ? (
            /* Loading State */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-bg-primary border border-border rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-bg-secondary rounded-t-lg"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-bg-secondary rounded w-3/4"></div>
                    <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
                    <div className="h-3 bg-bg-secondary rounded w-full"></div>
                    <div className="h-10 bg-bg-secondary rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredEvents.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 bg-bg-secondary rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                No featured events yet
              </h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Be the first to create an amazing event in your city
              </p>
              <Link
                to="/events/create"
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Create Event
              </Link>
            </div>
          ) : (
            /* Featured Events Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
                <Link
                  key={event._id}
                  to={`/events/${event._id}`}
                  className="group bg-bg-primary border border-border rounded-2xl hover:border-primary/30 overflow-hidden transition-all flex flex-col hover:shadow-md cursor-pointer"
                >
                  {/* Event Image */}
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 rounded-t-2xl">
                    {event.photo ? (
                      <img
                        src={event.photo}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-text-secondary/30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Category Badge */}
                    {event.category && (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-white/95 backdrop-blur-sm text-text-primary rounded-full shadow-sm">
                          {event.category.name || event.category}
                        </span>
                      </div>
                    )}

                    {/* Price Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-4 py-2 text-sm font-bold bg-primary text-white rounded-full shadow-lg">
                        {event.hasTicketCategories && event.ticketCategories
                          ? `From ₹${Math.min(
                              ...event.ticketCategories.map((c) => c.price)
                            ).toLocaleString()}`
                          : event.price > 0 ? `₹${event.price.toLocaleString()}` : 'FREE'}
                      </span>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Event Title */}
                    <h3 className="text-xl font-bold text-text-primary mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>

                    {/* Event Date */}
                    <div className="flex items-center gap-3 text-text-secondary mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {new Date(event.date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="flex items-center gap-3 text-text-secondary mb-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-secondary/10 rounded-lg">
                        <svg
                          className="w-5 h-5 text-secondary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm truncate">
                        {event.venue?.name || event.venue}
                        {event.city && `, ${event.city}`}
                      </span>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-primary font-semibold group-hover:gap-2 transition-all flex items-center gap-1">
                        View Details
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* View All Events Link */}
          {featuredEvents.length > 0 && (
            <div className="mt-10 text-center">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/90 font-semibold text-lg transition-colors group"
              >
                View All Events
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Venues Section */}
      <section className="pt-12 pb-20 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full mb-4">
              <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              <span className="text-sm font-semibold text-secondary uppercase tracking-wide">
                Featured Venues
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Perfect Spaces for Your Events
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Discover verified venues ready to host your next memorable event
            </p>
          </div>

          {/* Venues Grid */}
          {venuesLoading ? (
            /* Loading Skeleton */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-bg-primary border border-border rounded-2xl overflow-hidden">
                  <div className="h-56 bg-bg-secondary animate-pulse"></div>
                  <div className="p-6">
                    <div className="h-6 bg-bg-secondary rounded animate-pulse mb-3"></div>
                    <div className="h-4 bg-bg-secondary rounded animate-pulse w-2/3 mb-4"></div>
                    <div className="h-4 bg-bg-secondary rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredVenues.length > 0 ? (
            /* Venues Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredVenues.map((venue) => (
                <Link
                  key={venue._id}
                  to={`/venues/${venue._id}`}
                  className="group bg-bg-primary border border-border rounded-2xl hover:border-primary/30 overflow-hidden transition-all flex flex-col hover:shadow-md cursor-pointer"
                >
                  {/* Venue Image */}
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-t-2xl">
                    {(venue.photos && venue.photos.length > 0) || venue.photo ? (
                      <img
                        src={venue.photos?.[0] || venue.photo}
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-text-secondary/30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Verified Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-success/95 backdrop-blur-sm text-white rounded-full shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    </div>
                  </div>

                  {/* Venue Content */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Venue Name */}
                    <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-secondary transition-colors">
                      {venue.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-text-secondary mb-4">
                      <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm truncate">{venue.city}</span>
                    </div>

                    {/* Venue Type & Capacity */}
                    <div className="flex items-center gap-4 mb-4">
                      {venue.venueType && (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-secondary/10 text-secondary rounded-full">
                          {venue.venueType}
                        </span>
                      )}
                      {venue.totalCapacity && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-medium">{venue.totalCapacity.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Amenities Preview */}
                    {venue.amenities && venue.amenities.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 text-xs text-text-secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="truncate">
                          {venue.amenities.slice(0, 3).join(", ")}
                          {venue.amenities.length > 3 && ` +${venue.amenities.length - 3} more`}
                        </span>
                      </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-secondary font-semibold group-hover:gap-2 transition-all flex items-center gap-1">
                        View Venue
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-bg-primary border border-border rounded-2xl">
              <svg
                className="w-16 h-16 text-text-secondary/30 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Venues Available</h3>
              <p className="text-text-secondary">Check back soon for featured venues</p>
            </div>
          )}

          {/* View All Venues Link */}
          {featuredVenues.length > 0 && (
            <div className="text-center mt-10">
              <Link
                to="/venues"
                className="inline-flex items-center gap-2 text-secondary hover:text-secondary/90 font-semibold text-lg transition-colors group"
              >
                View All Venues
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
