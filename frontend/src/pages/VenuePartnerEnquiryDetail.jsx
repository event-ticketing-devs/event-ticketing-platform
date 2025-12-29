import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import VenueEnquiryChat from "../components/VenueEnquiryChat";

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
            onClick={() => navigate("/venue-partner/dashboard")}
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
      open: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", label: "Open", icon: "⏳" },
      quoted: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", label: "Quoted", icon: "💰" },
      declined: { bg: "bg-error/10", text: "text-error", border: "border-error/20", label: "Declined", icon: "❌" },
      externally_booked: { bg: "bg-success/10", text: "text-success", border: "border-success/20", label: "Confirmed", icon: "✅" },
      closed: { bg: "bg-bg-secondary", text: "text-text-primary", border: "border-border", label: "Closed", icon: "🔒" },
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
            onClick={() => navigate("/venue-partner/dashboard")}
            className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
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
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
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
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
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
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm text-text-secondary">Expected Guests</span>
                  </div>
                  <p className="font-medium text-text-primary">{enquiry.expectedPax} people</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
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
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
                          className="flex-1 bg-primary text-bg-primary py-2 rounded-lg hover:bg-primary/90 disabled:bg-primary/60 disabled:cursor-not-allowed cursor-pointer font-medium"
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
