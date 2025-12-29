import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import QRScanner from "../components/QRScanner";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { QrCode, CheckCircle2, XCircle, AlertCircle, Calendar, Ticket, Camera, ArrowLeft, Shield, ChevronDown, Edit, Check } from 'lucide-react';

export default function OrganizerVerify() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(eventId || "");
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [inputMode, setInputMode] = useState("qr"); // "qr" or "manual"

  useEffect(() => {
    if (!eventId) {
      apiClient.get("/events?sortBy=date&sortOrder=asc&limit=100").then((res) => {
        // Handle both old and new API response formats
        const allEvents = res.data.events || res.data;
        
        // Filter events where user is organizer, co-organizer, or verifier
        const myEvents = allEvents.filter((event) => {
          const organizerId = event.organizerId?._id || event.organizerId;
          const isMainOrganizer = organizerId === currentUser?._id;
          
          const isCoOrganizer = event.coOrganizers?.some(
            coOrgId => {
              const id = coOrgId._id || coOrgId;
              return id === currentUser?._id;
            }
          );
          
          const isVerifier = event.verifiers?.some(
            verifierId => {
              const id = verifierId._id || verifierId;
              return id === currentUser?._id;
            }
          );
          
          return isMainOrganizer || isCoOrganizer || isVerifier;
        });
        
        setEvents(myEvents);
      });
    }
  }, [eventId, currentUser]);

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
    <div className="min-h-screen bg-bg-primary">
      {/* Header Section */}
      <div className="bg-primary text-bg-primary py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/80 border border-bg-primary/30 mb-4 rounded-lg">
              <Shield className="w-8 h-8 text-bg-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Ticket Verification</h1>
            <p className="text-bg-primary/80 text-lg max-w-2xl mx-auto">
              Verify attendee tickets quickly and securely using QR code
              scanning or manual entry
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-bg-primary border-2 border-border overflow-hidden rounded-lg">
          {/* Event Selection */}
          {!eventId && (
            <div className="p-8 border-b border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary border border-border flex items-center justify-center rounded-lg">
                  <Calendar className="w-5 h-5 text-bg-primary" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">
                  Select Event
                </h3>
              </div>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 pl-12 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary text-text-primary font-medium appearance-none rounded-lg cursor-pointer"
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
                  <Calendar className="w-5 h-5 text-text-secondary" />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                </div>
              </div>
            </div>
          )}

          {/* Input Mode Toggle */}
          <div className="p-8 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Verification Method
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setInputMode("qr")}
                className={`flex-1 py-4 px-6 font-semibold transition-colors border-2 rounded-lg cursor-pointer ${
                  inputMode === "qr"
                    ? "bg-primary text-bg-primary border-transparent"
                    : "bg-bg-secondary text-text-primary border-border hover:bg-bg-secondary/80 hover:border-primary"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <QrCode className="w-5 h-5" />
                  <span>QR Scanner</span>
                </div>
              </button>
              <button
                onClick={() => setInputMode("manual")}
                className={`flex-1 py-4 px-6 font-semibold transition-colors border-2 rounded-lg cursor-pointer ${
                  inputMode === "manual"
                    ? "bg-primary text-bg-primary border-transparent"
                    : "bg-bg-secondary text-text-primary border-border hover:bg-bg-secondary/80 hover:border-primary"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <Edit className="w-5 h-5" />
                  <span>Manual Entry</span>
                </div>
              </button>
            </div>
          </div>

          {/* QR Scanner Mode */}
          {inputMode === "qr" && (
            <div className="p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-bg-secondary border border-border mb-6 rounded-lg">
                  <QrCode className="w-10 h-10 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-text-primary mb-2">
                  QR Code Scanner
                </h4>
                <p className="text-text-secondary mb-6">
                  Point your camera at the attendee's QR code to verify their
                  ticket instantly
                </p>
                <button
                  className="w-full bg-primary hover:bg-primary/90 text-bg-primary px-8 py-4 font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg cursor-pointer"
                  onClick={startScanning}
                  disabled={!selectedEvent}
                >
                  <Camera className="w-6 h-6" />
                  Start QR Scanner
                </button>
                {!selectedEvent && (
                  <p className="text-amber-600 text-sm mt-3 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
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
                <div className="w-12 h-12 bg-bg-secondary border border-border flex items-center justify-center rounded-lg">
                  <Edit className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-text-primary">
                    Manual Entry
                  </h4>
                  <p className="text-text-secondary text-sm">
                    Enter ticket ID or paste QR code data
                  </p>
                </div>
              </div>

              <div className="relative mb-6">
                <textarea
                  className="w-full px-4 py-4 pl-12 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary text-text-primary resize-none rounded-lg"
                  rows="4"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter ticket ID (e.g., abc123...) or paste QR code data (JSON format)"
                />
                <div className="absolute left-4 top-4">
                  <Ticket className="w-5 h-5 text-text-secondary" />
                </div>
              </div>

              <button
                className="w-full bg-primary hover:bg-primary/90 text-bg-primary px-8 py-4 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 rounded-lg cursor-pointer"
                onClick={handleManualVerify}
                disabled={!selectedEvent || !manualInput.trim()}
              >
                <CheckCircle2 className="w-5 h-5" />
                Verify Ticket
              </button>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="p-8 border-t border-border">
              <div
                className={`p-6 border-2 rounded-lg ${
                  result.success
                    ? "bg-success/10 border-success/20"
                    : "bg-error/10 border-error/20"
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 border border-border flex items-center justify-center rounded-lg ${
                      result.success
                        ? "bg-success text-bg-primary"
                        : "bg-error text-bg-primary"
                    }`}
                  >
                    {result.success ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h5
                      className={`text-lg font-semibold ${
                        result.success ? "text-success" : "text-error"
                      }`}
                    >
                      {result.success
                        ? "Verification Successful"
                        : "Verification Failed"}
                    </h5>
                    <p
                      className={`text-sm ${
                        result.success ? "text-success" : "text-error"
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>

                {result.success && result.booking && (
                  <div className="bg-bg-primary p-4 border border-border space-y-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-medium">
                        Ticket ID:
                      </span>
                      <span className="text-text-primary font-mono bg-bg-secondary px-3 py-1 border border-border rounded-md">
                        {result.booking.ticketId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary font-medium">
                        Number of Seats:
                      </span>
                      <span className="text-text-primary font-semibold">
                        {result.booking.noOfSeats}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-8 border-t border-border text-center">
            <button
              className="text-primary hover:text-primary/80 font-semibold transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
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
