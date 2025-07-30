import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

const TicketView = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await apiClient.get(`/bookings/${bookingId}/qr`);
        setTicket(res.data);
      } catch (err) {
        toast.error("Failed to load ticket");
        navigate("/dashboard");
      }
      setLoading(false);
    };

    if (bookingId) {
      fetchTicket();
    }
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blue-600 animate-pulse text-lg">
          Loading ticket...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Ticket not found</div>
      </div>
    );
  }

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = ticket.qrCode;
    link.download = `ticket-${ticket.ticketId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-400 text-white p-6 text-center">
            <h1 className="text-2xl font-bold">🎟️ Event Ticket</h1>
            <p className="opacity-90 mt-1">Digital Ticket</p>
          </div>

          {/* Ticket Content */}
          <div className="p-6">
            {/* QR Code */}
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                <img
                  src={ticket.qrCode}
                  alt="Ticket QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Present this QR code at the event entrance
              </p>
            </div>

            {/* Ticket Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Ticket ID:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {ticket.ticketId}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-semibold ${
                    ticket.verified ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {ticket.verified ? "✓ Verified" : "○ Not Verified"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <button
                onClick={downloadQR}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download QR Code
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Warning */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Keep this QR code secure and only
                share it at the event entrance. Screenshots or photos of this
                code are valid for entry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
