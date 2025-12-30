import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import VenueEnquiryChat from "../components/VenueEnquiryChat";
import { ArrowLeft, Calendar, Users, User, Tag, Clock, CheckCircle2, XCircle, Lock } from 'lucide-react';

const VenuePartnerEnquiryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteData, setQuoteData] = useState({ quotedAmount: "", terms: "" });

  useEffect(() => {
    fetchEnquiryDetails();
  }, [id]);

  const fetchEnquiryDetails = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/venue-requests/${id}`);
      setEnquiry(res.data.request);
      setQuotes(res.data.quotes || []);
    } catch (err) {
      console.error("Error fetching enquiry:", err);
      toast.error("Failed to load enquiry details");
    }
    setLoading(false);
  };

  const handleSendQuote = async (e) => {
    e.preventDefault();
    
    if (!quoteData.quotedAmount || quoteData.quotedAmount <= 0) {
      toast.error("Please enter a valid quoted amount");
      return;
    }

    setSendingQuote(true);
    try {
      await apiClient.post("/venue-quotes", {
        requestId: id,
        quotedAmount: parseInt(quoteData.quotedAmount),
        terms: quoteData.terms,
      });
      
      toast.success("Quote sent successfully!");
      setShowQuoteForm(false);
      setQuoteData({ quotedAmount: "", terms: "" });
      fetchEnquiryDetails();
    } catch (err) {
      console.error("Error sending quote:", err);
      toast.error(err.response?.data?.message || "Failed to send quote");
    } finally {
      setSendingQuote(false);
    }
  };

  const handleDecline = async () => {
    try {
      await apiClient.post(`/venue-requests/${id}/decline`);
      toast.success("Enquiry declined");
      fetchEnquiryDetails();
    } catch (err) {
      console.error("Error declining enquiry:", err);
      toast.error("Failed to decline enquiry");
    }
  };

  const handleMarkBooked = async () => {
    try {
      await apiClient.post(`/venue-requests/${id}/mark-booked`);
      toast.success("Booking confirmed!");
      fetchEnquiryDetails();
    } catch (err) {
      console.error("Error marking as booked:", err);
      toast.error("Failed to confirm booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Enquiry not found</h2>
          <button
            onClick={() => navigate("/venue-partner")}
            className="text-primary hover:text-primary/80 cursor-pointer"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const configs = {
      open: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", label: "Open", icon: <Clock className="w-4 h-4" /> },
      quoted: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", label: "Quoted", icon: <span className="w-4 h-4 flex items-center justify-center text-sm">₹</span> },
      declined: { bg: "bg-error/10", text: "text-error", border: "border-error/20", label: "Declined", icon: <XCircle className="w-4 h-4" /> },
      externally_booked: { bg: "bg-success/10", text: "text-success", border: "border-success/20", label: "Confirmed", icon: <CheckCircle2 className="w-4 h-4" /> },
      closed: { bg: "bg-bg-secondary", text: "text-text-primary", border: "border-border", label: "Closed", icon: <Lock className="w-4 h-4" /> },
    };
    return configs[status] || configs.open;
  };

  const statusConfig = getStatusConfig(enquiry.status);

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/venue-partner")}
            className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Enquiry Details</h1>
              <p className="text-text-secondary mt-1">Reference #{enquiry._id.slice(-8).toUpperCase()}</p>
            </div>
            <div className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border px-6 py-3 rounded-lg font-medium flex items-center gap-2`}>
              <span className="text-xl">{statusConfig.icon}</span>
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Customer Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Name</p>
                  <p className="font-medium text-text-primary">{enquiry.organizer?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Email</p>
                  <a href={`mailto:${enquiry.organizer?.email}`} className="font-medium text-primary hover:text-primary/80 cursor-pointer">
                    {enquiry.organizer?.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Event Requirements</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <span className="text-sm text-text-secondary">Event Type</span>
                  </div>
                  <p className="font-medium text-text-primary capitalize">
                    {enquiry.eventType?.startsWith("other:") 
                      ? enquiry.eventType.substring(6)
                      : enquiry.eventType}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-sm text-text-secondary">Expected Guests</span>
                  </div>
                  <p className="font-medium text-text-primary">{enquiry.expectedPax} people</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-sm text-text-secondary">Event Dates</span>
                  </div>
                  <p className="font-medium text-text-primary">
                    {format(new Date(enquiry.eventDateStart), "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm text-text-secondary">
                    to {format(new Date(enquiry.eventDateEnd), "MMM dd, yyyy")}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 flex items-center justify-center text-lg text-primary">₹</span>
                    <span className="text-sm text-text-secondary">Customer Budget</span>
                  </div>
                  <p className="font-medium text-text-primary">₹{enquiry.budgetMax?.toLocaleString()}</p>
                </div>
              </div>

              {enquiry.notes && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-text-secondary mb-2">Additional Notes</p>
                  <p className="text-text-primary bg-bg-secondary p-4 rounded-lg">{enquiry.notes}</p>
                </div>
              )}
            </div>

            {/* Quotes Section */}
            {quotes.length > 0 && (
              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Your Quotes</h2>
                <div className="space-y-4">
                  {quotes.map((quote, idx) => (
                    <div key={quote._id} className="bg-success/5 border border-success/20 rounded-lg p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs text-text-secondary">Quote #{idx + 1}</span>
                          <p className="text-3xl font-bold text-success mt-1">
                            ₹{quote.quotedAmount?.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs text-text-secondary">
                          Sent {format(new Date(quote.createdAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                      {quote.terms && (
                        <div className="bg-bg-primary rounded-lg p-4">
                          <p className="text-sm font-medium text-text-primary mb-1">Terms & Conditions</p>
                          <p className="text-sm text-text-secondary">{quote.terms}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quote Form */}
            {(enquiry.status === "open" || enquiry.status === "quoted") && (
              <div className="bg-bg-primary border border-border rounded-lg p-6">
                {!showQuoteForm ? (
                  <button
                    onClick={() => setShowQuoteForm(true)}
                    className="w-full bg-primary text-bg-primary py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium"
                  >
                    {quotes.length > 0 ? "Send Updated Quote" : "Send Quote"}
                  </button>
                ) : (
                  <form onSubmit={handleSendQuote}>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Send Quote</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Quoted Amount (₹) *
                        </label>
                        <input
                          type="number"
                          value={quoteData.quotedAmount}
                          onChange={(e) => setQuoteData({ ...quoteData, quotedAmount: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Enter amount"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Terms & Conditions (Optional)
                        </label>
                        <textarea
                          value={quoteData.terms}
                          onChange={(e) => setQuoteData({ ...quoteData, terms: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          rows="4"
                          placeholder="Add any terms, conditions, or special notes..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={sendingQuote}
                          className="flex-1 bg-primary text-bg-primary py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {sendingQuote ? "Sending..." : "Send Quote"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuoteForm(false);
                            setQuoteData({ quotedAmount: "", terms: "" });
                          }}
                          className="flex-1 border border-border text-text-primary py-2 rounded-lg hover:bg-bg-secondary cursor-pointer font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Chat */}
            <VenueEnquiryChat requestId={id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Space Info */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Requested Space</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-text-secondary">Space Name</p>
                  <p className="font-medium text-text-primary">{enquiry.space?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Type</p>
                  <p className="font-medium text-text-primary capitalize">{enquiry.space?.type}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Capacity</p>
                  <p className="font-medium text-text-primary">{enquiry.space?.maxPax} people</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Enquiry Received</p>
                    <p className="text-xs text-text-secondary">{format(new Date(enquiry.createdAt), "MMM dd, yyyy · HH:mm")}</p>
                  </div>
                </div>
                
                {quotes.length > 0 && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-warning mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Quote Sent</p>
                      <p className="text-xs text-text-secondary">{format(new Date(quotes[0].createdAt), "MMM dd, yyyy · HH:mm")}</p>
                    </div>
                  </div>
                )}
                
                {enquiry.bookedAt && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-success mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Booking Confirmed</p>
                      <p className="text-xs text-text-secondary">{format(new Date(enquiry.bookedAt), "MMM dd, yyyy · HH:mm")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {enquiry.status !== "declined" && enquiry.status !== "externally_booked" && (
              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {enquiry.status === "quoted" && (
                    <button
                      onClick={handleMarkBooked}
                      className="w-full bg-success text-bg-primary py-2.5 px-4 rounded-lg hover:bg-success/90 transition-colors cursor-pointer font-medium"
                    >
                      Mark as Booked
                    </button>
                  )}
                  <button
                    onClick={handleDecline}
                    className="w-full border border-error text-error py-2.5 px-4 rounded-lg hover:bg-error/10 transition-colors cursor-pointer font-medium"
                  >
                    Decline Enquiry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenuePartnerEnquiryDetail;
