// src/pages/DashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/bookings/user?limit=100"); // Get more bookings for dashboard
      
      // Handle both old and new API response formats
      if (res.data.bookings) {
        setBookings(res.data.bookings);
      } else {
        // Fallback for old API format
        setBookings(res.data);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setBookings([]);
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
    {
      key: "upcoming",
      label: "Upcoming",
      data: upcoming,
      icon: (
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "blue",
    },
    {
      key: "past",
      label: "Past",
      data: past,
      icon: (
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "slate",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      data: cancelled,
      icon: (
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
      color: "red",
    },
  ];

  const renderBookingCard = (booking) => {
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
      <div
        key={_id}
        className={`bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 ${
          isCancelled ? "opacity-90" : ""
        }`}
      >
        {/* Event Header */}
        <div className="relative">
          {eventId.photo ? (
            <div className="h-48 relative">
              <img
                src={eventId.photo}
                alt={eventId.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
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

          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            {isCancelled ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-500/90 backdrop-blur-sm text-white">
                {cancelledByUser
                  ? "Cancelled by You"
                  : cancelledByEvent
                  ? "Event Cancelled"
                  : "Cancelled"}
              </span>
            ) : isPastEvent ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-500/90 backdrop-blur-sm text-white">
                Past Event
              </span>
            ) : verified ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500/90 backdrop-blur-sm text-white">
                ✓ Verified
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-500/90 backdrop-blur-sm text-white">
                Pending
              </span>
            )}
          </div>

          {/* Event Title Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">
              {eventId.title}
            </h3>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          {/* Event Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-slate-600">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">
                {format(new Date(eventId.date), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <span className="text-sm">{eventId.city}</span>
            </div>
          </div>

          {/* Booking Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">
                  {booking.hasTicketCategories
                    ? "Tickets Booked"
                    : "Seats Booked"}
                </p>
                {booking.hasTicketCategories && booking.ticketItems ? (
                  <div className="space-y-1">
                    {booking.ticketItems.map((item, index) => (
                      <p
                        key={index}
                        className="text-sm font-medium text-slate-800"
                      >
                        {item.quantity}x {item.categoryName}
                      </p>
                    ))}
                    <p className="text-xs text-slate-600 font-semibold">
                      Total: {booking.totalQuantity} tickets
                    </p>
                  </div>
                ) : (
                  <p className="font-bold text-slate-800">{noOfSeats}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-600">Ticket ID</p>
                <p className="font-mono text-sm text-slate-800">
                  {ticketId || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Details */}
          {isCancelled && (
            <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Cancellation Details
              </h4>
              {cancellationDate && (
                <p className="text-sm text-red-700 mb-2">
                  <strong>Cancelled:</strong>{" "}
                  {format(new Date(cancellationDate), "PPp")}
                </p>
              )}
              {cancellationReason && (
                <p className="text-sm text-red-700 mb-2">
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
                      <strong>Refund Amount:</strong> ₹{refundAmount || 0}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QR Code Section */}
          {qrCode && !isCancelled && (
            <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">
                    Your Ticket
                  </h4>
                  <p className="text-sm text-blue-600">
                    Present this QR code at entrance
                  </p>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <img
                    src={qrCode}
                    alt="Ticket QR Code"
                    className="w-16 h-16"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link
              to={`/events/${eventId._id}`}
              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-600 transition-all duration-300 text-center"
            >
              View Event
            </Link>
            {qrCode && !isCancelled && (
              <Link
                to={`/ticket/${_id}`}
                className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 px-4 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 text-center"
              >
                View Ticket
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Events Dashboard
              </h1>
              <p className="text-slate-600 text-lg">
                Manage your bookings and view event details
              </p>
            </div>
            {cancelled.length > 0 && (
              <Link
                to="/cancelled-bookings"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-semibold"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                View All Cancelled ({cancelled.length})
              </Link>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            {tabData.map((t) => (
              <button
                key={t.key}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  tab === t.key
                    ? `bg-gradient-to-r ${
                        t.color === "blue"
                          ? "from-blue-600 to-teal-500"
                          : t.color === "red"
                          ? "from-red-500 to-pink-500"
                          : "from-slate-500 to-gray-500"
                      } text-white shadow-lg`
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
                onClick={() => setTab(t.key)}
              >
                {t.icon}
                {t.label} ({t.data.length})
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-xl font-medium">
                Loading your bookings...
              </span>
            </div>
          </div>
        ) : tabData.find((t) => t.key === tab).data.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {tabData.find((t) => t.key === tab).icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                No {tab} events
              </h3>
              <p className="text-slate-600 mb-6">
                {tab === "upcoming"
                  ? "You don't have any upcoming bookings. Discover amazing events to attend!"
                  : tab === "past"
                  ? "You haven't attended any events yet. Check out what's happening!"
                  : "You don't have any cancelled bookings."}
              </p>
              {tab !== "cancelled" && (
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-600 transition-all duration-300"
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Browse Events
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tabData.find((t) => t.key === tab).data.map(renderBookingCard)}
          </div>
        )}
      </div>
    </div>
  );
}
