import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

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

  useEffect(() => {
    fetchCancelledBookings();
  }, []);

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <p className="text-blue-600 animate-pulse">
          Loading cancelled bookings...
        </p>
      </div>
    );
  }

  if (cancelledBookings.length === 0) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-blue-700">
          Cancelled Bookings
        </h1>
        <p className="text-slate-500">No cancelled bookings found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">
        Cancelled Bookings
      </h1>

      <div className="space-y-4">
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
          } = booking;

          if (!eventId) return null;

          const totalAmount = priceAtBooking * noOfSeats;
          const refundPercentage =
            refundAmount && totalAmount > 0
              ? Math.round((refundAmount / totalAmount) * 100)
              : 0;

          return (
            <div
              key={_id}
              className="bg-white border border-red-200 rounded-xl shadow-md p-6 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {eventId.title}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Event Date: {new Date(eventId.date).toLocaleString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                  {cancelledByUser ? "Cancelled by You" : "Event Cancelled"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <p>
                    <strong>Ticket ID:</strong> {ticketId}
                  </p>
                  <p>
                    <strong>Seats:</strong> {noOfSeats}
                  </p>
                  <p>
                    <strong>Original Amount:</strong> ₹{totalAmount}
                  </p>
                  <p>
                    <strong>Cancelled:</strong>{" "}
                    {new Date(cancellationDate).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Refund Information
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Status:</strong>{" "}
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
                          <strong>Refund Amount:</strong> ₹{refundAmount}
                          {refundPercentage > 0 && (
                            <span className="text-gray-600">
                              {" "}
                              ({refundPercentage}%)
                            </span>
                          )}
                        </p>
                      )}

                      {refundId && (
                        <p className="text-xs text-gray-500">
                          <strong>Refund ID:</strong> ...{refundId.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {cancellationReason && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-sm">
                    <strong>Reason:</strong> {cancellationReason}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {refundId && (
                  <button
                    onClick={() => checkRefundStatus(_id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                  >
                    Check Refund Status
                  </button>
                )}

                {refundStatus === "failed" && (
                  <a
                    href="mailto:support@eventtickets.com?subject=Refund Issue"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
                  >
                    Contact Support
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
