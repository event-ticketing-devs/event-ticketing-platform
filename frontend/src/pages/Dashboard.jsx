// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

// ...existing imports...
export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/bookings/user");
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">
        Your Booked Events
      </h1>
      {loading ? (
        <p className="text-blue-600 animate-pulse">Loading your bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="text-slate-500">
          You haven’t registered for any events yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {bookings.map(({ _id, eventId, noOfSeats }) =>
            !eventId || eventId.cancelled ? null : (
              <li
                key={_id}
                className="bg-white p-4 border rounded-xl shadow-md flex flex-col gap-2 hover:shadow-lg transition-all"
              >
                <h2 className="text-xl font-semibold text-blue-700">
                  {eventId.title}
                </h2>
                <p className="text-slate-600 text-sm mb-1">
                  Date: {new Date(eventId.date).toLocaleString()}
                </p>
                <p className="mb-1">
                  Seats Booked:{" "}
                  <span className="font-semibold">{noOfSeats}</span>
                </p>
                <Link
                  to={`/events/${eventId._id}`}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-400 text-white rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all text-center font-semibold cursor-pointer w-fit"
                >
                  View Details
                </Link>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
