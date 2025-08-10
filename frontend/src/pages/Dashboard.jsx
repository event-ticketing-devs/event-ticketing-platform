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
      // Check if booking was cancelled by user or event was cancelled
      if (b.cancelledByUser || b.cancelledByEvent || b.eventId.cancelled) {
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-700">Your Booked Events</h1>
        {cancelled.length > 0 && (
          <Link
            to="/cancelled-bookings"
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
          >
            View All Cancelled ({cancelled.length})
          </Link>
        )}
      </div>
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
            .data.map((booking) => {
              const {
                _id,
                eventId,
                noOfSeats,
                ticketId,
                qrCode,
                verified,
                cancelledByUser,
                cancelledByEvent,
                cancellationDate,
                cancellationReason,
                refundStatus,
                refundAmount,
              } = booking;

              if (!eventId) return null;

              const isCancelled =
                cancelledByUser || cancelledByEvent || eventId.cancelled;
              const isPastEvent = new Date(eventId.date) < new Date();

              return (
                <li
                  key={_id}
                  className={`bg-white p-4 border rounded-xl shadow-md flex flex-col gap-2 hover:shadow-lg transition-all ${
                    isCancelled ? "opacity-75 border-red-200" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold text-blue-700">
                      {eventId.title}
                    </h2>
                    {isCancelled && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                        {cancelledByUser
                          ? "Cancelled by You"
                          : cancelledByEvent
                          ? "Event Cancelled"
                          : "Cancelled"}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm mb-1">
                    Date: {new Date(eventId.date).toLocaleString()}
                  </p>

                  {isCancelled && cancellationDate && (
                    <p className="text-red-600 text-sm mb-1">
                      Cancelled: {new Date(cancellationDate).toLocaleString()}
                    </p>
                  )}

                  <p className="mb-1">
                    Seats Booked:{" "}
                    <span className="font-semibold">{noOfSeats}</span>
                  </p>

                  {/* Refund Information for Cancelled Bookings */}
                  {isCancelled && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Cancellation Details
                      </h4>
                      {cancellationReason && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Reason:</strong> {cancellationReason}
                        </p>
                      )}
                      {refundStatus && (
                        <div className="text-sm">
                          <p className="mb-1">
                            <strong>Refund Status:</strong>{" "}
                            <span
                              className={`font-semibold ${
                                refundStatus === "processed"
                                  ? "text-green-600"
                                  : refundStatus === "failed"
                                  ? "text-red-600"
                                  : refundStatus === "none"
                                  ? "text-gray-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {refundStatus === "processed"
                                ? "Refund Processed"
                                : refundStatus === "failed"
                                ? "Refund Failed"
                                : refundStatus === "none"
                                ? "No Refund"
                                : "Processing"}
                            </span>
                          </p>
                          {refundAmount !== undefined && (
                            <p>
                              <strong>Refund Amount:</strong> ₹
                              {refundAmount || 0}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Regular booking information */}
                  {!isCancelled && (
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
                  )}

                  <div className="flex gap-2">
                    <Link
                      to={`/events/${eventId._id}`}
                      className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-400 text-white rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all text-center font-semibold cursor-pointer w-fit"
                    >
                      View Details
                    </Link>
                    {qrCode && !isCancelled && (
                      <Link
                        to={`/ticket/${_id}`}
                        className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-all text-center font-semibold cursor-pointer w-fit"
                      >
                        View Ticket
                      </Link>
                    )}
                    {isPastEvent && !isCancelled && (
                      <span className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded font-semibold">
                        Past Event
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
