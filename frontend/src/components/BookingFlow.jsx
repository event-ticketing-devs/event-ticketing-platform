import React, { useState } from "react";
import StripeCheckout from "../components/StripeCheckout";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { Ticket, Check, ChevronDown, Lock } from 'lucide-react';

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
        <div className="bg-bg-primary rounded-lg shadow-xl border border-border overflow-hidden">
          {/* Success Header */}
          <div className="bg-success px-6 py-8 text-center rounded-t-lg">
            <div className="w-16 h-16 bg-bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-bg-primary" />
            </div>
            <h2 className="text-2xl font-bold text-bg-primary mb-2">Booking Confirmed!</h2>
            <p className="text-bg-primary/80">Your tickets have been successfully booked</p>
          </div>
          
          {/* Success Details */}
          <div className="p-6">
            <div className="bg-success/10 rounded-lg p-4 border border-success/20 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-success" />
                </div>
                <h3 className="text-lg font-bold text-success">{event.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-primary font-medium">Seats:</span>
                  <span className="text-text-primary font-bold ml-2">{selectedSeats}</span>
                </div>
                <div>
                  <span className="text-text-primary font-medium">Total:</span>
                  <span className="text-text-primary font-bold ml-2">₹{(event.price * selectedSeats).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-text-secondary text-sm">
                A confirmation email has been sent to your registered email address.
              </p>
              <p className="text-text-secondary text-xs">
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
      <div className="bg-bg-primary rounded-lg shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-bg-primary/20 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-bg-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-bg-primary">Book Tickets</h2>
              <p className="text-bg-primary/80 text-sm">{event.title}</p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="p-6 space-y-6">
          {/* Event Summary */}
          <div className="bg-bg-secondary rounded-lg p-4 border border-border">
            <h3 className="font-semibold text-text-primary mb-3">Event Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Event:</span>
                <span className="text-text-primary font-medium">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Price per ticket:</span>
                <span className="text-text-primary font-medium">₹{event.price?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Seat Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-primary">
              Number of Seats
            </label>
            <div className="relative">
              <select
                value={selectedSeats}
                onChange={(e) => setSelectedSeats(Number(e.target.value))}
                className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary text-text-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i + 1 === 1 ? "Seat" : "Seats"}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              </div>
            </div>
          </div>

          {/* Total Calculation */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-primary font-medium">Total Amount</span>
                <p className="text-primary/70 text-sm">{selectedSeats} × ₹{event.price?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ₹{(event.price * selectedSeats).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-bold text-text-primary">Payment Details</h3>
            </div>
            
            <StripeCheckout
              amount={event.price * selectedSeats}
              onSuccess={handlePaymentSuccess}
            />
          </div>

          {/* Security Note */}
          <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="w-3 h-3 text-secondary" />
              </div>
              <div>
                <p className="text-text-primary text-sm font-medium">Secure Transaction</p>
                <p className="text-text-secondary text-xs mt-1">
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
