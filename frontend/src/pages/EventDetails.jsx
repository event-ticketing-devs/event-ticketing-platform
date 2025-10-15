// src/pages/EventDetailsPage.jsx
import { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import ReportEventModal from "../components/ReportEventModal";
import ContactOrganizer from "../components/ContactOrganizer";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import StripeCheckout from "../components/StripeCheckout";
import VenueMap from "../components/VenueMap";

/**
 * Calculate refund policy based on time until event
 * @param {Date} eventDate - Event date
 * @param {Object} customRefundPolicy - Custom refund policy (optional)
 * @returns {Object} Refund policy information
 */
const calculateRefundPolicy = (eventDate, customRefundPolicy = null) => {
  const currentDate = new Date();
  const timeUntilEvent = eventDate - currentDate;
  const daysUntilEvent = timeUntilEvent / (1000 * 60 * 60 * 24);

  let refundPercentage = 0;
  let refundPolicy = "";
  let refundColor = "";

  // Use small epsilon to handle floating point precision issues
  const epsilon = 0.001; // About 1.4 minutes

  if (customRefundPolicy) {
    // Use custom refund policy
    if (daysUntilEvent >= 7 - epsilon) {
      refundPercentage = customRefundPolicy.sevenDaysOrMore;
      refundPolicy = customRefundPolicy.description || `${refundPercentage}% refund (7+ days before event)`;
      refundColor = refundPercentage >= 80 ? "text-green-600" : refundPercentage >= 50 ? "text-yellow-600" : "text-red-600";
    } else if (daysUntilEvent >= 1 - epsilon) {
      refundPercentage = customRefundPolicy.oneToDays;
      refundPolicy = customRefundPolicy.description || `${refundPercentage}% refund (1-7 days before event)`;
      refundColor = refundPercentage >= 80 ? "text-green-600" : refundPercentage >= 50 ? "text-yellow-600" : "text-red-600";
    } else {
      refundPercentage = customRefundPolicy.lessThanDay;
      refundPolicy = customRefundPolicy.description || `${refundPercentage}% refund (less than 24 hours before event)`;
      refundColor = refundPercentage >= 80 ? "text-green-600" : refundPercentage >= 50 ? "text-yellow-600" : "text-red-600";
    }
  } else {
    // Use default refund policy
    if (daysUntilEvent >= 7 - epsilon) {
      refundPercentage = 100;
      refundPolicy = "Full refund (7+ days before event)";
      refundColor = "text-green-600";
    } else if (daysUntilEvent >= 1 - epsilon) {
      refundPercentage = 50;
      refundPolicy = "50% refund (1-7 days before event)";
      refundColor = "text-yellow-600";
    } else {
      refundPercentage = 0;
      refundPolicy = "No refund (less than 24 hours before event)";
      refundColor = "text-red-600";
    }
  }

  return {
    daysUntilEvent: daysUntilEvent.toFixed(1),
    refundPercentage,
    refundPolicy,
    refundColor,
    isCustomPolicy: !!customRefundPolicy,
  };
};

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alreadyBooked, setAlreadyBooked] = useState(false);
  const [userBookingId, setUserBookingId] = useState(null);
  const [userBooking, setUserBooking] = useState(null);
  const [availableSeats, setAvailableSeats] = useState(0);
  const [seatCount, setSeatCount] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContactOrganizer, setShowContactOrganizer] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState(null);

  // Ticket category selection state
  const [ticketSelections, setTicketSelections] = useState([]);

  // Computed values for ticket categories
  const totalTickets = ticketSelections.reduce(
    (sum, selection) => sum + selection.quantity,
    0
  );
  const totalPrice = ticketSelections.reduce((sum, selection) => {
    const category = event?.ticketCategories?.find(
      (c) => c._id === selection.categoryId
    );
    return sum + (category ? category.price * selection.quantity : 0);
  }, 0);

  // Handler for ticket category selection
  const handleTicketSelectionChange = (categoryId, quantity) => {
    setTicketSelections((prev) => {
      const existing = prev.find((s) => s.categoryId === categoryId);
      if (existing) {
        if (quantity === 0) {
          return prev.filter((s) => s.categoryId !== categoryId);
        }
        return prev.map((s) =>
          s.categoryId === categoryId ? { ...s, quantity } : s
        );
      } else if (quantity > 0) {
        return [...prev, { categoryId, quantity }];
      }
      return prev;
    });
  };

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/events/${id}`);
      setEvent(res.data);

      // Fetch seat info from the new API
      let remainingSeats = 0;
      try {
        const seatRes = await apiClient.get(`/events/${id}/seats`);
        remainingSeats = seatRes.data.remainingSeats;
      } catch (e) {
        remainingSeats = 0;
      }
      setLoading(false);

      let alreadyBooked = false;
      let bookingId = null;
      let bookingDetails = null;
      if (currentUser) {
        // For all users, check if they have an active booking for this event
        try {
          const userBookingsRes = await apiClient.get("/bookings/user?limit=100");
          
          // Handle both old and new API response formats
          const userBookings = userBookingsRes.data.bookings || userBookingsRes.data;
          
          const activeBooking = userBookings.find(
            (b) =>
              b.eventId &&
              b.eventId._id === id &&
              !b.cancelledByUser &&
              !b.cancelledByEvent
          );
          alreadyBooked = !!activeBooking;
          bookingId = activeBooking ? activeBooking._id : null;
          bookingDetails = activeBooking || null;
        } catch {}
      }

      setAvailableSeats(remainingSeats);
      setAlreadyBooked(alreadyBooked);
      setUserBookingId(bookingId);
      setUserBooking(bookingDetails);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch event");
      setLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    toast.success("Booking successful!");
    setShowPayment(false);
    fetchEvent();
  };

  const handleBooking = async () => {
    if (!currentUser) {
      toast("Please log in to book", { icon: "🔒" });
      return navigate("/login");
    }

    toast
      .promise(
        apiClient.post("/bookings", { eventId: id, noOfSeats: seatCount }),
        {
          loading: "Booking seat(s)...",
          success: "Booking successful!",
          error: (err) => err.response?.data?.message || "Booking failed",
        }
      )
      .then(fetchEvent);
  };

  const handleUnregister = () => {
    if (!userBookingId) return toast.error("No booking found");

    // Calculate refund policy before showing modal
    const customPolicy = event.useDefaultRefundPolicy ? null : event.customRefundPolicy;
    const policy = calculateRefundPolicy(new Date(event.date), customPolicy);
    setRefundPolicy(policy);
    setShowUnregisterModal(true);
  };

  const confirmUnregister = async () => {
    setShowUnregisterModal(false);
    try {
      const response = await toast.promise(
        apiClient.delete(`/bookings/${userBookingId}`),
        {
          loading: "Cancelling booking...",
          success: (res) => {
            const refund = res.data.refund;
            if (refund?.status === "processed") {
              return `Booking cancelled! Refund of ₹${refund.amount} processed.`;
            } else if (refund?.status === "none") {
              return "Booking cancelled! No refund applicable.";
            } else if (refund?.status === "failed") {
              return "Booking cancelled! Refund failed - please contact support.";
            }
            return "Booking cancelled successfully!";
          },
          error: (err) => err.response?.data?.message || "Cancellation failed",
        }
      );

      // Show additional refund information if available
      if (response.data.refund) {
        const { refund, cancellation } = response.data;
        setTimeout(() => {
          if (refund.status === "processed") {
            toast.success(
              `Refund Details: ₹${refund.amount} (${refund.percentage}% of original amount)`,
              {
                duration: 5000,
              }
            );
          } else if (refund.status === "none") {
            toast(
              `Cancelled ${cancellation.daysBeforeEvent} days before event - ${cancellation.refundPolicy}`,
              {
                icon: "ℹ️",
                duration: 4000,
              }
            );
          }
        }, 2000);
      }

      fetchEvent();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    }
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 flex items-center justify-center">
        <div className="flex items-center gap-3 text-blue-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-xl font-medium">Loading event details...</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
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
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Event Not Found
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/events")}
            className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-600 transition-all duration-300"
          >
            Browse Other Events
          </button>
        </div>
      </div>
    );

  const isPastEvent = event && new Date(event.date) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Image Section */}
        <div className="relative mb-8">
          {event.photo ? (
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={event.photo}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Floating Status Badges */}
              <div className="absolute top-6 left-6 flex gap-3">
                {event.categoryId && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/90 backdrop-blur-sm text-blue-700 border border-white/20 shadow-lg">
                    {typeof event.categoryId === "object"
                      ? event.categoryId.name
                      : event.categoryId}
                  </span>
                )}
                {event.cancelled && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-500/90 backdrop-blur-sm text-white border border-red-400/20 shadow-lg">
                    ❌ Cancelled
                  </span>
                )}
                {isPastEvent && !event.cancelled && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-500/90 backdrop-blur-sm text-white border border-gray-400/20 shadow-lg">
                    📅 Past Event
                  </span>
                )}
              </div>

              {/* Price Badge */}
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg">
                  {event.hasTicketCategories && event.ticketCategories
                    ? `₹${Math.min(
                        ...event.ticketCategories.map((c) => c.price)
                      ).toLocaleString()} onwards`
                    : `₹${event.price || 0}`}
                </span>
              </div>

              {/* Event Title Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                  {event.title}
                </h1>
                <div className="flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
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
                    <span className="text-lg font-medium">
                      {format(new Date(event.date), "PPP")} at{" "}
                      {format(new Date(event.date), "p")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-24 h-24 text-blue-300 mx-auto mb-4"
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
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-2">
                  {event.title}
                </h1>
                <div className="flex items-center justify-center gap-2 text-slate-600">
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
                  <span className="text-lg font-medium">
                    {format(new Date(event.date), "PPP")} at{" "}
                    {format(new Date(event.date), "p")}
                  </span>
                </div>
              </div>

              {/* Floating badges for no-image version */}
              <div className="absolute top-6 left-6 flex gap-3">
                {event.categoryId && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/90 backdrop-blur-sm text-blue-700 border border-white/20 shadow-lg">
                    {typeof event.categoryId === "object"
                      ? event.categoryId.name
                      : event.categoryId}
                  </span>
                )}
              </div>
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg">
                  ₹{event.price}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Event Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Description Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                About This Event
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Date & Time Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-teal-100 rounded-xl">
                    <svg
                      className="w-6 h-6 text-teal-600"
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
                  <h3 className="text-lg font-bold text-slate-800">
                    Date & Time
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-600 text-sm font-medium">
                    Event Date
                  </p>
                  <p className="text-slate-800 font-semibold text-lg">
                    {format(new Date(event.date), "EEEE, MMMM do, yyyy")}
                  </p>
                  <p className="text-slate-600 text-sm font-medium mt-3">
                    Event Time
                  </p>
                  <p className="text-slate-800 font-semibold text-lg">
                    {format(new Date(event.date), "h:mm a")}
                  </p>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <svg
                      className="w-6 h-6 text-purple-600"
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
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Location</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-600 text-sm font-medium">Venue</p>
                  <p className="text-slate-800 font-semibold text-lg">
                    {event.venue?.name || event.venue}
                  </p>
                  <p className="text-slate-600 text-sm font-medium mt-3">
                    City
                  </p>
                  <p className="text-slate-800 font-semibold">{event.city}</p>
                </div>
              </div>
            </div>

            {/* Event Specs Grid */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                Event Details
              </h2>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {event.hasTicketCategories && event.ticketCategories
                      ? event.ticketCategories.reduce(
                          (sum, cat) => sum + (cat.totalSeats || 0),
                          0
                        )
                      : event.totalSeats || 0}
                  </div>
                  <div className="text-slate-600 text-sm font-medium">
                    Total Seats
                  </div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {event.hasTicketCategories && event.ticketCategories
                      ? event.ticketCategories.reduce(
                          (sum, cat) =>
                            sum + (cat.availableSeats || cat.totalSeats || 0),
                          0
                        )
                      : availableSeats}
                  </div>
                  <div className="text-slate-600 text-sm font-medium">
                    Available
                  </div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {event.hasTicketCategories && event.ticketCategories
                      ? `₹${Math.min(
                          ...event.ticketCategories.map((c) => c.price)
                        ).toLocaleString()}`
                      : `₹${event.price || 0}`}
                  </div>
                  <div className="text-slate-600 text-sm font-medium">
                    {event.hasTicketCategories ? "Onwards" : "Per Ticket"}
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Map Section */}
            {event.venue &&
              typeof event.venue === "object" &&
              event.venue.coordinates && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                        />
                      </svg>
                    </div>
                    Venue Location
                  </h2>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <VenueMap venue={event.venue} height="250px" />
                  </div>
                </div>
              )}

            {/* Refund Policy Section */}
            {!isPastEvent && !event.cancelled && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  Cancellation & Refund Policy
                </h2>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                  {event.useDefaultRefundPolicy ? (
                    /* Default Policy Display */
                    <>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-green-100 rounded-xl p-4 text-center">
                          <div className="font-bold text-green-700 text-lg mb-1">
                            7+ Days Before
                          </div>
                          <div className="text-green-600 font-semibold">
                            100% Refund
                          </div>
                        </div>
                        <div className="bg-yellow-100 rounded-xl p-4 text-center">
                          <div className="font-bold text-yellow-700 text-lg mb-1">
                            1-7 Days Before
                          </div>
                          <div className="text-yellow-600 font-semibold">
                            50% Refund
                          </div>
                        </div>
                        <div className="bg-red-100 rounded-xl p-4 text-center">
                          <div className="font-bold text-red-700 text-lg mb-1">
                            &lt;24 Hours
                          </div>
                          <div className="text-red-600 font-semibold">
                            No Refund
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 text-center bg-white rounded-lg p-3">
                        Refunds are processed automatically and will appear in your
                        account within 5-10 business days.
                      </p>
                    </>
                  ) : (
                    /* Custom Policy Display */
                    <>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className={`rounded-xl p-4 text-center ${
                          event.customRefundPolicy?.sevenDaysOrMore >= 80 ? 'bg-green-100' :
                          event.customRefundPolicy?.sevenDaysOrMore >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <div className={`font-bold text-lg mb-1 ${
                            event.customRefundPolicy?.sevenDaysOrMore >= 80 ? 'text-green-700' :
                            event.customRefundPolicy?.sevenDaysOrMore >= 50 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            7+ Days Before
                          </div>
                          <div className={`font-semibold ${
                            event.customRefundPolicy?.sevenDaysOrMore >= 80 ? 'text-green-600' :
                            event.customRefundPolicy?.sevenDaysOrMore >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {event.customRefundPolicy?.sevenDaysOrMore || 0}% Refund
                          </div>
                        </div>
                        <div className={`rounded-xl p-4 text-center ${
                          event.customRefundPolicy?.oneToDays >= 80 ? 'bg-green-100' :
                          event.customRefundPolicy?.oneToDays >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <div className={`font-bold text-lg mb-1 ${
                            event.customRefundPolicy?.oneToDays >= 80 ? 'text-green-700' :
                            event.customRefundPolicy?.oneToDays >= 50 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            1-7 Days Before
                          </div>
                          <div className={`font-semibold ${
                            event.customRefundPolicy?.oneToDays >= 80 ? 'text-green-600' :
                            event.customRefundPolicy?.oneToDays >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {event.customRefundPolicy?.oneToDays || 0}% Refund
                          </div>
                        </div>
                        <div className={`rounded-xl p-4 text-center ${
                          event.customRefundPolicy?.lessThanDay >= 80 ? 'bg-green-100' :
                          event.customRefundPolicy?.lessThanDay >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <div className={`font-bold text-lg mb-1 ${
                            event.customRefundPolicy?.lessThanDay >= 80 ? 'text-green-700' :
                            event.customRefundPolicy?.lessThanDay >= 50 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            &lt;24 Hours
                          </div>
                          <div className={`font-semibold ${
                            event.customRefundPolicy?.lessThanDay >= 80 ? 'text-green-600' :
                            event.customRefundPolicy?.lessThanDay >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {event.customRefundPolicy?.lessThanDay || 0}% Refund
                          </div>
                        </div>
                      </div>
                      {event.customRefundPolicy?.description && (
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">
                            Policy Details:
                          </h4>
                          <p className="text-sm text-slate-600">
                            {event.customRefundPolicy.description}
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-slate-600 text-center bg-white rounded-lg p-3">
                        Refunds are processed automatically and will appear in your
                        account within 5-10 business days.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Cancellation Reason for Cancelled Events */}
            {event.cancelled && event.cancelledReason && (
              <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <svg
                      className="w-6 h-6 text-red-600"
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
                  </div>
                  Cancellation Notice
                </h2>
                <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                  <p className="text-red-800 font-medium">
                    <strong>Reason:</strong> {event.cancelledReason}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {isPastEvent ? (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-500"
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
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Event Ended
                  </h3>
                  <p className="text-slate-600 mb-4">
                    This event took place on{" "}
                    {format(new Date(event.date), "PPP")}
                  </p>
                  <button
                    onClick={() => navigate("/events")}
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-600 transition-all duration-300"
                  >
                    Browse Upcoming Events
                  </button>
                </div>
              ) : event.cancelled ? (
                <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-red-500"
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
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Event Cancelled
                  </h3>
                  <p className="text-slate-600 mb-4">
                    This event has been cancelled by the organizer
                  </p>
                  <button
                    onClick={() => navigate("/events")}
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-600 transition-all duration-300"
                  >
                    Find Other Events
                  </button>
                </div>
              ) : alreadyBooked ? (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      You're Registered!
                    </h3>
                    <p className="text-slate-600 mb-4">
                      You have successfully booked this event
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-600">
                          Booking Status
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Confirmed
                        </span>
                      </div>

                      {userBooking &&
                      userBooking.ticketItems &&
                      userBooking.ticketItems.length > 0 ? (
                        // Categorized booking display
                        <>
                          <div className="space-y-2 mb-3">
                            {userBooking.ticketItems.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-slate-600">
                                  {item.categoryName} × {item.quantity}
                                </span>
                                <span className="font-medium text-slate-800">
                                  ₹
                                  {(
                                    item.pricePerTicket * item.quantity
                                  ).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <span className="text-sm font-medium text-slate-600">
                              Total Tickets
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {userBooking.ticketItems.reduce(
                                (sum, item) => sum + item.quantity,
                                0
                              )}
                            </span>
                          </div>
                        </>
                      ) : (
                        // Legacy booking display
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-600">
                            Seats Booked
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {userBooking?.noOfSeats || seatCount}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">
                          Total Paid
                        </span>
                        <span className="text-lg font-bold text-slate-800">
                          ₹
                          {userBooking
                            ? userBooking.totalAmount 
                              ? userBooking.totalAmount.toLocaleString()
                              : (userBooking.noOfSeats * userBooking.priceAtBooking).toLocaleString()
                            : ((event.price || 0) * seatCount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => navigate(`/ticket/${userBookingId}`)}
                      className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2"
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
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2-2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5z"
                        />
                      </svg>
                      View My Ticket
                    </button>

                    <button
                      onClick={handleUnregister}
                      className="w-full bg-white border-2 border-red-200 text-red-600 py-3 px-6 rounded-xl font-semibold hover:bg-red-50 hover:border-red-300 transition-all duration-300 flex items-center justify-center gap-2"
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
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-slate-800 mb-1">
                      {event.hasTicketCategories && event.ticketCategories
                        ? `₹${Math.min(
                            ...event.ticketCategories.map((c) => c.price)
                          ).toLocaleString()}`
                        : `₹${event.price || 0}`}
                    </div>
                    <p className="text-slate-600">
                      {event.hasTicketCategories ? "Onwards" : "Per Ticket"}
                    </p>
                  </div>

                  {/* Ticket Category Selection for categorized events */}
                  {event.hasTicketCategories &&
                  event.ticketCategories &&
                  currentUser &&
                  !showPayment ? (
                    <div className="mb-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800">
                          Select Ticket Categories
                        </h3>
                        <div
                          className={`text-sm ${
                            totalTickets >= 8
                              ? "text-amber-600 font-medium"
                              : "text-slate-600"
                          }`}
                        >
                          {totalTickets}/10 tickets selected
                          {totalTickets < 10 && totalTickets >= 7 && (
                            <span className="ml-1 text-amber-600">
                              ({10 - totalTickets} remaining)
                            </span>
                          )}
                        </div>
                      </div>
                      {totalTickets >= 10 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-amber-800 text-sm font-medium">
                            Maximum of 10 tickets per booking reached. Remove
                            some tickets to select different categories.
                          </p>
                        </div>
                      )}
                      {event.ticketCategories.map((category, index) => {
                        const categorySelection = ticketSelections.find(
                          (s) => s.categoryId === category._id
                        ) || { quantity: 0 };
                        // Use totalSeats as fallback if availableSeats is not provided
                        const categoryAvailableSeats = Math.max(
                          0,
                          category.availableSeats ?? category.totalSeats ?? 0
                        );

                        return (
                          <div
                            key={category._id || index}
                            className="border border-slate-200 rounded-xl p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-slate-800">
                                  {category.name}
                                </h4>
                                {category.description && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {category.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-slate-800">
                                  ₹{category.price.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {categoryAvailableSeats} available
                                </div>
                              </div>
                            </div>

                            {categoryAvailableSeats > 0 ? (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-slate-700">
                                  Quantity:
                                </label>
                                <select
                                  value={categorySelection.quantity}
                                  onChange={(e) =>
                                    handleTicketSelectionChange(
                                      category._id,
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  {Array.from(
                                    {
                                      length: Math.min(
                                        categoryAvailableSeats + 1,
                                        // Allow current quantity + remaining tickets up to 10 total
                                        10 -
                                          totalTickets +
                                          categorySelection.quantity +
                                          1
                                      ),
                                    },
                                    (_, i) => (
                                      <option key={i} value={i}>
                                        {i === 0
                                          ? "None"
                                          : `${i} ${
                                              i === 1 ? "ticket" : "tickets"
                                            }`}
                                      </option>
                                    )
                                  )}
                                </select>
                                {categorySelection.quantity > 0 && (
                                  <span className="text-sm font-medium text-slate-600">
                                    = ₹
                                    {(
                                      category.price *
                                      categorySelection.quantity
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-red-600 font-medium">
                                Sold Out
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Total Summary */}
                      {totalTickets > 0 && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                          <div className="flex justify-between items-center text-lg font-bold text-slate-800">
                            <span>
                              Total ({totalTickets}{" "}
                              {totalTickets === 1 ? "ticket" : "tickets"})
                            </span>
                            <span>₹{totalPrice.toLocaleString()}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            Maximum 10 tickets per booking
                          </div>
                        </div>
                      )}
                    </div>
                  ) : !event.hasTicketCategories &&
                    currentUser &&
                    !showPayment ? (
                    /* Legacy seat selection for non-categorized events */
                    <div className="mb-6">
                      <label
                        htmlFor="seatCount"
                        className="block text-sm font-medium text-slate-700 mb-2"
                      >
                        Number of Seats
                      </label>
                      <div className="flex items-center gap-3">
                        <select
                          id="seatCount"
                          value={seatCount}
                          onChange={(e) => setSeatCount(Number(e.target.value))}
                          className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={availableSeats === 0}
                        >
                          {Array.from(
                            { length: Math.min(10, availableSeats) },
                            (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} {i + 1 === 1 ? "Seat" : "Seats"}
                              </option>
                            )
                          )}
                        </select>
                        <span className="text-sm text-slate-500">
                          of {availableSeats} available
                        </span>
                      </div>
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">
                            Total Price:
                          </span>
                          <span className="text-xl font-bold text-slate-800">
                            ₹{((event.price || 0) * seatCount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm text-slate-700">
                          Instant confirmation
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span className="text-sm text-slate-700">
                          Secure payment
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-600">
                            ₹
                          </span>
                        </div>
                        <span className="text-sm text-slate-700">
                          Flexible refund policy
                        </span>
                      </div>
                    </div>
                  </div>

                  {!currentUser ? (
                    <div className="space-y-3">
                      <button
                        onClick={() =>
                          navigate("/login", {
                            state: { from: location.pathname },
                          })
                        }
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Login to Book
                      </button>
                      <p className="text-center text-sm text-slate-500">
                        New here?{" "}
                        <button
                          onClick={() => navigate("/register")}
                          className="text-blue-600 font-semibold hover:text-blue-700"
                        >
                          Create an account
                        </button>
                      </p>
                    </div>
                  ) : showPayment ? (
                    <div className="space-y-4">
                      <StripeCheckout
                        amount={
                          event.hasTicketCategories
                            ? totalPrice
                            : (event.price || 0) * seatCount
                        }
                        onSuccess={async (paymentIntent) => {
                          if (event.hasTicketCategories) {
                            // Convert ticketSelections to the format expected by backend
                            const ticketItems = ticketSelections.map(
                              (selection) => {
                                const category = event.ticketCategories.find(
                                  (c) => c._id === selection.categoryId
                                );
                                const subtotal =
                                  category.price * selection.quantity;
                                return {
                                  categoryName: category.name,
                                  quantity: selection.quantity,
                                  pricePerTicket: category.price,
                                  subtotal: subtotal,
                                };
                              }
                            );

                            // Categorized booking
                            await apiClient.post("/bookings", {
                              eventId: event._id,
                              hasTicketCategories: true,
                              ticketItems: ticketItems,
                              totalQuantity: totalTickets,
                              totalAmount: totalPrice,
                              paymentIntentId: paymentIntent.id,
                            });
                          } else {
                            // Legacy booking
                            await apiClient.post("/bookings", {
                              eventId: event._id,
                              noOfSeats: seatCount,
                              paymentIntentId: paymentIntent.id,
                            });
                          }
                          handleBookingSuccess();
                        }}
                        buttonClassName="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-600 transition-all duration-300 shadow-lg"
                      />
                      <button
                        className="w-full text-slate-600 py-2 text-sm hover:text-slate-800 transition-colors"
                        onClick={() => setShowPayment(false)}
                      >
                        ← Back to booking details
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPayment(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={
                        event.hasTicketCategories
                          ? totalTickets === 0
                          : availableSeats === 0
                      }
                    >
                      {event.hasTicketCategories
                        ? totalTickets === 0
                          ? "Select Tickets"
                          : `Book ${totalTickets} ${
                              totalTickets === 1 ? "Ticket" : "Tickets"
                            } - ₹${totalPrice.toLocaleString()}`
                        : availableSeats === 0
                        ? "Sold Out"
                        : "Book Now"}
                    </button>
                  )}
                </div>
              )}

              {/* Contact Organizer Button */}
              {!isPastEvent && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowContactOrganizer(true)}
                    className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 py-3 px-4 rounded-xl border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Organizer
                  </button>
                </div>
              )}

              {/* Report Event Button */}
              {currentUser && !isPastEvent && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 py-3 px-4 rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50 transition-all duration-300 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Report Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Organizer Modal */}
        {event && (
          <ContactOrganizer
            event={event}
            isOpen={showContactOrganizer}
            onClose={() => setShowContactOrganizer(false)}
          />
        )}

        {/* Report Event Modal */}
        <ReportEventModal
          open={showReportModal}
          eventId={event._id}
          eventTitle={event.title}
          onClose={() => setShowReportModal(false)}
        />

        {/* Confirm Unregister Modal */}
        <ConfirmModal
          open={showUnregisterModal}
          title="Cancel Booking?"
          description={
            <div className="space-y-3">
              <p>
                Are you sure you want to cancel your booking for this event?
                This action cannot be undone.
              </p>

              {refundPolicy && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Refund Policy
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Time until event:</span>{" "}
                      {refundPolicy.daysUntilEvent} days
                    </p>
                    <p className={`font-semibold ${refundPolicy.refundColor}`}>
                      {refundPolicy.refundPolicy}
                    </p>
                    {refundPolicy.refundPercentage > 0 && (
                      <p className="text-green-700">
                        You will receive {refundPolicy.refundPercentage}% refund
                        (₹
                        {(
                          ((event?.price || 0) *
                            seatCount *
                            refundPolicy.refundPercentage) /
                          100
                        ).toFixed(2)}
                        )
                      </p>
                    )}
                    {refundPolicy.refundPercentage === 0 && (
                      <p className="text-red-600 font-medium">
                        No refund will be processed due to cancellation timing.
                      </p>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-600 border-t border-blue-200 pt-2">
                    <p>
                      Policy: 7+ days = 100% | 1-7 days = 50% | &lt;24 hours =
                      0%
                    </p>
                  </div>
                </div>
              )}
            </div>
          }
          onClose={() => {
            setShowUnregisterModal(false);
            setRefundPolicy(null);
          }}
          onConfirm={confirmUnregister}
          confirmText="Yes, Cancel Booking"
          cancelText="No, Keep Booking"
        />
      </div>
    </div>
  );
}
