import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function CancelledBookings() {
  const [cancelledBookings, setCancelledBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCancelledBookings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/bookings/user/cancelled");
      setCancelledBookings(res.data);
    } catch (err) {
      toast.error("Failed to fetch cancelled bookings");
      console.error(err);
    }
    setLoading(false);
  };

  const checkRefundStatus = async (bookingId) => {
    try {
      const res = await apiClient.get(`/bookings/${bookingId}/refund-status`);
      const { status, amount, refundId } = res.data;

      toast.success(
        `Refund Status: ${status === "succeeded" ? "Completed" : status} ${
          amount ? `- ₹${amount}` : ""
        } ${refundId ? `(ID: ${refundId.slice(-8)})` : ""}`,
        { duration: 5000 }
      );
    } catch (err) {
      toast.error("Failed to fetch refund status");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getRefundStatusColor = (status) => {
    switch (status) {
      case "processed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getRefundStatusText = (status) => {
    switch (status) {
      case "processed":
        return "Refund Processed";
      case "failed":
        return "Refund Failed";
      case "pending":
        return "Processing Refund";
      case "none":
        return "No Refund";
      default:
        return "Unknown Status";
    }
  };

  useEffect(() => {
    fetchCancelledBookings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white border border-slate-200 p-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent animate-spin"></div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Loading cancelled bookings...
                </h2>
                <p className="text-slate-600">
                  Please wait while we fetch your data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Cancelled Bookings
              </h1>
              <p className="text-slate-600">
                View and manage your cancelled event bookings
              </p>
            </div>
          </div>

          {cancelledBookings.length > 0 && (
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 border border-orange-200 flex items-center justify-center">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {cancelledBookings.length} cancelled booking
                    {cancelledBookings.length !== 1 ? "s" : ""} found
                  </p>
                  <p className="text-sm text-slate-600">
                    Track refund status and view cancellation details for your
                    bookings
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {cancelledBookings.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-6">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              No Cancelled Bookings
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              You haven't cancelled any bookings yet. All your active bookings
              can be found in your dashboard.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-800 transition-colors"
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              View Active Bookings
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {cancelledBookings.map((booking) => {
              const {
                _id,
                eventId,
                noOfSeats,
                ticketId,
                cancelledByUser,
                cancelledByEvent,
                cancellationDate,
                cancellationReason,
                refundStatus,
                refundAmount,
                refundId,
                priceAtBooking,
                hasTicketCategories,
                ticketItems,
                totalQuantity,
                totalAmount: bookingTotalAmount,
              } = booking;

              if (!eventId) return null;

              // Calculate total amount based on booking type
              const totalAmount =
                hasTicketCategories && bookingTotalAmount
                  ? bookingTotalAmount
                  : priceAtBooking * noOfSeats;

              const refundPercentage =
                refundAmount && totalAmount > 0
                  ? Math.round((refundAmount / totalAmount) * 100)
                  : 0;

              return (
                <div
                  key={_id}
                  className="bg-white border-2 border-slate-200 p-8 hover:border-slate-300 transition-colors"
                >
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-8 h-8 text-slate-600"
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
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            {eventId.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
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
                              {format(new Date(eventId.date), "PPP 'at' p")}
                            </div>
                            <div className="flex items-center gap-1">
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
                              {eventId.location}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span
                        className={`px-4 py-2 text-sm font-semibold border ${
                          cancelledByUser
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                        }`}
                      >
                        {cancelledByUser
                          ? "Cancelled by You"
                          : "Event Cancelled"}
                      </span>
                      <span
                        className={`px-4 py-2 text-sm font-semibold border ${getRefundStatusColor(
                          refundStatus
                        )}`}
                      >
                        {getRefundStatusText(refundStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Booking Details */}
                    <div className="bg-slate-50 border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-slate-900"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                          />
                        </svg>
                        Booking Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600">Ticket ID</p>
                          <p className="font-semibold text-slate-800 font-mono">
                            {ticketId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">
                            {hasTicketCategories
                              ? "Tickets Booked"
                              : "Number of Seats"}
                          </p>
                          {hasTicketCategories && ticketItems ? (
                            <div className="space-y-2">
                              {ticketItems.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center bg-slate-100 px-3 py-2 border border-slate-200"
                                >
                                  <span className="text-slate-700 font-medium">
                                    {item.categoryName}
                                  </span>
                                  <span className="text-slate-800 font-semibold">
                                    {item.quantity} ticket
                                    {item.quantity !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center bg-blue-100 px-3 py-2 border border-blue-200">
                                <span className="text-blue-700 font-semibold">
                                  Total
                                </span>
                                <span className="text-blue-800 font-bold">
                                  {totalQuantity} ticket
                                  {totalQuantity !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="font-semibold text-slate-800">
                              {noOfSeats}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">
                            Original Amount
                          </p>
                          <p className="font-semibold text-slate-800">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cancellation Details */}
                    <div className="bg-slate-50 border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
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
                        Cancellation Info
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600">Cancelled On</p>
                          <p className="font-semibold text-slate-800">
                            {format(new Date(cancellationDate), "PPP 'at' p")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Cancelled By</p>
                          <p className="font-semibold text-slate-800">
                            {cancelledByUser ? "You" : "Event Organizer"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Refund Details */}
                    <div className="bg-slate-50 border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 text-green-600 font-bold text-lg flex items-center justify-center">
                          ₹
                        </span>
                        Refund Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600">Status</p>
                          <p
                            className={`font-semibold ${
                              refundStatus === "processed"
                                ? "text-green-600"
                                : refundStatus === "failed"
                                ? "text-red-600"
                                : refundStatus === "pending"
                                ? "text-yellow-600"
                                : "text-slate-600"
                            }`}
                          >
                            {getRefundStatusText(refundStatus)}
                          </p>
                        </div>
                        {refundAmount !== undefined && (
                          <div>
                            <p className="text-sm text-slate-600">
                              Refund Amount
                            </p>
                            <p className="font-semibold text-slate-800">
                              {formatCurrency(refundAmount)}
                              {refundPercentage > 0 && (
                                <span className="text-sm text-slate-600 ml-1">
                                  ({refundPercentage}%)
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        {refundId && (
                          <div>
                            <p className="text-sm text-slate-600">Refund ID</p>
                            <p className="font-mono text-sm text-slate-800">
                              ...{refundId.slice(-8)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Reason */}
                  {cancellationReason && (
                    <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
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
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Cancellation Reason
                      </h4>
                      <p className="text-blue-700">{cancellationReason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {refundId && (
                      <button
                        onClick={() => checkRefundStatus(_id)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-800 transition-colors"
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Check Refund Status
                      </button>
                    )}

                    {refundStatus === "failed" && (
                      <a
                        href="mailto:support@eventtickets.com?subject=Refund Issue"
                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 font-semibold hover:bg-red-700 transition-colors"
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
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Contact Support
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
