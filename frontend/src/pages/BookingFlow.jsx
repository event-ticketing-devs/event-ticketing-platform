import React, { useState } from "react";
import StripeCheckout from "../components/StripeCheckout";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

export default function BookingFlow({ event, onBookingSuccess }) {
  const [step, setStep] = useState("payment");
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [loading, setLoading] = useState(false);

  const handlePaymentSuccess = async (paymentIntent) => {
    setLoading(true);
    try {
      // Create booking after successful payment
      const { data } = await apiClient.post("/bookings", {
        eventId: event._id,
        noOfSeats: selectedSeats,
        paymentIntentId: paymentIntent.id,
      });
      toast.success("Booking successful!");
      setStep("done");
      onBookingSuccess && onBookingSuccess(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="text-green-600 font-bold text-xl">Booking Confirmed!</div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Book Tickets for {event.title}</h2>
      <label className="block mb-2 font-semibold">Number of Seats</label>
      <input
        type="number"
        min={1}
        max={10}
        value={selectedSeats}
        onChange={(e) => setSelectedSeats(Number(e.target.value))}
        className="border rounded px-3 py-2 mb-4 w-full"
        disabled={loading}
      />
      <StripeCheckout
        amount={event.price * selectedSeats}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
