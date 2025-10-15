import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import QRScanner from "../components/QRScanner";
import toast from "react-hot-toast";

export default function OrganizerVerify() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(eventId || "");
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [inputMode, setInputMode] = useState("qr"); // "qr" or "manual"

  useEffect(() => {
    if (!eventId) {
      apiClient.get("/events").then((res) => {
        // Handle both old and new API response formats
        const eventsData = res.data.events || res.data;
        setEvents(eventsData);
      });
    }
  }, [eventId]);

  const handleQRScan = async (qrData) => {
    setResult(null);
    setShowScanner(false);
    setIsScanning(false);

    if (!selectedEvent) {
      toast.error("Please select an event first.");
      return;
    }

    try {
      const res = await apiClient.post("/bookings/verify", {
        qrData,
        eventId: selectedEvent,
      });

      setResult({
        success: true,
        message: res.data.message,
        booking: res.data.booking,
      });
      toast.success("Ticket verified successfully!");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Error verifying ticket";
      setResult({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  const handleScanError = (error) => {
    console.error("QR Scan Error:", error);
    toast.error("Error scanning QR code. Please try again.");
  };

  const startScanning = () => {
    if (!selectedEvent) {
      toast.error("Please select an event first.");
      return;
    }
    setShowScanner(true);
    setIsScanning(true);
    setResult(null);
  };

  const handleManualVerify = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event first.");
      return;
    }

    if (!manualInput.trim()) {
      toast.error("Please enter QR data or ticket ID.");
      return;
    }

    try {
      let qrData = manualInput.trim();

      // Check if input looks like JSON (QR data) or just a ticket ID
      if (!qrData.startsWith("{")) {
        // If it's just a ticket ID, create the expected QR data format
        qrData = JSON.stringify({
          ticketId: qrData,
          eventId: selectedEvent,
          timestamp: Date.now(),
        });
      }

      const res = await apiClient.post("/bookings/verify", {
        qrData,
        eventId: selectedEvent,
      });

      setResult({
        success: true,
        message: res.data.message,
        booking: res.data.booking,
      });
      toast.success("Ticket verified successfully!");
      setManualInput("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Error verifying ticket";
      setResult({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-2">Ticket Verification</h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Verify attendee tickets quickly and securely using QR code
              scanning or manual entry
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-white/50 backdrop-blur-sm overflow-hidden">
          {/* Event Selection */}
          {!eventId && (
            <div className="p-8 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
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
                <h3 className="text-xl font-bold text-slate-800">
                  Select Event
                </h3>
              </div>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 font-medium appearance-none"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  <option value="">
                    Choose an event to verify tickets for...
                  </option>
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
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
            </div>
          )}

          {/* Input Mode Toggle */}
          <div className="p-8 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Verification Method
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setInputMode("qr")}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 border-2 ${
                  inputMode === "qr"
                    ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white border-transparent shadow-lg"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <span>QR Scanner</span>
                </div>
              </button>
              <button
                onClick={() => setInputMode("manual")}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 border-2 ${
                  inputMode === "manual"
                    ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white border-transparent shadow-lg"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Manual Entry</span>
                </div>
              </button>
            </div>
          </div>

          {/* QR Scanner Mode */}
          {inputMode === "qr" && (
            <div className="p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-100 to-teal-100 rounded-2xl mb-6">
                  <svg
                    className="w-10 h-10 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-slate-800 mb-2">
                  QR Code Scanner
                </h4>
                <p className="text-slate-600 mb-6">
                  Point your camera at the attendee's QR code to verify their
                  ticket instantly
                </p>
                <button
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  onClick={startScanning}
                  disabled={!selectedEvent}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Start QR Scanner
                </button>
                {!selectedEvent && (
                  <p className="text-amber-600 text-sm mt-3 flex items-center justify-center gap-2">
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    Please select an event first
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Manual Input Mode */}
          {inputMode === "manual" && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-slate-800">
                    Manual Entry
                  </h4>
                  <p className="text-slate-600 text-sm">
                    Enter ticket ID or paste QR code data
                  </p>
                </div>
              </div>

              <div className="relative mb-6">
                <textarea
                  className="w-full px-4 py-4 pl-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 resize-none"
                  rows="4"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter ticket ID (e.g., abc123...) or paste QR code data (JSON format)"
                />
                <div className="absolute left-4 top-4">
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
                      d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 012 2M9 7a2 2 0 00-2 2m0 0a2 2 0 00-2 2m2-2a2 2 0 012 2m-2-2a2 2 0 00-2 2"
                    />
                  </svg>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3"
                onClick={handleManualVerify}
                disabled={!selectedEvent || !manualInput.trim()}
              >
                <svg
                  className="w-5 h-5"
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
                Verify Ticket
              </button>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="p-8 border-t border-slate-100">
              <div
                className={`p-6 rounded-2xl border-2 ${
                  result.success
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      result.success
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {result.success ? (
                      <svg
                        className="w-6 h-6"
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
                    ) : (
                      <svg
                        className="w-6 h-6"
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
                    )}
                  </div>
                  <div>
                    <h5
                      className={`text-lg font-semibold ${
                        result.success ? "text-emerald-800" : "text-red-800"
                      }`}
                    >
                      {result.success
                        ? "Verification Successful"
                        : "Verification Failed"}
                    </h5>
                    <p
                      className={`text-sm ${
                        result.success ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>

                {result.success && result.booking && (
                  <div className="bg-white rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Ticket ID:
                      </span>
                      <span className="text-slate-800 font-mono bg-slate-100 px-3 py-1 rounded-lg">
                        {result.booking.ticketId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Number of Seats:
                      </span>
                      <span className="text-slate-800 font-semibold">
                        {result.booking.noOfSeats}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 text-center">
            <button
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
              onClick={() => navigate(-1)}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onError={handleScanError}
          isScanning={isScanning}
          onClose={() => {
            setShowScanner(false);
            setIsScanning(false);
          }}
        />
      )}
    </div>
  );
}
