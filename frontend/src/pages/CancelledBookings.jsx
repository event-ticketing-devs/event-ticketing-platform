import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { XCircle, Calendar, MapPin, Ticket, Info, CheckCircle2, LayoutDashboard, RotateCcw, Mail } from 'lucide-react';

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
        return "bg-success/10 text-success border-success/20";
      case "failed":
        return "bg-error/10 text-error border-error/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-bg-secondary text-text-secondary border-border";
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
      <div className="min-h-screen bg-bg-primary py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-bg-primary border border-border rounded-lg p-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  Loading cancelled bookings...
                </h2>
                <p className="text-text-secondary">
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
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Section */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Cancelled Bookings</h1>
            <p className="mt-1 text-text-secondary">
              View and manage your cancelled event bookings
            </p>
          </div>
        </div>

        <div>
          {cancelledBookings.length > 0 && (
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-warning/10 border border-warning/20 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    {cancelledBookings.length} cancelled booking
                    {cancelledBookings.length !== 1 ? "s" : ""} found
                  </p>
                  <p className="text-sm text-text-secondary">
                    Track refund status and view cancellation details for your
                    bookings
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {cancelledBookings.length === 0 ? (
          <div className="bg-bg-primary border border-border rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-bg-secondary border border-border rounded-lg flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              No Cancelled Bookings
            </h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              You haven't cancelled any bookings yet. All your active bookings
              can be found in your dashboard.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-primary text-bg-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
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
                  className="bg-bg-primary border-2 border-border rounded-lg p-8 hover:border-primary/30 transition-colors"
                >
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-bg-secondary border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-8 h-8 text-text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-bold text-text-primary mb-2">
                            {eventId.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(eventId.date), "PPP 'at' p")}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {eventId.city}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span
                        className={`px-4 py-2 text-sm font-semibold border rounded-lg ${
                          cancelledByUser
                            ? "bg-error/10 text-error border-error/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        }`}
                      >
                        {cancelledByUser
                          ? "Cancelled by You"
                          : "Event Cancelled"}
                      </span>
                      <span
                        className={`px-4 py-2 text-sm font-semibold border rounded-lg ${getRefundStatusColor(
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
                    <div className="bg-bg-secondary border border-border rounded-lg p-6">
                      <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-primary" />
                        Booking Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-text-secondary">Ticket ID</p>
                          <p className="font-semibold text-text-primary font-mono">
                            {ticketId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">
                            {hasTicketCategories
                              ? "Tickets Booked"
                              : "Number of Seats"}
                          </p>
                          {hasTicketCategories && ticketItems ? (
                            <div className="space-y-2">
                              {ticketItems.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center bg-bg-primary px-3 py-2 border border-border rounded-lg"
                                >
                                  <span className="text-text-secondary font-medium">
                                    {item.categoryName}
                                  </span>
                                  <span className="text-text-primary font-semibold">
                                    {item.quantity} ticket
                                    {item.quantity !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center bg-primary/10 px-3 py-2 border border-primary/20 rounded-lg">
                                <span className="text-primary font-semibold">
                                  Total
                                </span>
                                <span className="text-primary font-bold">
                                  {totalQuantity} ticket
                                  {totalQuantity !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="font-semibold text-text-primary">
                              {noOfSeats}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">
                            Original Amount
                          </p>
                          <p className="font-semibold text-text-primary">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cancellation Details */}
                    <div className="bg-bg-secondary border border-border rounded-lg p-6">
                      <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-error" />
                        Cancellation Info
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-text-secondary">Cancelled On</p>
                          <p className="font-semibold text-text-primary">
                            {format(new Date(cancellationDate), "PPP 'at' p")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">Cancelled By</p>
                          <p className="font-semibold text-text-primary">
                            {cancelledByUser ? "You" : "Event Organizer"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Refund Details */}
                    <div className="bg-bg-secondary border border-border rounded-lg p-6">
                      <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 text-success font-bold text-lg flex items-center justify-center">
                          ₹
                        </span>
                        Refund Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-text-secondary">Status</p>
                          <p
                            className={`font-semibold ${
                              refundStatus === "processed"
                                ? "text-success"
                                : refundStatus === "failed"
                                ? "text-error"
                                : refundStatus === "pending"
                                ? "text-warning"
                                : "text-text-secondary"
                            }`}
                          >
                            {getRefundStatusText(refundStatus)}
                          </p>
                        </div>
                        {refundAmount !== undefined && (
                          <div>
                            <p className="text-sm text-text-secondary">
                              Refund Amount
                            </p>
                            <p className="font-semibold text-text-primary">
                              {formatCurrency(refundAmount)}
                              {refundPercentage > 0 && (
                                <span className="text-sm text-text-secondary ml-1">
                                  ({refundPercentage}%)
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        {refundId && (
                          <div>
                            <p className="text-sm text-text-secondary">Refund ID</p>
                            <p className="font-mono text-sm text-text-primary">
                              ...{refundId.slice(-8)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Reason */}
                  {cancellationReason && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Cancellation Reason
                      </h4>
                      <p className="text-primary/80">{cancellationReason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {refundId && (
                      <button
                        onClick={() => checkRefundStatus(_id)}
                        className="flex items-center gap-2 bg-primary text-bg-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Check Refund Status
                      </button>
                    )}

                    {refundStatus === "failed" && (
                      <a
                        href="mailto:support@eventtickets.com?subject=Refund Issue"
                        className="flex items-center gap-2 bg-error text-bg-primary px-6 py-3 rounded-lg font-semibold hover:bg-error/90 transition-colors cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
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
