import React, { useState, useEffect } from "react";
import StripeCheckout from "../components/StripeCheckout";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

export default function BookingFlow({ event, onBookingSuccess }) {
  const [step, setStep] = useState("loading");
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [ticketItems, setTicketItems] = useState([]);
  const [seatInfo, setSeatInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSeatInfo();
  }, [event._id]);

  const fetchSeatInfo = async () => {
    try {
      const { data } = await apiClient.get(`/events/${event._id}/seats`);
      setSeatInfo(data);

      if (data.hasTicketCategories) {
        // Initialize ticket items for categorized events
        setTicketItems(
          data.ticketCategories.map((category) => ({
            categoryName: category.name,
            quantity: 0,
            pricePerTicket: category.price,
            maxAvailable: category.remainingSeats,
            description: category.description,
          }))
        );
      }
      setStep("selection");
    } catch (error) {
      toast.error("Failed to load event information");
      console.error(error);
    }
  };

  const handleTicketQuantityChange = (categoryName, quantity) => {
    setTicketItems((prev) =>
      prev.map((item) =>
        item.categoryName === categoryName
          ? {
              ...item,
              quantity: Math.max(0, Math.min(quantity, item.maxAvailable)),
            }
          : item
      )
    );
  };

  const getTotalAmount = () => {
    if (seatInfo?.hasTicketCategories) {
      return ticketItems.reduce(
        (total, item) => total + item.quantity * item.pricePerTicket,
        0
      );
    } else {
      return event.price * selectedSeats;
    }
  };

  const getTotalQuantity = () => {
    if (seatInfo?.hasTicketCategories) {
      return ticketItems.reduce((total, item) => total + item.quantity, 0);
    } else {
      return selectedSeats;
    }
  };

  const getSelectedItems = () => {
    return ticketItems.filter((item) => item.quantity > 0);
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      setLoading(true);

      const bookingData = {
        eventId: event._id,
        totalAmount: getTotalAmount(),
        paymentIntentId,
      };

      // Add appropriate booking data based on event type
      if (seatInfo?.hasTicketCategories) {
        // Send ticketItems for categorized events
        bookingData.ticketItems = getSelectedItems();
        bookingData.totalQuantity = getTotalQuantity();
        bookingData.hasTicketCategories = true;
      } else {
        // Send legacy noOfSeats for simple events
        bookingData.noOfSeats = selectedSeats;
        bookingData.hasTicketCategories = false;
      }

      const response = await apiClient.post("/bookings", bookingData);

      if (response.data.status === "success") {
        setBookingSuccess(true);
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "loading") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full animate-spin mx-auto mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <p className="text-slate-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    const selectedItems = getSelectedItems();
    const totalAmount = getTotalAmount();
    const totalQuantity = getTotalQuantity();

    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-green-100">
              Your tickets have been successfully booked
            </p>
          </div>

          {/* Success Details */}
          <div className="p-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2-2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-green-800">
                  {event.title}
                </h3>
              </div>

              {seatInfo?.hasTicketCategories ? (
                <div className="space-y-3">
                  <h4 className="text-green-700 font-medium">Your Tickets:</h4>
                  {selectedItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-1"
                    >
                      <span className="text-green-800">
                        {item.quantity}x {item.categoryName}
                      </span>
                      <span className="text-green-800 font-bold">
                        ₹
                        {(item.quantity * item.pricePerTicket).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-green-200 pt-2 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Total:</span>
                      <span className="text-green-800 font-bold text-lg">
                        ₹{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700 font-medium">Seats:</span>
                    <span className="text-green-800 font-bold ml-2">
                      {selectedSeats}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Total:</span>
                    <span className="text-green-800 font-bold ml-2">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-y-3">
              <p className="text-slate-600 text-sm">
                A confirmation email has been sent to your registered email
                address.
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
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2-2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5z"
                />
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
                <span className="text-slate-800 font-medium">
                  {event.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span className="text-slate-800 font-medium">
                  {new Date(event.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Venue:</span>
                <span className="text-slate-800 font-medium">
                  {event.venue?.name || event.venue}
                </span>
              </div>
              {!seatInfo?.hasTicketCategories && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Price per ticket:</span>
                  <span className="text-slate-800 font-medium">
                    ₹{event.price?.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Selection */}
          {seatInfo?.hasTicketCategories ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">
                  Select Tickets
                </h3>
                <span className="text-sm text-slate-500">
                  {seatInfo.remainingSeats} seats available
                </span>
              </div>

              <div className="space-y-3">
                {seatInfo.ticketCategories.map((category, index) => (
                  <div
                    key={index}
                    className={`border border-slate-200 rounded-xl p-4 transition-all duration-200 ${
                      category.remainingSeats === 0
                        ? "bg-slate-50 opacity-60"
                        : "bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {category.name}
                        </h4>
                        {category.description && (
                          <p className="text-sm text-slate-600">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-lg font-bold text-blue-600">
                            ₹{category.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-slate-500">
                            {category.remainingSeats} left
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const currentItem = ticketItems.find(
                              (item) => item.categoryName === category.name
                            );
                            handleTicketQuantityChange(
                              category.name,
                              Math.max(0, currentItem.quantity - 1)
                            );
                          }}
                          disabled={
                            category.remainingSeats === 0 ||
                            (ticketItems.find(
                              (item) => item.categoryName === category.name
                            )?.quantity || 0) === 0
                          }
                          className="w-8 h-8 border border-slate-300 rounded-lg flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 text-slate-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 12H4"
                            />
                          </svg>
                        </button>

                        <span className="w-8 text-center font-medium text-slate-800">
                          {ticketItems.find(
                            (item) => item.categoryName === category.name
                          )?.quantity || 0}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const currentItem = ticketItems.find(
                              (item) => item.categoryName === category.name
                            );
                            handleTicketQuantityChange(
                              category.name,
                              currentItem.quantity + 1
                            );
                          }}
                          disabled={
                            category.remainingSeats === 0 ||
                            (ticketItems.find(
                              (item) => item.categoryName === category.name
                            )?.quantity || 0) >= category.remainingSeats
                          }
                          className="w-8 h-8 border border-slate-300 rounded-lg flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 text-slate-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {category.remainingSeats === 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                        <span className="text-red-600 text-sm font-medium">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
                  {Array.from(
                    { length: Math.min(10, seatInfo?.remainingSeats || 10) },
                    (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i + 1 === 1 ? "Seat" : "Seats"}
                      </option>
                    )
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                {seatInfo?.remainingSeats} seats available
              </p>
            </div>
          )}

          {/* Total Calculation */}
          {getTotalQuantity() > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-blue-700 font-medium">
                    Total Amount
                  </span>
                  {seatInfo?.hasTicketCategories ? (
                    <div className="text-blue-600 text-sm space-y-1">
                      {getSelectedItems().map((item, index) => (
                        <div key={index}>
                          {item.quantity}x {item.categoryName} × ₹
                          {item.pricePerTicket.toLocaleString()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-600 text-sm">
                      {selectedSeats} × ₹{event.price?.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-800">
                    ₹{getTotalAmount().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Section */}
          {getTotalQuantity() > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Payment Details
                </h3>
              </div>

              <StripeCheckout
                amount={getTotalAmount()}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          )}

          {/* No Selection Message */}
          {getTotalQuantity() === 0 && (
            <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2-2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Select Your Tickets
              </h3>
              <p className="text-slate-600 text-sm">
                {seatInfo?.hasTicketCategories
                  ? "Choose the number of tickets for each category you'd like to book."
                  : "Select the number of seats you'd like to book."}
              </p>
            </div>
          )}

          {/* Security Note */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-slate-700 text-sm font-medium">
                  Secure Transaction
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Your payment information is encrypted and secure. You'll
                  receive a confirmation email once your booking is complete.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
