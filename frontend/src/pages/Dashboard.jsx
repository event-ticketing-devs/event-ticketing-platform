// src/pages/DashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

// ...existing imports...
export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

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

  // Categorize bookings
  const { upcoming, past, cancelled } = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];
    const cancelled = [];
    bookings.forEach((b) => {
      if (!b.eventId) return;
      if (b.eventId.cancelled) {
        cancelled.push(b);
      } else if (new Date(b.eventId.date) < now) {
        past.push(b);
      } else {
        upcoming.push(b);
      }
    });
    return { upcoming, past, cancelled };
  }, [bookings]);

  const tabData = [
    { key: "upcoming", label: "Upcoming", data: upcoming },
    { key: "past", label: "Past", data: past },
    { key: "cancelled", label: "Cancelled", data: cancelled },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">
        Your Booked Events
      </h1>
      <div className="flex gap-2 mb-4">
        {tabData.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 rounded-t-lg font-semibold ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-blue-700"
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-blue-600 animate-pulse">Loading your bookings...</p>
      ) : tabData.find((t) => t.key === tab).data.length === 0 ? (
        <p className="text-slate-500">
          {tab === "upcoming"
            ? "No upcoming bookings."
            : tab === "past"
            ? "No past bookings."
            : "No cancelled bookings."}
        </p>
      ) : (
        <ul className="space-y-4">
          {tabData
            .find((t) => t.key === tab)
            .data.map(
              ({ _id, eventId, noOfSeats, ticketId, qrCode, verified }) =>
                eventId && (
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
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <strong>Ticket ID:</strong> {ticketId || "N/A"}
                        <br />
                        <strong>Status:</strong>{" "}
                        {verified ? (
                          <span className="text-green-600 font-semibold">
                            Verified
                          </span>
                        ) : (
                          <span className="text-orange-600 font-semibold">
                            Not Verified
                          </span>
                        )}
                      </div>
                      {qrCode && (
                        <div className="flex flex-col items-center">
                          <strong className="mb-2 text-sm">QR Code:</strong>
                          <img
                            src={qrCode}
                            alt="Ticket QR Code"
                            className="w-24 h-24 border-2 border-gray-300 rounded-lg"
                          />
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            Present at event entrance
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/events/${eventId._id}`}
                        className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-400 text-white rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all text-center font-semibold cursor-pointer w-fit"
                      >
                        View Details
                      </Link>
                      {qrCode && (
                        <Link
                          to={`/ticket/${_id}`}
                          className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-all text-center font-semibold cursor-pointer w-fit"
                        >
                          View Ticket
                        </Link>
                      )}
                      {eventId.cancelled && (
                        <span className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded font-semibold">
                          Cancelled
                        </span>
                      )}
                      {new Date(eventId.date) < new Date() &&
                        !eventId.cancelled && (
                          <span className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded font-semibold">
                            Past Event
                          </span>
                        )}
                    </div>
                  </li>
                )
            )}
        </ul>
      )}
    </div>
  );
}
