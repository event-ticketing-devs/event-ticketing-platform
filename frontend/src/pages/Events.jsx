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
    new Set(events.map((e) => e.venue).filter(Boolean))
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
    const matchVenue = filters.venue ? event.venue === filters.venue : true;
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
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Browse Events</h1>
      {loading ? (
        <div className="text-center py-10 text-blue-600 font-semibold">
          Loading events...
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="border p-2 rounded"
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

          <input
            type="date"
            className="border p-2 rounded"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />

          <select
            className="border p-2 rounded"
            value={filters.venue}
            onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
          >
            <option value="">All Venues</option>
            {venues.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            className="border p-2 rounded"
            placeholder="Max Price"
            value={filters.price}
            onChange={(e) => setFilters({ ...filters, price: e.target.value })}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.length === 0 && !loading ? (
          <p className="col-span-full text-slate-500">No events found.</p>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event._id}
              className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-2 border hover:shadow-lg transition-all relative"
            >
              {event.photo && (
                <img
                  src={event.photo}
                  alt={event.title}
                  className="w-full h-40 object-cover rounded mb-2 border"
                />
              )}
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-blue-700 flex-1">
                  {event.title}
                </h2>
                {event.categoryId && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {typeof event.categoryId === "object"
                      ? event.categoryId.name
                      : event.categoryId}
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-sm mb-1">
                {new Date(event.date).toLocaleString()}
              </p>
              <p className="text-slate-700 mb-1 line-clamp-2">
                {event.description}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">Venue:</span>{" "}
                <span>{event.venue}</span>
                <span className="font-medium">Price:</span>{" "}
                <span>₹{event.price}</span>
              </div>
              <Link
                to={`/events/${event._id}`}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-400 text-white rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all text-center font-semibold cursor-pointer"
              >
                View Details
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventListPage;
