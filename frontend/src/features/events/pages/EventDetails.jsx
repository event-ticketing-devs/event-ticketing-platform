// src/pages/EventDetailsPage.jsx
import { useEffect, useState } from "react";
import ConfirmModal from "../../../common/components/ConfirmModal";
import ReportEventModal from "../components/ReportEventModal";
import ContactOrganizer from "../components/ContactOrganizer";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { format } from "date-fns";
import { Calendar, MapPin, Tag, MessageCircle, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import StripeCheckout from "../../bookings/components/StripeCheckout";
import VenueMap from "../../venues/components/VenueMap";

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
      refundColor = refundPercentage >= 80 ? "text-success" : refundPercentage >= 50 ? "text-warning" : "text-error";
    } else if (daysUntilEvent >= 1 - epsilon) {
      refundPercentage = customRefundPolicy.oneToDays;
      refundPolicy = customRefundPolicy.description || `${refundPercentage}% refund (1-7 days before event)`;
      refundColor = refundPercentage >= 80 ? "text-success" : refundPercentage >= 50 ? "text-warning" : "text-error";
    } else {
      refundPercentage = customRefundPolicy.lessThanDay;
      refundPolicy = customRefundPolicy.description || `${refundPercentage}% refund (less than 24 hours before event)`;
      refundColor = refundPercentage >= 80 ? "text-success" : refundPercentage >= 50 ? "text-warning" : "text-error";
    }
  } else {
    // Use default refund policy
    if (daysUntilEvent >= 7 - epsilon) {
      refundPercentage = 100;
      refundPolicy = "Full refund (7+ days before event)";
      refundColor = "text-success";
    } else if (daysUntilEvent >= 1 - epsilon) {
      refundPercentage = 50;
      refundPolicy = "50% refund (1-7 days before event)";
      refundColor = "text-warning";
    } else {
      refundPercentage = 0;
      refundPolicy = "No refund (less than 24 hours before event)";
      refundColor = "text-error";
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
      toast("Please log in to book");
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
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-primary">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-xl font-medium">Loading event details...</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="bg-bg-primary border border-border p-8 max-w-md text-center rounded-lg">
          <div className="w-16 h-16 bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4 rounded-lg">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            Event Not Found
          </h3>
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => navigate("/events")}
            className="bg-primary text-bg-primary px-6 py-2.5 font-semibold hover:bg-primary/90 transition-colors rounded-lg cursor-pointer"
          >
            Browse Other Events
          </button>
        </div>
      </div>
    );

  const isPastEvent = event && new Date(event.date) < new Date();

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Image Section */}
        <div className="relative mb-8">
          {event.photo ? (
            <div className="relative h-96 overflow-hidden border border-border rounded-lg">
              <img
                src={event.photo}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Floating Status Badges */}
              <div className="absolute top-6 left-6 flex gap-3">
                {event.categoryId && (
                  <span className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-bg-primary/90 backdrop-blur-sm text-text-primary border border-border/20 rounded-lg">
                    {typeof event.categoryId === "object"
                      ? event.categoryId.name
                      : event.categoryId}
                  </span>
                )}
                {event.cancelled && (
                  <span className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-error/90 backdrop-blur-sm text-bg-primary border border-error/20 rounded-lg">
                    Cancelled
                  </span>
                )}
                {isPastEvent && !event.cancelled && (
                  <span className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-secondary/90 backdrop-blur-sm text-bg-primary border border-secondary/20 rounded-lg">
                    Past Event
                  </span>
                )}
              </div>

              {/* Price Badge */}
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center px-4 py-2 text-lg font-bold bg-primary text-bg-primary rounded-lg">
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
                    <Calendar className="w-5 h-5" />
                    <span className="text-lg font-medium">
                      {format(new Date(event.date), "PPP")} at{" "}
                      {format(new Date(event.date), "p")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-96 overflow-hidden border border-border bg-bg-secondary flex items-center justify-center rounded-lg">
              <div className="text-center">
                <Calendar className="w-24 h-24 text-text-secondary mx-auto mb-4" />
                <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-2">
                  {event.title}
                </h1>
                <div className="flex items-center justify-center gap-2 text-text-secondary">
                  <Calendar className="w-5 h-5" />
                  <span className="text-lg font-medium">
                    {format(new Date(event.date), "PPP")} at{" "}
                    {format(new Date(event.date), "p")}
                  </span>
                </div>
              </div>

              {/* Floating badges for no-image version */}
              <div className="absolute top-6 left-6 flex gap-3">
                {event.categoryId && (
                  <span className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-bg-primary border border-border text-text-primary rounded-lg">
                    {typeof event.categoryId === "object"
                      ? event.categoryId.name
                      : event.categoryId}
                  </span>
                )}
              </div>
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center px-4 py-2 text-lg font-bold bg-primary text-bg-primary rounded-lg">
                  {event.hasTicketCategories && event.ticketCategories
                    ? `₹${Math.min(
                        ...event.ticketCategories.map((c) => c.price)
                      ).toLocaleString()} onwards`
                    : `₹${event.price || 0}`}
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
            <div className="bg-bg-primary border border-border p-6 rounded-lg">
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-3">
                <div className="p-2 bg-bg-secondary border border-border rounded-lg">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                About This Event
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Date & Time Card */}
              <div className="bg-bg-primary border border-border p-5 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-bg-secondary border border-border rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Date & Time
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-text-secondary text-sm font-medium">
                    Event Date
                  </p>
                  <p className="text-text-primary font-semibold text-lg">
                    {format(new Date(event.date), "EEEE, MMMM do, yyyy")}
                  </p>
                  <p className="text-text-secondary text-sm font-medium mt-3">
                    Event Time
                  </p>
                  <p className="text-text-primary font-semibold text-lg">
                    {format(new Date(event.date), "h:mm a")}
                  </p>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-bg-primary border border-border p-5 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-bg-secondary border border-border rounded-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">Location</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-text-secondary text-sm font-medium">Venue</p>
                  <p className="text-text-primary font-semibold text-lg">
                    {event.venue?.name || event.venue}
                  </p>
                  <p className="text-text-secondary text-sm font-medium mt-3">
                    City
                  </p>
                  <p className="text-text-primary font-semibold">{event.city}</p>
                </div>
              </div>
            </div>

            {/* Event Specs Grid */}
            <div className="bg-bg-primary border border-border p-6 rounded-lg">
              <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3">
                <div className="p-2 bg-bg-secondary border border-border rounded-lg">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                Event Details
              </h2>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-bg-secondary border border-border rounded-lg">
                  <div className="text-2xl font-bold text-text-primary mb-1">
                    {event.hasTicketCategories && event.ticketCategories
                      ? event.ticketCategories.reduce(
                          (sum, cat) => sum + (cat.totalSeats || 0),
                          0
                        )
                      : event.totalSeats || 0}
                  </div>
                  <div className="text-text-secondary text-sm font-medium">
                    Total Seats
                  </div>
                </div>
                <div className="text-center p-4 bg-bg-secondary border border-border rounded-lg">
                  <div className="text-2xl font-bold text-success mb-1">
                    {event.hasTicketCategories && event.ticketCategories
                      ? event.ticketCategories.reduce(
                          (sum, cat) =>
                            sum + (cat.availableSeats || cat.totalSeats || 0),
                          0
                        )
                      : availableSeats}
                  </div>
                  <div className="text-text-secondary text-sm font-medium">
                    Available
                  </div>
                </div>
                <div className="text-center p-4 bg-bg-secondary border border-border rounded-lg">
                  <div className="text-2xl font-bold text-text-primary mb-1">
                    {event.hasTicketCategories && event.ticketCategories
                      ? `₹${Math.min(
                          ...event.ticketCategories.map((c) => c.price)
                        ).toLocaleString()}`
                      : `₹${event.price || 0}`}
                  </div>
                  <div className="text-text-secondary text-sm font-medium">
                    {event.hasTicketCategories ? "Onwards" : "Per Ticket"}
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Map Section */}
            {event.venue &&
              typeof event.venue === "object" &&
              event.venue.coordinates && (
                <div className="bg-bg-primary border border-border p-6 rounded-lg">
                  <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3">
                    <div className="p-2 bg-bg-secondary border border-border rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    Venue Location
                  </h2>
                  <div className="overflow-hidden border border-border rounded-lg">
                    <VenueMap venue={event.venue} height="250px" />
                  </div>
                </div>
              )}

            {/* Refund Policy Section */}
            {!isPastEvent && !event.cancelled && (
              <div className="bg-bg-primary border border-border p-6 rounded-lg">
                <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3">
                  <div className="p-2 bg-bg-secondary border border-border rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  Cancellation & Refund Policy
                </h2>
                <div className="bg-bg-secondary border border-border p-6 rounded-lg">
                  {event.useDefaultRefundPolicy ? (
                    /* Default Policy Display */
                    <>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-success/10 border border-success/20 p-4 text-center rounded-lg">
                          <div className="font-bold text-success text-lg mb-1">
                            7+ Days Before
                          </div>
                          <div className="text-success font-semibold">
                            100% Refund
                          </div>
                        </div>
                        <div className="bg-warning/10 border border-warning/20 p-4 text-center rounded-lg">
                          <div className="font-bold text-warning text-lg mb-1">
                            1-7 Days Before
                          </div>
                          <div className="text-warning font-semibold">
                            50% Refund
                          </div>
                        </div>
                        <div className="bg-error/10 border border-error/20 p-4 text-center rounded-lg">
                          <div className="font-bold text-error text-lg mb-1">
                            &lt;24 Hours
                          </div>
                          <div className="text-error font-semibold">
                            No Refund
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary text-center bg-bg-primary border border-border p-3 rounded-lg">
                        Refunds are processed automatically and will appear in your
                        account within 5-10 business days.
                      </p>
                    </>
                  ) : (
                    /* Custom Policy Display */
                    <>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className={`p-4 text-center border rounded-lg ${
                          event.customRefundPolicy?.sevenDaysOrMore >= 80 ? 'bg-success/10 border-success/20' :
                          event.customRefundPolicy?.sevenDaysOrMore >= 50 ? 'bg-warning/10 border-warning/20' : 'bg-error/10 border-error/20'
                        }`}>
                          <div className={`font-bold text-lg mb-1 ${
                            event.customRefundPolicy?.sevenDaysOrMore >= 80 ? 'text-success' :
                            event.customRefundPolicy?.sevenDaysOrMore >= 50 ? 'text-warning' : 'text-error'
                          }`}>
                            7+ Days Before
                          </div>
                          <div className={`font-semibold ${
                            event.customRefundPolicy?.sevenDaysOrMore >= 80 ? 'text-success' :
                            event.customRefundPolicy?.sevenDaysOrMore >= 50 ? 'text-warning' : 'text-error'
                          }`}>
                            {event.customRefundPolicy?.sevenDaysOrMore || 0}% Refund
                          </div>
                        </div>
                        <div className={`p-4 text-center border rounded-lg ${
                          event.customRefundPolicy?.oneToDays >= 80 ? 'bg-success/10 border-success/20' :
                          event.customRefundPolicy?.oneToDays >= 50 ? 'bg-warning/10 border-warning/20' : 'bg-error/10 border-error/20'
                        }`}>
                          <div className={`font-bold text-lg mb-1 ${
                            event.customRefundPolicy?.oneToDays >= 80 ? 'text-success' :
                            event.customRefundPolicy?.oneToDays >= 50 ? 'text-warning' : 'text-error'
                          }`}>
                            1-7 Days Before
                          </div>
                          <div className={`font-semibold ${
                            event.customRefundPolicy?.oneToDays >= 80 ? 'text-success' :
                            event.customRefundPolicy?.oneToDays >= 50 ? 'text-warning' : 'text-error'
                          }`}>
                            {event.customRefundPolicy?.oneToDays || 0}% Refund
                          </div>
                        </div>
                        <div className={`p-4 text-center border rounded-lg ${
                          event.customRefundPolicy?.lessThanDay >= 80 ? 'bg-success/10 border-success/20' :
                          event.customRefundPolicy?.lessThanDay >= 50 ? 'bg-warning/10 border-warning/20' : 'bg-error/10 border-error/20'
                        }`}>
                          <div className={`font-bold text-lg mb-1 ${
                            event.customRefundPolicy?.lessThanDay >= 80 ? 'text-success' :
                            event.customRefundPolicy?.lessThanDay >= 50 ? 'text-warning' : 'text-error'
                          }`}>
                            &lt;24 Hours
                          </div>
                          <div className={`font-semibold ${
                            event.customRefundPolicy?.lessThanDay >= 80 ? 'text-success' :
                            event.customRefundPolicy?.lessThanDay >= 50 ? 'text-warning' : 'text-error'
                          }`}>
                            {event.customRefundPolicy?.lessThanDay || 0}% Refund
                          </div>
                        </div>
                      </div>
                      {event.customRefundPolicy?.description && (
                        <div className="bg-bg-primary border border-border p-4 mb-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Policy Details:
                          </h4>
                          <p className="text-sm text-text-secondary">
                            {event.customRefundPolicy.description}
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-text-secondary text-center bg-bg-primary border border-border p-3 rounded-lg">
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
              <div className="bg-bg-primary border border-error/20 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <div className="p-2 bg-error/10 border border-error/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-error" />
                  </div>
                  Cancellation Notice
                </h2>
                <div className="bg-error/10 border border-error/20 p-6 rounded-lg">
                  <p className="text-error font-medium">
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
                <div className="bg-bg-primary border border-border p-6 text-center rounded-lg">
                  <div className="w-16 h-16 bg-bg-secondary border border-border flex items-center justify-center mx-auto mb-4 rounded-lg">
                    <Calendar className="w-8 h-8 text-text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    Event Ended
                  </h3>
                  <p className="text-text-secondary mb-4">
                    This event took place on{" "}
                    {format(new Date(event.date), "PPP")}
                  </p>
                  <button
                    onClick={() => navigate("/events")}
                    className="w-full bg-primary text-bg-primary py-3 px-6 font-semibold hover:bg-primary/90 transition-colors rounded-lg cursor-pointer"
                  >
                    Browse Upcoming Events
                  </button>
                </div>
              ) : event.cancelled ? (
                <div className="bg-bg-primary border border-error/20 p-6 text-center rounded-lg">
                  <div className="w-16 h-16 bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4 rounded-lg">
                    <XCircle className="w-8 h-8 text-error" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    Event Cancelled
                  </h3>
                  <p className="text-text-secondary mb-4">
                    This event has been cancelled by the organizer
                  </p>
                  <button
                    onClick={() => navigate("/events")}
                    className="w-full bg-primary text-bg-primary py-3 px-6 font-semibold hover:bg-primary/90 transition-colors rounded-lg cursor-pointer"
                  >
                    Find Other Events
                  </button>
                </div>
              ) : alreadyBooked ? (
                <div className="bg-bg-primary border border-border p-6 rounded-lg">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4 rounded-lg">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                      You're Registered!
                    </h3>
                    <p className="text-text-secondary mb-4">
                      You have successfully booked this event
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-bg-secondary border border-border p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-text-secondary">
                          Booking Status
                        </span>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-success/10 text-success border border-success/20 rounded-md">
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
                                <span className="text-text-secondary">
                                  {item.categoryName} × {item.quantity}
                                </span>
                                <span className="font-medium text-text-primary">
                                  ₹
                                  {(
                                    item.pricePerTicket * item.quantity
                                  ).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-border">
                            <span className="text-sm font-medium text-text-secondary">
                              Total Tickets
                            </span>
                            <span className="text-sm font-bold text-text-primary">
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
                          <span className="text-sm font-medium text-text-secondary">
                            Seats Booked
                          </span>
                          <span className="text-sm font-bold text-text-primary">
                            {userBooking?.noOfSeats || seatCount}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-text-secondary">
                          Total Paid
                        </span>
                        <span className="text-lg font-bold text-text-primary">
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
                      className="w-full bg-primary text-bg-primary py-3 px-6 font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 rounded-lg cursor-pointer">
                      <Tag className="w-5 h-5" />
                      View My Ticket
                    </button>

                    <button
                      onClick={handleUnregister}
                      className="w-full bg-bg-primary border-2 border-error/20 text-error py-3 px-6 font-semibold hover:bg-error/10 hover:border-error/30 transition-colors flex items-center justify-center gap-2 rounded-lg cursor-pointer">
                      <XCircle className="w-5 h-5" />
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-bg-primary border border-border p-6 rounded-lg">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-text-primary mb-1">
                      {event.hasTicketCategories && event.ticketCategories
                        ? `₹${Math.min(
                            ...event.ticketCategories.map((c) => c.price)
                          ).toLocaleString()}`
                        : `₹${event.price || 0}`}
                    </div>
                    <p className="text-text-secondary">
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
                        <h3 className="text-lg font-semibold text-text-primary">
                          Select Ticket Categories
                        </h3>
                        <div
                          className={`text-sm ${
                            totalTickets >= 8
                              ? "text-warning font-medium"
                              : "text-text-secondary"
                          }`}
                        >
                          {totalTickets}/10 tickets selected
                          {totalTickets < 10 && totalTickets >= 7 && (
                            <span className="ml-1 text-warning">
                              ({10 - totalTickets} remaining)
                            </span>
                          )}
                        </div>
                      </div>
                      {totalTickets >= 10 && (
                        <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
                          <p className="text-warning text-sm font-medium">
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
                            className="border border-border p-4 rounded-lg"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-text-primary">
                                  {category.name}
                                </h4>
                                {category.description && (
                                  <p className="text-sm text-text-secondary mt-1">
                                    {category.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-text-primary">
                                  ₹{category.price.toLocaleString()}
                                </div>
                                <div className="text-xs text-text-secondary">
                                  {categoryAvailableSeats} available
                                </div>
                              </div>
                            </div>

                            {categoryAvailableSeats > 0 ? (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-text-primary">
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
                                  className="border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary text-text-primary rounded-lg cursor-pointer"
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
                                  <span className="text-sm font-medium text-text-secondary">
                                    = ₹
                                    {(
                                      category.price *
                                      categorySelection.quantity
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-error font-medium">
                                Sold Out
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Total Summary */}
                      {totalTickets > 0 && (
                        <div className="mt-4 p-4 bg-bg-secondary border border-border rounded-lg">
                          <div className="flex justify-between items-center text-lg font-bold text-text-primary">
                            <span>
                              Total ({totalTickets}{" "}
                              {totalTickets === 1 ? "ticket" : "tickets"})
                            </span>
                            <span>₹{totalPrice.toLocaleString()}</span>
                          </div>
                          <div className="mt-2 text-xs text-text-secondary">
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
                        className="block text-sm font-medium text-text-primary mb-2"
                      >
                        Number of Seats
                      </label>
                      <div className="flex items-center gap-3">
                        <select
                          id="seatCount"
                          value={seatCount}
                          onChange={(e) => setSeatCount(Number(e.target.value))}
                          className="flex-1 border border-border px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary text-text-primary rounded-lg cursor-pointer"
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
                        <span className="text-sm text-text-secondary">
                          of {availableSeats} available
                        </span>
                      </div>
                      <div className="mt-3 p-3 bg-bg-secondary border border-border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-text-secondary">
                            Total Price:
                          </span>
                          <span className="text-xl font-bold text-text-primary">
                            ₹{((event.price || 0) * seatCount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-4 mb-6">
                    <div className="bg-bg-secondary border border-border p-4 space-y-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="text-sm text-text-primary">
                          Instant confirmation
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="text-sm text-text-primary">
                          Secure payment
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <span className="text-xs font-bold text-success">
                            ₹
                          </span>
                        </div>
                        <span className="text-sm text-text-primary">
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
                        className="w-full bg-primary text-bg-primary py-4 px-6 font-bold text-lg hover:bg-primary/90 transition-colors rounded-lg cursor-pointer"
                      >
                        Login to Book
                      </button>
                      <p className="text-center text-sm text-text-secondary">
                        New here?{" "}
                        <button
                          onClick={() => navigate("/register")}
                          className="text-primary font-semibold hover:text-primary/80 cursor-pointer"
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
                        buttonClassName="w-full bg-success text-bg-primary py-4 px-6 font-bold text-lg hover:bg-success/90 transition-colors rounded-lg cursor-pointer"
                      />
                      <button
                        className="w-full text-text-secondary py-2 text-sm hover:text-text-primary transition-colors cursor-pointer"
                        onClick={() => setShowPayment(false)}
                      >
                        ← Back to booking details
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPayment(true)}
                      className="w-full bg-primary text-bg-primary py-4 px-6 font-bold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg cursor-pointer"
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
                    className="w-full flex items-center justify-center gap-2 text-text-primary hover:text-primary py-3 px-4 border border-border hover:border-primary hover:bg-bg-secondary transition-colors text-sm font-medium rounded-lg cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact Organizer
                  </button>
                </div>
              )}

              {/* Report Event Button */}
              {currentUser && !isPastEvent && (
                <div className="mt-6 pt-6 border-t border-border">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full flex items-center justify-center gap-2 text-error hover:text-error/80 py-3 px-4 border border-error/20 hover:border-error/30 hover:bg-error/10 transition-colors text-sm font-medium rounded-lg cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4" />
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
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">
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
                      <p className="text-success">
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
                      <p className="text-error font-medium">
                        No refund will be processed due to cancellation timing.
                      </p>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-text-secondary border-t border-primary/20 pt-2">
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
