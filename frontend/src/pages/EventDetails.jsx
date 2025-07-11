// src/pages/EventDetailsPage.jsx
import { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";

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
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);

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
        // For all users, check if they have a booking for this event
        try {
          const userBookingsRes = await apiClient.get("/bookings/user");
          const userBooking = userBookingsRes.data.find(
            (b) => b.eventId && b.eventId._id === id
          );
          alreadyBooked = !!userBooking;
          bookingId = userBooking ? userBooking._id : null;
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
    setShowUnregisterModal(true);
  };

  const confirmUnregister = async () => {
    setShowUnregisterModal(false);
    try {
      toast
        .promise(apiClient.delete(`/bookings/${userBookingId}`), {
          loading: "Cancelling booking...",
          success: "Booking cancelled",
          error: (err) => err.response?.data?.message || "Unregister failed",
        })
        .then(fetchEvent);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unregister failed");
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
          <span className="font-medium">Venue:</span> <span>{event.venue}</span>
          <span className="font-medium">Total Seats:</span>{" "}
          <span>{event.totalSeats}</span>
          <span className="font-medium">Price:</span>{" "}
          <span>₹{event.price}</span>
        </div>
        <p className="mb-2">
          Available Seats:{" "}
          <span className="font-semibold">{availableSeats}</span>
        </p>
        {event.cancelled && event.cancelledReason && (
          <p className="mb-2 text-red-600 font-semibold">
            Reason: {event.cancelledReason}
          </p>
        )}
        {/* Hide booking controls if event is past */}
        {!isPastEvent && currentUser && !alreadyBooked && (
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
        {!isPastEvent && currentUser && !alreadyBooked && (
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
                  onClick={handleBooking}
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
              ) : (
                <button
                  onClick={handleBooking}
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
          description="Are you sure you want to cancel your booking for this event? This action cannot be undone."
          onClose={() => setShowUnregisterModal(false)}
          onConfirm={confirmUnregister}
          confirmText="Yes, Cancel"
          cancelText="No, Keep Booking"
        />
      </div>
    </div>
  );
}
