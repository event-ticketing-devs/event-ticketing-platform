import React from "react";
import { format } from "date-fns";

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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/50">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-2xl" />
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-slate-800 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
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
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Badges */}
          <div className="mb-6">
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <h2 className="text-2xl font-bold text-slate-800 flex-1 min-w-0">
                {event.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {event.categoryId && (
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-semibold">
                    {typeof event.categoryId === "object"
                      ? event.categoryId.name
                      : event.categoryId}
                  </span>
                )}
                {event.cancelled && (
                  <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full font-semibold">
                    Cancelled
                  </span>
                )}
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
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
                  <div>
                    <p className="text-sm text-slate-600">Event Date</p>
                    <p className="font-semibold text-slate-800">
                      {formatEventDate(event.date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">₹</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">
                      {event.hasTicketCategories
                        ? "Ticket Pricing"
                        : "Ticket Price"}
                    </p>
                    {event.hasTicketCategories && event.ticketCategories ? (
                      <div className="space-y-1">
                        {event.ticketCategories.map((category, index) => (
                          <p
                            key={index}
                            className="text-sm font-medium text-slate-800"
                          >
                            {category.name}: {formatCurrency(category.price)}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(event.price)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Capacity</p>
                    <p className="font-semibold text-slate-800">
                      {totalSeats} seats
                    </p>
                  </div>
                </div>
              </div>

              {event.city && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-purple-600"
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
                    <div>
                      <p className="text-sm text-slate-600">Location</p>
                      <p className="font-semibold text-slate-800">
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
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-slate-600"
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
                  Event Description
                </h3>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-slate-700 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Cancellation Reason */}
            {event.cancelled && event.cancelledReason && (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <h3 className="font-semibold text-red-800">
                      Event Cancelled
                    </h3>
                  </div>
                  <p className="text-red-700">{event.cancelledReason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Booking Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-slate-600"
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
              Booking Statistics
            </h3>

            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {bookedSeats}
                        </p>
                        <p className="text-sm text-slate-600">
                          Active Bookings
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {availableSeats}
                        </p>
                        <p className="text-sm text-slate-600">
                          Available Seats
                        </p>
                      </div>
                    </div>
                    {cancelledSeats > 0 && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {cancelledSeats}
                          </p>
                          <p className="text-sm text-slate-600">
                            Cancelled Seats
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">
                          {totalSeats}
                        </p>
                        <p className="text-sm text-slate-600">Total Capacity</p>
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
                        stroke="url(#gradient)"
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - bookedStroke}
                        strokeLinecap="round"
                        style={{
                          transition: "stroke-dashoffset 0.8s ease-in-out",
                        }}
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#0d9488" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-800">
                          {totalSeats ? `${percentBooked}%` : "N/A"}
                        </div>
                        <div className="text-xs text-slate-600">Booked</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {availableSeats === 0 && totalSeats > 0 && (
                <div className="mt-4 bg-red-100 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span className="font-semibold text-red-800">
                      Event Sold Out!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attendees List */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              Event Attendees
              <span className="text-sm font-normal text-slate-600">
                (
                {bookedSeats || 0}{" "}
                active
                {cancelledSeats > 0 &&
                  `, ${cancelledSeats} cancelled`}
                )
              </span>
            </h3>

            <div className="bg-slate-50 rounded-xl border border-slate-200">
              {attendees && attendees.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium">No attendees yet</p>
                  <p className="text-sm text-slate-500">
                    Attendees will appear here once bookings are made
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <div className="divide-y divide-slate-200">
                    {attendees?.map((booking) => {
                      const { _id, userId, noOfSeats, cancelled } = booking;
                      return (
                        <div
                          key={_id}
                          className={`p-4 hover:bg-white transition-colors ${
                            cancelled ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  cancelled
                                    ? "bg-red-100 border-2 border-red-300"
                                    : "bg-gradient-to-r from-blue-600 to-teal-500"
                                }`}
                              >
                                {cancelled ? (
                                  <svg
                                    className="w-5 h-5 text-red-600"
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
                                ) : (
                                  <span className="text-white font-semibold text-sm">
                                    {userId.name?.charAt(0)?.toUpperCase() ||
                                      "U"}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p
                                  className={`font-semibold ${
                                    cancelled
                                      ? "text-slate-600 line-through"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {userId.name}
                                </p>
                                <p
                                  className={`text-sm ${
                                    cancelled
                                      ? "text-slate-500"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {userId.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  cancelled
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
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
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
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
