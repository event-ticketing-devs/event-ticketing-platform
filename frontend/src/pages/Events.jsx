import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import { format } from "date-fns";

const EventListPage = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: "", date: "" });

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchCategory = filters.category
      ? event.categoryId === filters.category
      : true;
    const matchDate = filters.date
      ? format(new Date(event.date), "yyyy-MM-dd") === filters.date
      : true;
    return matchCategory && matchDate;
  });

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Events</h1>

      <div className="flex gap-4 mb-4">
        <select
          className="border p-2 rounded"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
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
      </div>

      {filteredEvents.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((event) => (
            <li key={event._id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-1">{event.title}</h2>
              <p className="text-sm text-gray-600 mb-2">
                {format(new Date(event.date), "PPpp")}
              </p>
              <p className="mb-2 line-clamp-2">{event.description}</p>
              <Link
                to={`/events/${event._id}`}
                className="text-blue-600 hover:underline"
              >
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventListPage;
