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
        setEvents(res.data);
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
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl border max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">
          Verify Ticket
        </h2>

        {!eventId && (
          <div className="mb-6">
            <label className="block mb-1 font-semibold text-slate-700">
              Select Event
            </label>
            <select
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">-- Select Event --</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Input Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode("qr")}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              inputMode === "qr"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📱 QR Scanner
          </button>
          <button
            onClick={() => setInputMode("manual")}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              inputMode === "manual"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            ⌨️ Manual Entry
          </button>
        </div>

        {/* QR Scanner Mode */}
        {inputMode === "qr" && (
          <div className="flex flex-col gap-4">
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-teal-400 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-500 transition-all flex items-center justify-center gap-2"
              onClick={startScanning}
              disabled={!selectedEvent}
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
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Start QR Scanner
            </button>
          </div>
        )}

        {/* Manual Input Mode */}
        {inputMode === "manual" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block mb-2 font-semibold text-slate-700">
                Enter Ticket ID or QR Data:
              </label>
              <textarea
                className="border rounded-lg px-3 py-2 w-full h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter ticket ID (e.g., abc123...) or paste QR code data (JSON)"
              />
            </div>
            <button
              className="w-full bg-gradient-to-r from-green-600 to-blue-400 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-500 transition-all"
              onClick={handleManualVerify}
              disabled={!selectedEvent || !manualInput.trim()}
            >
              Verify Ticket
            </button>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 rounded-lg border">
            <div
              className={`text-center text-base font-semibold mb-2 ${
                result.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.message}
            </div>
            {result.success && result.booking && (
              <div className="text-sm text-gray-600 text-center">
                <p>Ticket ID: {result.booking.ticketId}</p>
                <p>Seats: {result.booking.noOfSeats}</p>
              </div>
            )}
          </div>
        )}

        <button
          className="mt-6 w-full text-blue-500 underline hover:text-blue-700"
          onClick={() => navigate(-1)}
        >
          Back to Dashboard
        </button>
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
