import { format } from "date-fns";
import { X, Calendar, MapPin, Users, FileText, BarChart3, UserCheck, AlertTriangle } from 'lucide-react';

export default function EventDetailsModal({ open, event, attendees, onClose }) {
  if (!open || !event) return null;

  // Use pre-calculated values from organizer dashboard if available, otherwise calculate
  let totalSeats, actualBookedSeats;

  // Use totalSeats from event object (pre-calculated in organizer dashboard)
  totalSeats = event.totalSeats || 0;

  // Use totalBooked from event object if available (pre-calculated in organizer dashboard)
  if (event.totalBooked !== undefined) {
    actualBookedSeats = event.totalBooked;
  } else {
    // Fallback: Calculate from attendees if not pre-calculated
    if (event.hasTicketCategories && event.ticketCategories) {
      // For categorized events
      totalSeats = event.ticketCategories.reduce(
        (sum, cat) => sum + cat.totalSeats,
        0
      );

      // Calculate actual booked seats from non-cancelled attendees
      actualBookedSeats = attendees
        ? attendees
            .filter((booking) => !booking.cancelled) // Only count non-cancelled bookings
            .reduce((sum, booking) => {
              if (booking.hasTicketCategories && booking.totalQuantity) {
                return sum + booking.totalQuantity;
              } else if (!booking.hasTicketCategories && booking.noOfSeats) {
                return sum + booking.noOfSeats;
              }
              return sum;
            }, 0)
        : 0;
    } else {
      // For legacy events
      totalSeats = typeof event.totalSeats === "number" ? event.totalSeats : 0;

      // Calculate actual booked seats from non-cancelled attendees
      actualBookedSeats = attendees
        ? attendees
            .filter((booking) => !booking.cancelled) // Only count non-cancelled bookings
            .reduce((sum, booking) => sum + (booking.noOfSeats || 0), 0)
        : 0;
    }
  }

  const availableSeats = totalSeats - actualBookedSeats;
  const bookedSeats = actualBookedSeats;
  const percentBooked = totalSeats
    ? Math.round((bookedSeats / totalSeats) * 100)
    : 0;

  // Count cancelled bookings for additional statistics
  const cancelledBookings = attendees
    ? attendees.filter((booking) => booking.cancelled)
    : [];
  const cancelledSeats = cancelledBookings.reduce((sum, booking) => {
    if (booking.hasTicketCategories && booking.totalQuantity) {
      return sum + booking.totalQuantity;
    } else {
      return sum + (booking.noOfSeats || 0);
    }
  }, 0);

  // Donut chart parameters
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const bookedStroke = circumference * (bookedSeats / totalSeats || 0);

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

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg-primary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          {event.photo && (
            <div className="relative">
              <img
                src={event.photo}
                alt={event.title}
                className="w-full h-48 object-cover rounded-t-2xl"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-black/30 rounded-t-2xl" />
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-bg-primary/90 text-text-secondary hover:text-text-primary hover:bg-bg-primary rounded-lg flex items-center justify-center transition-colors cursor-pointer border border-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Badges */}
          <div className="mb-6">
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <h2 className="text-2xl font-bold text-text-primary flex-1 min-w-0">
                {event.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {event.categoryId && (
                  <span className="px-3 py-1 text-sm bg-primary/10 text-primary border border-primary/20 rounded-lg font-semibold">
                    {typeof event.categoryId === "object"
                      ? event.categoryId.name
                      : event.categoryId}
                  </span>
                )}
                {event.cancelled && (
                  <span className="px-3 py-1 text-sm bg-error/10 text-error border border-error/20 rounded-lg font-semibold">
                    Cancelled
                  </span>
                )}
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-bg-secondary border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Event Date</p>
                    <p className="font-semibold text-text-primary">
                      {formatEventDate(event.date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 border border-success/20 rounded-lg flex items-center justify-center">
                    <span className="text-success font-bold text-lg">₹</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary">
                      {event.hasTicketCategories
                        ? "Ticket Pricing"
                        : "Ticket Price"}
                    </p>
                    {event.hasTicketCategories && event.ticketCategories ? (
                      <div className="space-y-1">
                        {event.ticketCategories.map((category, index) => (
                          <p
                            key={index}
                            className="text-sm font-medium text-text-primary"
                          >
                            {category.name}: {formatCurrency(category.price)}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(event.price)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 border border-secondary/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Total Capacity</p>
                    <p className="font-semibold text-text-primary">
                      {totalSeats} seats
                    </p>
                  </div>
                </div>
              </div>

              {event.city && (
                <div className="bg-bg-secondary border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Location</p>
                      <p className="font-semibold text-text-primary">
                        {event.city}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-text-secondary" />
                  Event Description
                </h3>
                <div className="bg-bg-secondary border border-border rounded-lg p-4">
                  <p className="text-text-primary leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Cancellation Reason */}
            {event.cancelled && event.cancelledReason && (
              <div className="mb-6">
                <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-error" />
                    <h3 className="font-semibold text-error">
                      Event Cancelled
                    </h3>
                  </div>
                  <p className="text-text-primary">{event.cancelledReason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Booking Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-text-secondary" />
              Booking Statistics
            </h3>

            <div className="bg-bg-secondary border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-bg-primary border border-border rounded-lg p-4 shadow-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {bookedSeats}
                        </p>
                        <p className="text-sm text-text-secondary">
                          Active Bookings
                        </p>
                      </div>
                    </div>
                    <div className="bg-bg-primary border border-border rounded-lg p-4 shadow-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-success">
                          {availableSeats}
                        </p>
                        <p className="text-sm text-text-secondary">
                          Available Seats
                        </p>
                      </div>
                    </div>
                    {cancelledSeats > 0 && (
                      <div className="bg-bg-primary border border-border rounded-lg p-4 shadow-sm">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-error">
                            {cancelledSeats}
                          </p>
                          <p className="text-sm text-text-secondary">
                            Cancelled Seats
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="bg-bg-primary border border-border rounded-lg p-4 shadow-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-text-primary">
                          {totalSeats}
                        </p>
                        <p className="text-sm text-text-secondary">Total Capacity</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex-shrink-0">
                  <div className="relative">
                    <svg
                      width={radius * 2}
                      height={radius * 2}
                      className="transform -rotate-90"
                    >
                      <circle
                        cx={radius}
                        cy={radius}
                        r={normalizedRadius}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth={stroke}
                      />
                      <circle
                        cx={radius}
                        cy={radius}
                        r={normalizedRadius}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - bookedStroke}
                        strokeLinecap="round"
                        style={{
                          transition: "stroke-dashoffset 0.8s ease-in-out",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-text-primary">
                          {totalSeats ? `${percentBooked}%` : "N/A"}
                        </div>
                        <div className="text-xs text-text-secondary">Booked</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {availableSeats === 0 && totalSeats > 0 && (
                <div className="mt-4 bg-error/10 border border-error/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-error" />
                    <span className="font-semibold text-error">
                      Event Sold Out!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attendees List */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-text-secondary" />
              Event Attendees
              <span className="text-sm font-normal text-text-secondary">
                (
                {bookedSeats || 0}{" "}
                active
                {cancelledSeats > 0 &&
                  `, ${cancelledSeats} cancelled`}
                )
              </span>
            </h3>

            <div className="bg-bg-secondary border border-border rounded-lg">
              {attendees && attendees.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4 border border-border">
                    <UserCheck className="w-8 h-8 text-text-secondary" />
                  </div>
                  <p className="text-text-primary font-medium">No attendees yet</p>
                  <p className="text-sm text-text-secondary">
                    Attendees will appear here once bookings are made
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <div className="divide-y divide-border">
                    {attendees?.map((booking) => {
                      const { _id, userId, noOfSeats, cancelled } = booking;
                      return (
                        <div
                          key={_id}
                          className={`p-4 hover:bg-bg-primary transition-colors ${
                            cancelled ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  cancelled
                                    ? "bg-error/10 border-2 border-error/20"
                                    : "bg-primary"
                                }`}
                              >
                                {cancelled ? (
                                  <X className="w-5 h-5 text-error" />
                                ) : (
                                  <span className="text-bg-primary font-semibold text-sm">
                                    {userId.name?.charAt(0)?.toUpperCase() ||
                                      "U"}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p
                                  className={`font-semibold ${
                                    cancelled
                                      ? "text-text-secondary line-through"
                                      : "text-text-primary"
                                  }`}
                                >
                                  {userId.name}
                                </p>
                                <p
                                  className={`text-sm ${
                                    cancelled
                                      ? "text-text-secondary/70"
                                      : "text-text-secondary"
                                  }`}
                                >
                                  {userId.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div
                                className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                                  cancelled
                                    ? "bg-error/10 text-error border border-error/20"
                                    : "bg-primary/10 text-primary border border-primary/20"
                                }`}
                              >
                                {booking.hasTicketCategories &&
                                booking.ticketItems ? (
                                  <div className="text-xs space-y-1">
                                    {booking.ticketItems.map((item, index) => (
                                      <div key={index}>
                                        {item.quantity}x {item.categoryName}
                                      </div>
                                    ))}
                                    <div className="font-semibold">
                                      Total: {booking.totalQuantity} tickets
                                    </div>
                                  </div>
                                ) : (
                                  `${noOfSeats} seat${
                                    noOfSeats !== 1 ? "s" : ""
                                  }`
                                )}
                              </div>
                              {cancelled && (
                                <span className="px-2 py-1 bg-error/10 text-error border border-error/20 rounded-md text-xs font-semibold">
                                  Cancelled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) || []}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
