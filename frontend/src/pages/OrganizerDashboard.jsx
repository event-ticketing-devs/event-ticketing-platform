import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import EventDetailsModal from "../components/EventDetailsModal";
import { format } from "date-fns";

export default function OrganizerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/events");
      const myEvents = res.data.filter(
        (event) => event.organizerId === (currentUser && currentUser._id)
      );
      setEvents(myEvents);
    } catch (err) {
      toast.error("Failed to fetch events");
    }
    setLoading(false);
  };

  const handleDelete = (eventId, isCancelled) => {
    setEventToDelete(eventId);
    setShowModal(true);
    setCancelReason("");
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/events/${eventToDelete}`, {
        data: cancelReason ? { cancelledReason: cancelReason } : {},
      });
      toast.success("Event cancelled successfully");
      setShowModal(false);
      setCancelReason("");
      setEventToDelete(null);
      fetchEvents();
    } catch (err) {
      toast.error("Failed to cancel event");
    }
  };

  const viewDetails = async (event) => {
    try {
      const res = await apiClient.get(`/bookings/event/${event._id}`);

      // Calculate total booked seats for both legacy and categorized events
      let totalBooked = 0;
      if (event.hasTicketCategories) {
        // For categorized events, sum up totalQuantity from categorized bookings
        totalBooked = res.data.reduce((sum, booking) => {
          if (booking.hasTicketCategories && booking.totalQuantity) {
            return sum + booking.totalQuantity;
          } else if (!booking.hasTicketCategories && booking.noOfSeats) {
            return sum + booking.noOfSeats;
          }
          return sum;
        }, 0);
      } else {
        // For legacy events, sum up noOfSeats
        totalBooked = res.data.reduce(
          (sum, booking) => sum + (booking.noOfSeats || 0),
          0
        );
      }

      // Calculate total seats and available seats
      let totalSeats, availableSeats;
      if (event.hasTicketCategories && event.ticketCategories) {
        totalSeats = event.ticketCategories.reduce(
          (sum, cat) => sum + cat.totalSeats,
          0
        );
        availableSeats = totalSeats - totalBooked;
      } else {
        totalSeats = event.totalSeats;
        availableSeats =
          typeof totalSeats === "number"
            ? Math.max(0, totalSeats - totalBooked)
            : undefined;
      }

      setSelectedEvent({
        ...event,
        totalSeats,
        availableSeats,
      });
      setAttendees(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      toast.error("Failed to fetch attendees");
    }
  };

  // Split events into upcoming and past
  const now = new Date();
  const upcomingEvents = events.filter((event) => new Date(event.date) >= now);
  const pastEvents = events.filter((event) => new Date(event.date) < now);

  const formatEventDate = (dateString) => {
    try {
      return format(new Date(dateString), "PPP 'at' p");
    } catch {
      return new Date(dateString).toLocaleString();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full animate-spin">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Loading your events...
              </h2>
              <p className="text-slate-600">
                Please wait while we fetch your event data
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Organizer Dashboard
                </h1>
                <p className="text-slate-600">
                  Manage your events and track attendees
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/events/create")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-teal-600 hover:shadow-xl transition-all duration-300"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create New Event
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 ${
                  activeTab === "upcoming"
                    ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setActiveTab("upcoming")}
              >
                <div className="flex items-center justify-center gap-2">
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  Upcoming Events ({upcomingEvents.length})
                </div>
              </button>
              <button
                className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 ${
                  activeTab === "past"
                    ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setActiveTab("past")}
              >
                <div className="flex items-center justify-center gap-2">
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
                  Past Events ({pastEvents.length})
                </div>
              </button>
            </div>

            {/* Events Content */}
            <div className="p-6">
              {activeTab === "upcoming" ? (
                upcomingEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10 text-slate-400"
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
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      No Upcoming Events
                    </h3>
                    <p className="text-slate-600 mb-6">
                      You haven't created any upcoming events yet. Start by
                      creating your first event!
                    </p>
                    <button
                      onClick={() => navigate("/events/create")}
                      className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-teal-600 hover:shadow-xl transition-all duration-300"
                    >
                      Create Your First Event
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event._id}
                        className={`bg-slate-50 rounded-xl border border-slate-200/50 p-6 transition-all duration-300 ${
                          event.cancelled
                            ? "opacity-60"
                            : "hover:shadow-lg hover:border-slate-300"
                        }`}
                      >
                        {/* Event Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
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
                              {formatEventDate(event.date)}
                            </div>
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
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {event.city}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {event.categoryId && (
                              <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-semibold">
                                {typeof event.categoryId === "object"
                                  ? event.categoryId.name
                                  : event.categoryId}
                              </span>
                            )}
                            {event.cancelled && (
                              <span className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full font-semibold">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Price</p>
                            <p className="font-semibold text-slate-800">
                              {event.hasTicketCategories &&
                              event.ticketCategories
                                ? `${formatCurrency(
                                    Math.min(
                                      ...event.ticketCategories.map(
                                        (c) => c.price
                                      )
                                    )
                                  )} onwards`
                                : formatCurrency(event.price || 0)}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">
                              Total Seats
                            </p>
                            <p className="font-semibold text-slate-800">
                              {event.hasTicketCategories &&
                              event.ticketCategories
                                ? event.ticketCategories.reduce(
                                    (sum, cat) => sum + (cat.totalSeats || 0),
                                    0
                                  )
                                : event.totalSeats || 0}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              navigate(`/events/edit/${event._id}`)
                            }
                            disabled={event.cancelled}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                              event.cancelled
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            }`}
                          >
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>

                          {!event.cancelled && (
                            <button
                              onClick={() => handleDelete(event._id, false)}
                              className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-semibold hover:bg-red-200 transition-all"
                            >
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => viewDetails(event)}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all"
                          >
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            Details
                          </button>

                          <Link
                            to={`/events/verify/${event._id}`}
                            className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold hover:bg-green-200 transition-all"
                          >
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Verify
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : pastEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-slate-400"
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
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    No Past Events
                  </h3>
                  <p className="text-slate-600">
                    You don't have any completed events yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pastEvents.map((event) => (
                    <div
                      key={event._id}
                      className={`bg-slate-50 rounded-xl border border-slate-200/50 p-6 transition-all duration-300 ${
                        event.cancelled
                          ? "opacity-60"
                          : "hover:shadow-lg hover:border-slate-300"
                      }`}
                    >
                      {/* Event Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-800 mb-2">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
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
                            {formatEventDate(event.date)}
                          </div>
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {event.city}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {event.categoryId && (
                            <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-semibold">
                              {typeof event.categoryId === "object"
                                ? event.categoryId.name
                                : event.categoryId}
                            </span>
                          )}
                          {event.cancelled && (
                            <span className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full font-semibold">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">
                            {event.hasTicketCategories ? "Pricing" : "Price"}
                          </p>
                          {event.hasTicketCategories &&
                          event.ticketCategories ? (
                            <div className="space-y-1">
                              {event.ticketCategories
                                .slice(0, 2)
                                .map((category, index) => (
                                  <p
                                    key={index}
                                    className="text-xs font-medium text-slate-700"
                                  >
                                    {category.name}:{" "}
                                    {formatCurrency(category.price)}
                                  </p>
                                ))}
                              {event.ticketCategories.length > 2 && (
                                <p className="text-xs text-slate-500">
                                  +{event.ticketCategories.length - 2} more
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="font-semibold text-slate-800">
                              {formatCurrency(event.price || 0)}
                            </p>
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">
                            Total Seats
                          </p>
                          <p className="font-semibold text-slate-800">
                            {event.hasTicketCategories && event.ticketCategories
                              ? event.ticketCategories.reduce(
                                  (sum, cat) => sum + cat.totalSeats,
                                  0
                                )
                              : event.totalSeats}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => viewDetails(event)}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all"
                        >
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View Details
                        </button>

                        <Link
                          to={`/organizer/verify/${event._id}`}
                          className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold hover:bg-green-200 transition-all"
                        >
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Verify Tickets
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        open={showModal}
        title={"Cancel Event"}
        description={
          "This action cannot be undone. If you wish to proceed, please provide a reason for cancellation:"
        }
        onClose={() => {
          setShowModal(false);
          setCancelReason("");
          setEventToDelete(null);
        }}
        onConfirm={confirmDelete}
        confirmText={"Cancel Event"}
        showInput={true}
        inputValue={cancelReason}
        setInputValue={setCancelReason}
      />
      <EventDetailsModal
        open={showDetailsModal}
        event={selectedEvent}
        attendees={attendees}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
}
