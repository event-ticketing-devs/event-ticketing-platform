import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Discover and book amazing events
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-400 mb-8 leading-relaxed">
              From concerts to conferences, find and book tickets for the best events in your city. Create and manage your own events with ease.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-slate-100 transition-colors"
              >
                Explore Events
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <Link
                to="/events/create"
                className="inline-flex items-center justify-center gap-2 border border-slate-700 text-white px-6 py-3 font-semibold hover:bg-slate-800 transition-colors"
              >
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Featured Events
            </h2>
            <p className="text-slate-600">
              Discover the hottest events happening in your city
            </p>
          </div>

          {loading ? (
            /* Loading State */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-slate-200 w-3/4"></div>
                    <div className="h-3 bg-slate-200 w-1/2"></div>
                    <div className="h-3 bg-slate-200 w-full"></div>
                    <div className="h-10 bg-slate-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredEvents.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-slate-400"
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
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No featured events yet
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Be the first to create an amazing event in your city
              </p>
              <Link
                to="/events/create"
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 font-semibold hover:bg-slate-800 transition-colors"
              >
                Create Event
              </Link>
            </div>
          ) : (
            /* Featured Events Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <div
                  key={event._id}
                  className="group bg-white border border-slate-200 hover:border-slate-300 overflow-hidden transition-colors flex flex-col"
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {event.photo ? (
                      <img
                        src={event.photo}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-slate-300"
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
                    )}

                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-white text-slate-900">
                        {event.hasTicketCategories && event.ticketCategories
                          ? `₹${Math.min(
                              ...event.ticketCategories.map((c) => c.price)
                            ).toLocaleString()} onwards`
                          : `₹${event.price || 0}`}
                      </span>
                    </div>
                  </div>

                  {/* Event Content - flex-1 to grow and push button down */}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Event Title */}
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>

                    {/* Event Date */}
                    <div className="flex items-center gap-2 text-slate-600 mb-3">
                      <svg
                        className="w-4 h-4 text-slate-400"
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
                      <span className="text-sm">
                        {new Date(event.date).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Venue */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                      <svg
                        className="w-4 h-4 text-slate-400 flex-shrink-0"
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
                      <span className="truncate">
                        {event.venue?.name || event.venue}
                        {event.city && `, ${event.city}`}
                      </span>
                    </div>

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1"></div>

                    {/* View Details Button */}
                    <Link
                      to={`/events/${event._id}`}
                      className="block w-full text-center bg-slate-900 text-white py-2.5 px-4 font-semibold hover:bg-slate-800 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Events Link */}
          {featuredEvents.length > 0 && (
            <div className="mt-10">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 text-slate-900 hover:text-slate-700 font-semibold transition-colors"
              >
                View all events
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
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
