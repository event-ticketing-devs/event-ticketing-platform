// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get("/bookings/user");
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Booked Events</h1>
      {bookings.length === 0 ? (
        <p>You haven’t registered for any events yet.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map(({ _id, eventId, noOfSeats }) =>
            !eventId || eventId.cancelled ? null : (
              <li key={_id} className="p-4 border rounded shadow-sm">
                <h2 className="text-xl font-semibold">{eventId.title}</h2>
                <p>Date: {new Date(eventId.date).toLocaleString()}</p>
                <p>Seats Booked: {noOfSeats}</p>
                <Link
                  to={`/events/${eventId._id}`}
                  className="text-blue-600 hover:underline"
                >
                  View Event
                </Link>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
