import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import { format } from "date-fns";

const EventListPage = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    date: "",
    venue: "",
    price: "",
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Get unique venues for filter dropdown
  const venues = Array.from(
    new Set(events.map((e) => e.venue?.name || e.venue).filter(Boolean))
  );

  const filteredEvents = events.filter((event) => {
    if (event.cancelled) return false;
    // Exclude past events
    if (new Date(event.date) < new Date()) return false;
    const matchCategory = filters.category
      ? (event.categoryId && (event.categoryId._id || event.categoryId)) ===
        filters.category
      : true;
    const matchDate = filters.date
      ? format(new Date(event.date), "yyyy-MM-dd") === filters.date
      : true;
    const venueToMatch = event.venue?.name || event.venue;
    const matchVenue = filters.venue ? venueToMatch === filters.venue : true;
    const matchPrice = filters.price
      ? Number(event.price) <= Number(filters.price)
      : true;
    return matchCategory && matchDate && matchVenue && matchPrice;
  });

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                Discover Amazing
                <span className="block text-transparent bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text">
                  Events
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-blue-100 mb-6 max-w-2xl">
                Find and book tickets for concerts, festivals, conferences, and
                more
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/events/create"
                className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-300"
              >
                <svg
                  className="w-5 h-5 transition-transform group-hover:rotate-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
              />
            </svg>
            Filter Events
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-blue-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="font-medium">Loading filters...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Category
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters({ ...filters, date: e.target.value })
                  }
                />
              </div>

              {/* Venue Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Venue
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                  value={filters.venue}
                  onChange={(e) =>
                    setFilters({ ...filters, venue: e.target.value })
                  }
                >
                  <option value="">All Venues</option>
                  {venues.map((venue) => (
                    <option key={venue} value={venue}>
                      {venue}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Max Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                  placeholder="Enter max price"
                  value={filters.price}
                  onChange={(e) =>
                    setFilters({ ...filters, price: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Events Grid */}
        <div className="space-y-8">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                {loading
                  ? "Loading..."
                  : `${filteredEvents.length} Events Found`}
              </h2>
              <p className="text-slate-600 mt-1">
                Discover your next experience
              </p>
            </div>

            {!loading && filteredEvents.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Save your favorites
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-slate-400"
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
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                No events found
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                We couldn't find any events matching your criteria. Try
                adjusting your filters or check back later for new events.
              </p>
              <Link
                to="/events/create"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create the first event
              </Link>
            </div>
          ) : (
            /* Events Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <div
                  key={event._id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden">
                    {event.photo ? (
                      <img
                        src={event.photo}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-blue-300"
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

                    {/* Category Badge */}
                    {event.categoryId && (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-blue-700 border border-white/20">
                          {typeof event.categoryId === "object"
                            ? event.categoryId.name
                            : event.categoryId}
                        </span>
                      </div>
                    )}

                    {/* Price Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg">
                        {event.hasTicketCategories && event.ticketCategories
                          ? `₹${Math.min(
                              ...event.ticketCategories.map((c) => c.price)
                            ).toLocaleString()} onwards`
                          : `₹${event.price || 0}`}
                      </span>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-6">
                    {/* Event Title */}
                    <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                      {event.title}
                    </h3>

                    {/* Event Date */}
                    <div className="flex items-center gap-2 text-slate-600 mb-3">
                      <svg
                        className="w-4 h-4 text-blue-500"
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
                      <span className="text-sm font-medium">
                        {new Date(event.date).toLocaleString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Event Description */}
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                      {event.description}
                    </p>

                    {/* Event Details */}
                    <div className="space-y-2 mb-6">
                      {/* Venue */}
                      <div className="flex items-center gap-2 text-sm">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="text-slate-700 font-medium">
                          {event.venue?.name || event.venue}
                        </span>
                        {event.city && (
                          <span className="text-slate-500">• {event.city}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/events/${event._id}`}
                      className="block w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 px-4 rounded-xl font-semibold text-center shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-teal-600 transition-all duration-300 group-hover:scale-105"
                    >
                      View Details & Book
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventListPage;
