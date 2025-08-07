// src/pages/EventDetailsPage.jsx
import { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
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
 * @returns {Object} Refund policy information
 */
const calculateRefundPolicy = (eventDate) => {
  const currentDate = new Date();
  const timeUntilEvent = eventDate - currentDate;
  const daysUntilEvent = timeUntilEvent / (1000 * 60 * 60 * 24);

  let refundPercentage = 0;
  let refundPolicy = "";
  let refundColor = "";

  // Use small epsilon to handle floating point precision issues
  const epsilon = 0.001; // About 1.4 minutes

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

  return {
    daysUntilEvent: daysUntilEvent.toFixed(1),
    refundPercentage,
    refundPolicy,
    refundColor,
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
  const [availableSeats, setAvailableSeats] = useState(0);
  const [seatCount, setSeatCount] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState(null);

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
      if (currentUser) {
        // For all users, check if they have an active booking for this event
        try {
          const userBookingsRes = await apiClient.get("/bookings/user");
          const activeBooking = userBookingsRes.data.find(
            (b) =>
              b.eventId &&
              b.eventId._id === id &&
              !b.cancelledByUser &&
              !b.cancelledByEvent
          );
          alreadyBooked = !!activeBooking;
          bookingId = activeBooking ? activeBooking._id : null;
        } catch {}
      }

      setAvailableSeats(remainingSeats);
      setAlreadyBooked(alreadyBooked);
      setUserBookingId(bookingId);
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
    const policy = calculateRefundPolicy(new Date(event.date));
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
      <p className="text-center py-10 text-blue-600 font-semibold">
        Loading...
      </p>
    );
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  const isPastEvent = event && new Date(event.date) < new Date();

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {event.photo && (
        <img
          src={event.photo}
          alt={event.title}
          className="w-full max-h-80 object-cover rounded-xl mb-4 border shadow"
        />
      )}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-blue-700 flex-1">
            {event.title}
          </h1>
          {event.categoryId && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              {typeof event.categoryId === "object"
                ? event.categoryId.name
                : event.categoryId}
            </span>
          )}
          {event.cancelled && (
            <span className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded">
              Cancelled
            </span>
          )}
        </div>
        <p className="text-slate-600 mb-2">
          {format(new Date(event.date), "PPpp")}
        </p>
        {isPastEvent && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded font-semibold">
            This event has ended.
          </div>
        )}
        <p className="mb-4 text-slate-700">{event.description}</p>
        <div className="flex flex-wrap gap-4 mb-2 text-sm">
          <span className="font-medium">Venue:</span>
          <span>{event.venue?.name || event.venue}</span>
          <span className="font-medium">City:</span>
          <span>{event.city}</span>
          <span className="font-medium">Total Seats:</span>{" "}
          <span>{event.totalSeats}</span>
          <span className="font-medium">Price:</span>{" "}
          <span>₹{event.price}</span>
        </div>

        {/* Venue Location Section */}
        {event.venue &&
          typeof event.venue === "object" &&
          event.venue.coordinates && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                📍 Venue Location
              </h3>
              <VenueMap venue={event.venue} height="250px" />
            </div>
          )}

        <p className="mb-2">
          Available Seats:{" "}
          <span className="font-semibold">{availableSeats}</span>
        </p>
        {event.cancelled && event.cancelledReason && (
          <p className="mb-2 text-red-600 font-semibold">
            Reason: {event.cancelledReason}
          </p>
        )}

        {/* Refund Policy Information */}
        {!isPastEvent && !event.cancelled && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold mb-3 text-blue-800 flex items-center">
              💰 Cancellation & Refund Policy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-green-100 rounded p-3 text-center">
                <div className="font-semibold text-green-700">
                  7+ Days Before
                </div>
                <div className="text-green-600">100% Refund</div>
              </div>
              <div className="bg-yellow-100 rounded p-3 text-center">
                <div className="font-semibold text-yellow-700">
                  1-7 Days Before
                </div>
                <div className="text-yellow-600">50% Refund</div>
              </div>
              <div className="bg-red-100 rounded p-3 text-center">
                <div className="font-semibold text-red-700">&lt;24 Hours</div>
                <div className="text-red-600">No Refund</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 text-center">
              Refunds are processed automatically and will appear in your
              account within 5-10 business days.
            </p>
          </div>
        )}

        {/* Hide booking controls if event is past */}
        {!isPastEvent && currentUser && !alreadyBooked && !showPayment && (
          <div className="mb-4 flex items-center gap-4">
            <label htmlFor="seatCount" className="font-medium">
              Number of Seats:
            </label>
            <input
              id="seatCount"
              type="number"
              min={1}
              max={Math.min(10, availableSeats)}
              value={seatCount}
              onChange={(e) =>
                setSeatCount(Math.max(1, Math.min(10, Number(e.target.value))))
              }
              className="border p-2 rounded w-20 focus:ring-2 focus:ring-blue-400"
              disabled={availableSeats === 0}
            />
            <span className="ml-2 text-slate-500">
              (max {Math.min(10, availableSeats)})
            </span>
          </div>
        )}
        {!isPastEvent && currentUser && !alreadyBooked && !showPayment && (
          <p className="mb-4 font-semibold">
            Total Price: ₹{event.price * seatCount}
          </p>
        )}
        <div className="flex gap-4 mt-4">
          {/* Hide all booking/unregister buttons if event is past */}
          {!isPastEvent && (
            <>
              {!currentUser ? (
                <button
                  className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-6 py-2 rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all font-semibold cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                  Login to Book
                </button>
              ) : alreadyBooked ? (
                <button
                  onClick={handleUnregister}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-lg shadow hover:from-red-600 hover:to-pink-600 transition-all font-semibold cursor-pointer"
                >
                  Unregister
                </button>
              ) : showPayment ? (
                <div className="w-full">
                  <StripeCheckout
                    amount={event.price * seatCount}
                    onSuccess={async (paymentIntent) => {
                      await apiClient.post("/bookings", {
                        eventId: event._id,
                        noOfSeats: seatCount,
                        paymentIntentId: paymentIntent.id,
                      });
                      handleBookingSuccess();
                    }}
                  />
                  <button
                    className="mt-4 text-blue-500 underline"
                    onClick={() => setShowPayment(false)}
                  >
                    Cancel Payment
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPayment(true)}
                  className="bg-gradient-to-r from-green-500 to-teal-400 text-white px-6 py-2 rounded-lg shadow hover:from-green-600 hover:to-teal-500 transition-all font-semibold cursor-pointer"
                  disabled={availableSeats === 0}
                >
                  Book Now
                </button>
              )}
            </>
          )}
        </div>
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
