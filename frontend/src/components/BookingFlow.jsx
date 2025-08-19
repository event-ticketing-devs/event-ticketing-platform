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
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
            <p className="text-green-100">Your tickets have been successfully booked</p>
          </div>
          
          {/* Success Details */}
          <div className="p-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2-2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-green-800">{event.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Seats:</span>
                  <span className="text-green-800 font-bold ml-2">{selectedSeats}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Total:</span>
                  <span className="text-green-800 font-bold ml-2">₹{(event.price * selectedSeats).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-slate-600 text-sm">
                A confirmation email has been sent to your registered email address.
              </p>
              <p className="text-slate-500 text-xs">
                You can view your ticket details in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2-2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Book Tickets</h2>
              <p className="text-blue-100 text-sm">{event.title}</p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="p-6 space-y-6">
          {/* Event Summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Event Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Event:</span>
                <span className="text-slate-800 font-medium">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Price per ticket:</span>
                <span className="text-slate-800 font-medium">₹{event.price?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Seat Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Number of Seats
            </label>
            <div className="relative">
              <select
                value={selectedSeats}
                onChange={(e) => setSelectedSeats(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i + 1 === 1 ? "Seat" : "Seats"}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Calculation */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-blue-700 font-medium">Total Amount</span>
                <p className="text-blue-600 text-sm">{selectedSeats} × ₹{event.price?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-800">
                  ₹{(event.price * selectedSeats).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Payment Details</h3>
            </div>
            
            <StripeCheckout
              amount={event.price * selectedSeats}
              onSuccess={handlePaymentSuccess}
            />
          </div>

          {/* Security Note */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-700 text-sm font-medium">Secure Transaction</p>
                <p className="text-slate-600 text-xs mt-1">
                  Your payment information is encrypted and secure. You'll receive a confirmation email once your booking is complete.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
