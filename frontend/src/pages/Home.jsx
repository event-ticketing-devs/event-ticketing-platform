import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { Calendar, MapPin, ArrowRight, CheckCircle2, Sparkles, ChevronRight, Building, ShieldCheck } from "lucide-react";

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
        {/* Background Image - optimized */}
        <div className="absolute inset-0">
          <img
            src="hero_bg.png"
            alt="Hero background"
            className="w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"

          />
        </div>
        
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
                <Calendar className="w-5 h-5" />
                Browse Events
              </Link>

              <Link
                to="/venues"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all cursor-pointer"
              >
                <MapPin className="w-5 h-5" />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                Happening Now
              </span>
            </div>
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
                <Calendar className="w-8 h-8 text-text-secondary" />
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
                        <Calendar className="w-16 h-16 text-text-secondary/30" />
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
                        <Calendar className="w-5 h-5 text-primary" />
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
                        <MapPin className="w-5 h-5 text-secondary" />
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
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
              <Sparkles className="w-4 h-4 text-secondary" />
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
                        <Building className="w-16 h-16 text-text-secondary/30" />
                      </div>
                    )}

                    {/* Verified Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-success/95 backdrop-blur-sm text-white rounded-full shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
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
                      <MapPin className="w-4 h-4 text-secondary" />
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
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{venue.totalCapacity.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Amenities Preview */}
                    {venue.amenities && venue.amenities.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 text-xs text-text-secondary">
                        <CheckCircle2 className="w-4 h-4" />
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
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-bg-primary border border-border rounded-2xl">
              <Building className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
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
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
