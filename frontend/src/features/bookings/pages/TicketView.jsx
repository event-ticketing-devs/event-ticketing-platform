import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ArrowLeft, Ticket, Download, CheckCircle2, Clock, AlertTriangle, Share2, FileText } from 'lucide-react';

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
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="bg-bg-primary border border-border rounded-lg p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-b-2 border-primary rounded-full border-t-transparent animate-spin">
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Loading your ticket...
              </h2>
              <p className="text-text-secondary">
                Please wait while we fetch your digital ticket
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="bg-bg-primary border border-border rounded-lg p-12 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-error/10 border border-error/20 rounded-lg flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-error" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Ticket Not Found
          </h2>
          <p className="text-text-secondary mb-6">
            We couldn't find the ticket you're looking for. It may have been
            moved or doesn't exist.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-primary text-bg-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
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
    toast.success("QR code downloaded successfully!");
  };

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ticket.event?.title || "Event"} Ticket`,
          text: `Here's my ticket for ${ticket.event?.title || "the event"}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Ticket link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Digital Ticket</h1>
          <p className="text-text-secondary">Present this at the event entrance</p>
        </div>

        {/* Ticket Card */}
        <div className="bg-bg-primary border-2 border-border rounded-lg overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-primary p-6 text-bg-primary relative rounded-t-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-bg-primary/20 border border-bg-primary/30 rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {ticket.event?.title || "Event Ticket"}
                </h2>
                <p className="text-bg-primary/80 text-sm">
                  {ticket.event?.date &&
                    format(new Date(ticket.event.date), "PPP 'at' p")}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-between items-center">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-semibold border ${
                  ticket.verified
                    ? "bg-success/60 text-bg-primary border-bg-primary/20"
                    : "bg-warning/60 text-bg-primary border-bg-primary/20"
                }`}
              >
                {ticket.verified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Pending
                  </>
                )}
              </span>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-bg-primary rounded-full"></div>
            <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-bg-primary rounded-full"></div>
          </div>

          {/* QR Code Section */}
          <div className="p-8 text-center border-b border-border">
            <div className="inline-block p-6 bg-bg-secondary border-2 border-border rounded-lg mb-4">
              <img
                src={ticket.qrCode}
                alt="Ticket QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-text-secondary text-sm">
              Scan this QR code for event entry
            </p>
          </div>

          {/* Ticket Details */}
          <div className="p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Ticket Details
            </h3>

            <div className="space-y-4">
              <div className="p-3 bg-bg-secondary border border-border rounded-lg">
                <span className="text-text-secondary font-medium text-sm block mb-2">
                  Ticket ID
                </span>
                <span className="font-mono text-sm bg-bg-secondary border border-border rounded-md px-3 py-1 text-text-primary">
                  {ticket.ticketId}
                </span>
              </div>

              {ticket.event?.location && (
                <div className="flex justify-between items-center p-3 bg-bg-secondary border border-border rounded-lg">
                  <span className="text-text-secondary font-medium">Venue</span>
                  <span className="text-text-primary font-semibold">
                    {ticket.event.location}
                  </span>
                </div>
              )}

              {(ticket.seats || ticket.ticketItems) && (
                <div className="p-3 bg-bg-secondary border border-border rounded-lg">
                  <span className="text-text-secondary font-medium text-sm block mb-2">
                    {ticket.hasTicketCategories ? "Tickets Booked" : "Seats"}
                  </span>
                  {ticket.hasTicketCategories && ticket.ticketItems ? (
                    <div className="space-y-2">
                      {ticket.ticketItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-bg-primary px-3 py-2 border border-border rounded-md"
                        >
                          <span className="text-text-primary font-medium">
                            {item.categoryName}
                          </span>
                          <span className="text-text-primary font-semibold">
                            {item.quantity} ticket
                            {item.quantity !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center bg-primary/10 px-3 py-2 border border-primary/20 rounded-md">
                        <span className="text-primary font-semibold">
                          Total
                        </span>
                        <span className="text-primary font-bold">
                          {ticket.totalQuantity} ticket
                          {ticket.totalQuantity !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="font-mono text-sm bg-bg-primary px-3 py-1 border border-border rounded-md text-text-primary">
                      {ticket.seats}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-0 space-y-3">
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 bg-primary text-bg-primary py-3 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>

            <button
              onClick={shareTicket}
              className="w-full flex items-center justify-center gap-2 bg-bg-secondary text-text-primary py-3 px-4 rounded-lg font-semibold hover:bg-bg-secondary/80 transition-colors border border-border cursor-pointer"
            >
              <Share2 className="w-5 h-5" />
              Share Ticket
            </button>
          </div>

          {/* Security Notice */}
          <div className="p-6 pt-0">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-warning/20 border border-warning/30 rounded-md flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <h4 className="font-semibold text-warning mb-1">
                    Security Notice
                  </h4>
                  <p className="text-sm text-warning">
                    Keep this QR code secure. Screenshots are valid for entry.
                    Only share at the event entrance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
