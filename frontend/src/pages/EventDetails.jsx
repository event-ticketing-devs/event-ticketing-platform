// src/pages/EventDetailsPage.jsx
import { useEffect, useState } from "react";
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

  const fetchEvent = async () => {
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
      toast("Please log in to book a seat", { icon: "🔒" });
      return navigate("/login");
    }

    toast
      .promise(apiClient.post("/bookings", { eventId: id, noOfSeats: 1 }), {
        loading: "Booking seat...",
        success: "Booking successful!",
        error: (err) => err.response?.data?.message || "Booking failed",
      })
      .then(fetchEvent);
  };

  const handleUnregister = async () => {
    if (!userBookingId) return toast.error("No booking found");
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

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
      <p className="text-gray-600 mb-2">
        {format(new Date(event.date), "PPpp")}
      </p>
      <p className="mb-4">{event.description}</p>
      <p className="mb-2">Price: ₹{event.price}</p>
      <p className="mb-4">Available Seats: {availableSeats}</p>

      {!currentUser ? (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleBooking}
        >
          Login to Book
        </button>
      ) : alreadyBooked ? (
        <button
          onClick={handleUnregister}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Unregister
        </button>
      ) : (
        <button
          onClick={handleBooking}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Book Now
        </button>
      )}
    </div>
  );
}
