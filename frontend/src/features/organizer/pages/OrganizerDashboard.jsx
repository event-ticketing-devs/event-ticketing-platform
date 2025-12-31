import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmModal from "../../../common/components/ConfirmModal";
import EventDetailsModal from "../../events/components/EventDetailsModal";
import CoOrganizerModal from "../components/CoOrganizerModal";
import VerifierModal from "../components/VerifierModal";
import { format } from "date-fns";
import { Calendar, MapPin, Eye, Pencil, UserPlus, CheckCircle2, XCircle, LayoutDashboard, Mail, Plus, Clock, Shield } from "lucide-react";

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
  const [showCoOrganizerModal, setShowCoOrganizerModal] = useState(false);
  const [showVerifierModal, setShowVerifierModal] = useState(false);
  const [coOrganizerEventId, setCoOrganizerEventId] = useState(null);
  const [coOrganizerEventTitle, setCoOrganizerEventTitle] = useState("");
  const [verifierEventId, setVerifierEventId] = useState(null);
  const [verifierEventTitle, setVerifierEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch all events and filter client-side for main organizer + co-organizer + verifier events
      const res = await apiClient.get('/events?sortBy=date&sortOrder=asc&limit=100');
      
      // Handle both old and new API response formats
      const allEvents = res.data.events || res.data;
      
      // Filter events where user is main organizer OR co-organizer OR verifier
      const myEvents = allEvents.filter((event) => {
        const organizerId = event.organizerId?._id || event.organizerId;
        const isMainOrganizer = organizerId === currentUser?._id;
        
        // Check if user is a co-organizer
        const isCoOrganizer = event.coOrganizers?.some(
          coOrgId => {
            const id = coOrgId._id || coOrgId;
            return id === currentUser?._id;
          }
        );
        
        // Check if user is a verifier
        const isVerifier = event.verifiers?.some(
          verifierId => {
            const id = verifierId._id || verifierId;
            return id === currentUser?._id;
          }
        );
        
        return isMainOrganizer || isCoOrganizer || isVerifier;
      });
      
      setEvents(myEvents);
    } catch (err) {
      toast.error("Failed to fetch events");
      setEvents([]);
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

      // Handle both old and new API response formats
      const bookings = res.data.bookings || res.data;

      // Calculate total booked seats for both legacy and categorized events
      let totalBooked = 0;
      if (event.hasTicketCategories) {
        // For categorized events, sum up totalQuantity from categorized bookings
        totalBooked = bookings.reduce((sum, booking) => {
          if (booking.hasTicketCategories && booking.totalQuantity) {
            return sum + booking.totalQuantity;
          } else if (!booking.hasTicketCategories && booking.noOfSeats) {
            return sum + booking.noOfSeats;
          }
          return sum;
        }, 0);
      } else {
        // For legacy events, sum up noOfSeats
        totalBooked = bookings.reduce(
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
        totalBooked,
      });
      setAttendees(bookings);
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching attendees:", err);
      toast.error("Failed to fetch attendees");
    }
  };

  const handleManageCoOrganizers = (event) => {
    // Check if current user is the main organizer
    const organizerId = event.organizerId?._id || event.organizerId;
    if (organizerId !== currentUser?._id) {
      toast.error("Only the main organizer can manage co-organizers");
      return;
    }
    
    setCoOrganizerEventId(event._id);
    setCoOrganizerEventTitle(event.title);
    setShowCoOrganizerModal(true);
  };

  const handleManageVerifiers = (event) => {
    setVerifierEventId(event._id);
    setVerifierEventTitle(event.title);
    setShowVerifierModal(true);
  };

  // Helper functions to determine user role for an event
  const isMainOrganizer = (event) => {
    const organizerId = event.organizerId?._id || event.organizerId;
    return organizerId === currentUser?._id;
  };

  const isCoOrganizer = (event) => {
    return event.coOrganizers?.some(
      coOrgId => {
        const id = coOrgId._id || coOrgId;
        return id === currentUser?._id;
      }
    );
  };

  const isVerifierOnly = (event) => {
    const verifier = event.verifiers?.some(
      verifierId => {
        const id = verifierId._id || verifierId;
        return id === currentUser?._id;
      }
    );
    // User is verifier only if they are a verifier but NOT organizer or co-organizer
    return verifier && !isMainOrganizer(event) && !isCoOrganizer(event);
  };

  // Split events into upcoming, past, and cancelled
  const now = new Date();
  const upcomingEvents = events.filter((event) => !event.cancelled && new Date(event.date) >= now);
  const pastEvents = events.filter((event) => !event.cancelled && new Date(event.date) < now);
  const cancelledEvents = events.filter((event) => event.cancelled);

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
    if (currentUser?._id) {
      fetchEvents();
    }
  }, [currentUser?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="bg-bg-primary border border-border p-8 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-b-2 border-primary rounded-full border-t-transparent animate-spin"></div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Loading your events...
              </h2>
              <p className="text-text-secondary">
                Please wait while we fetch your event data
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-bg-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Organizer Dashboard
                </h1>
                <p className="text-text-secondary">
                  Manage your events and track attendees
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/organizer/contacts")}
                className="inline-flex items-center gap-2 bg-bg-primary border border-border text-text-primary px-4 sm:px-6 py-2 sm:py-3 font-medium hover:bg-bg-secondary transition-colors rounded-lg cursor-pointer text-sm sm:text-base"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                Messages
              </button>
              <button
                onClick={() => navigate("/events/create")}
                className="inline-flex items-center gap-2 bg-primary text-bg-primary px-4 sm:px-6 py-2 sm:py-3 font-semibold hover:bg-primary/90 transition-colors rounded-lg cursor-pointer text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Create New Event
              </button>
            </div>
          </div>

          {/* Stats - keeping existing stats cards */}
          {/* Tabs */}
          <div className="bg-bg-primary border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-xl font-semibold text-text-primary">My Events</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                    activeTab === "upcoming"
                      ? "bg-primary text-bg-primary"
                      : "bg-bg-secondary text-text-primary hover:bg-border"
                  }`}
                >
                  Upcoming ({upcomingEvents.length})
                </button>
                <button
                  onClick={() => setActiveTab("past")}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                    activeTab === "past"
                      ? "bg-primary text-bg-primary"
                      : "bg-bg-secondary text-text-primary hover:bg-border"
                  }`}
                >
                  Past ({pastEvents.length})
                </button>
                <button
                  onClick={() => setActiveTab("cancelled")}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                    activeTab === "cancelled"
                      ? "bg-primary text-bg-primary"
                      : "bg-bg-secondary text-text-primary hover:bg-border"
                  }`}
                >
                  Cancelled ({cancelledEvents.length})
                </button>
              </div>
            </div>

            {/* Events Content */}
            {activeTab === "upcoming" ? (
              upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-bg-secondary border border-border flex items-center justify-center mx-auto mb-4 rounded-lg">
                      <Calendar className="w-10 h-10 text-text-secondary" />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      No Upcoming Events
                    </h3>
                    <p className="text-text-secondary mb-6">
                      You haven't created any upcoming events yet. Start by
                      creating your first event!
                    </p>
                    <button
                      onClick={() => navigate("/events/create")}
                      className="bg-primary text-bg-primary px-6 py-3 font-semibold hover:bg-primary/90 transition-colors rounded-lg cursor-pointer"
                    >
                      Create Your First Event
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event._id}
                        className={`bg-bg-secondary border border-border p-6 transition-colors rounded-lg ${
                          event.cancelled
                            ? "opacity-60"
                            : "hover:border-primary"
                        }`}
                      >
                        {/* Event Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-text-primary mb-2">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                              <Calendar className="w-4 h-4" />
                              {formatEventDate(event.date)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <MapPin className="w-4 h-4" />
                              {event.city}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {event.categoryId && (
                              <span className="px-3 py-1 text-xs bg-primary/10 text-primary border border-primary/20 font-semibold rounded-md">
                                {typeof event.categoryId === "object"
                                  ? event.categoryId.name
                                  : event.categoryId}
                              </span>
                            )}
                            {event.cancelled && (
                              <span className="px-3 py-1 text-xs bg-error/10 text-error border border-error/20 font-semibold rounded-md">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-bg-primary border border-border p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Price</p>
                            <p className="font-semibold text-text-primary">
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
                          <div className="bg-bg-primary border border-border p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">
                              Total Seats
                            </p>
                            <p className="font-semibold text-text-primary">
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
                          {/* Show full actions for main organizer and co-organizers */}
                          {!isVerifierOnly(event) && (
                            <>
                              <button
                                onClick={() =>
                                  navigate(`/events/edit/${event._id}`)
                                }
                                disabled={event.cancelled}
                                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors rounded-lg ${
                                  event.cancelled
                                    ? "bg-bg-secondary text-text-secondary cursor-not-allowed"
                                    : "bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20 cursor-pointer"
                                }`}
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </button>

                              {!event.cancelled && (
                                <button
                                  onClick={() => handleDelete(event._id, false)}
                                  className="flex items-center gap-1 px-3 py-2 bg-error/10 text-error border border-error/20 text-sm font-semibold hover:bg-error/20 transition-colors rounded-lg cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Cancel
                                </button>
                              )}
                            </>
                          )}

                          {/* Show Details button for everyone */}
                          <button
                            onClick={() => viewDetails(event)}
                            className="flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/20 transition-colors rounded-lg cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            Details
                          </button>

                          <Link
                            to={`/events/verify/${event._id}`}
                            className="flex items-center gap-1 px-3 py-2 bg-success/10 text-success border border-success/20 text-sm font-semibold hover:bg-success/20 transition-colors rounded-lg cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Verify
                          </Link>

                          {/* Co-Organizers Button - Only for main organizer */}
                          {!isVerifierOnly(event) && isMainOrganizer(event) && (
                            <button
                              onClick={() => handleManageCoOrganizers(event)}
                              className="flex items-center gap-1 px-3 py-2 bg-secondary/10 text-secondary border border-secondary/20 text-sm font-semibold hover:bg-secondary/20 transition-colors rounded-lg cursor-pointer"
                            >
                              <UserPlus className="w-4 h-4" />
                              Co-Organizers
                            </button>
                          )}

                          {/* Verifiers Button - For main organizer and co-organizers only */}
                          {!isVerifierOnly(event) && (
                            <button
                              onClick={() => handleManageVerifiers(event)}
                              className="flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/20 transition-colors rounded-lg cursor-pointer"
                            >
                              <Shield className="w-4 h-4" />
                              Verifiers
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === "past" ? (
                pastEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-bg-secondary border border-border flex items-center justify-center mx-auto mb-4 rounded-lg">
                    <Clock className="w-10 h-10 text-text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    No Past Events
                  </h3>
                  <p className="text-text-secondary">
                    You don't have any completed events yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pastEvents.map((event) => (
                    <div
                      key={event._id}
                      className={`bg-bg-secondary border border-border p-6 transition-colors rounded-lg ${
                        event.cancelled
                          ? "opacity-60"
                          : "hover:border-primary"
                      }`}
                    >
                      {/* Event Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-text-primary mb-2">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <Calendar className="w-4 h-4" />
                            {formatEventDate(event.date)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <MapPin className="w-4 h-4" />
                            {event.city}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {event.categoryId && (
                            <span className="px-3 py-1 text-xs bg-primary/10 text-primary border border-primary/20 font-semibold rounded-md">
                              {typeof event.categoryId === "object"
                                ? event.categoryId.name
                                : event.categoryId}
                            </span>
                          )}
                          {event.cancelled && (
                            <span className="px-3 py-1 text-xs bg-error/10 text-error border border-error/20 font-semibold rounded-md">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-bg-primary border border-border p-3 rounded-lg">
                          <p className="text-xs text-text-secondary mb-1">
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
                                    className="text-xs font-medium text-text-primary"
                                  >
                                    {category.name}:{" "}
                                    {formatCurrency(category.price)}
                                  </p>
                                ))}
                              {event.ticketCategories.length > 2 && (
                                <p className="text-xs text-text-secondary">
                                  +{event.ticketCategories.length - 2} more
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="font-semibold text-text-primary">
                              {formatCurrency(event.price || 0)}
                            </p>
                          )}
                        </div>
                        <div className="bg-bg-primary border border-border p-3 rounded-lg">
                          <p className="text-xs text-text-secondary mb-1">
                            Total Seats
                          </p>
                          <p className="font-semibold text-text-primary">
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
                          className="flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/20 transition-colors rounded-lg cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>

                        <Link
                          to={`/organizer/verify/${event._id}`}
                          className="flex items-center gap-1 px-3 py-2 bg-success/10 text-success border border-success/20 text-sm font-semibold hover:bg-success/20 transition-colors rounded-lg cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Verify Tickets
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === "cancelled" ? (
              cancelledEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-bg-secondary border border-border flex items-center justify-center mx-auto mb-4 rounded-lg">
                    <XCircle className="w-10 h-10 text-text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    No Cancelled Events
                  </h3>
                  <p className="text-text-secondary">
                    You don't have any cancelled events.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {cancelledEvents.map((event) => (
                    <div
                      key={event._id}
                      className="bg-bg-secondary border border-border p-6 transition-colors rounded-lg opacity-75"
                    >
                      {/* Event Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-text-primary mb-2">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                            <Calendar className="w-4 h-4" />
                            {formatEventDate(event.date)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <MapPin className="w-4 h-4" />
                            {event.city}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {event.categoryId && (
                            <span className="px-3 py-1 text-xs bg-primary/10 text-primary border border-primary/20 font-semibold rounded-md">
                              {typeof event.categoryId === "object"
                                ? event.categoryId.name
                                : event.categoryId}
                            </span>
                          )}
                          <span className="px-3 py-1 text-xs bg-error/10 text-error border border-error/20 font-semibold rounded-md">
                            Cancelled
                          </span>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-bg-primary border border-border p-3 rounded-lg">
                          <p className="text-xs text-text-secondary mb-1">
                            {event.hasTicketCategories ? "Pricing" : "Price"}
                          </p>
                          {event.hasTicketCategories && event.ticketCategories ? (
                            <div className="space-y-1">
                              {event.ticketCategories.slice(0, 2).map((category, index) => (
                                <p
                                  key={index}
                                  className="text-xs font-medium text-text-primary"
                                >
                                  {category.name}: {formatCurrency(category.price)}
                                </p>
                              ))}
                              {event.ticketCategories.length > 2 && (
                                <p className="text-xs text-text-secondary">
                                  +{event.ticketCategories.length - 2} more
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="font-semibold text-text-primary">
                              {formatCurrency(event.price || 0)}
                            </p>
                          )}
                        </div>
                        <div className="bg-bg-primary border border-border p-3 rounded-lg">
                          <p className="text-xs text-text-secondary mb-1">
                            Total Seats
                          </p>
                          <p className="font-semibold text-text-primary">
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
                          className="flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/20 transition-colors rounded-lg cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : null}
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
      <CoOrganizerModal
        isOpen={showCoOrganizerModal}
        onClose={() => {
          setShowCoOrganizerModal(false);
          setCoOrganizerEventId(null);
          setCoOrganizerEventTitle("");
        }}
        eventId={coOrganizerEventId}
        eventTitle={coOrganizerEventTitle}
      />
      <VerifierModal
        isOpen={showVerifierModal}
        onClose={() => {
          setShowVerifierModal(false);
          setVerifierEventId(null);
          setVerifierEventTitle("");
        }}
        eventId={verifierEventId}
        eventTitle={verifierEventTitle}
      />
    </div>
  );
}
