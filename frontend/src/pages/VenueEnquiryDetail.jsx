import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import VenueEnquiryChat from "../components/VenueEnquiryChat";

const VenueEnquiryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

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
            onClick={() => navigate("/venue-enquiries")}
            className="text-primary hover:text-primary/80 cursor-pointer"
          >
            ← Back to enquiries
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
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/venue-enquiries")}
            className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Enquiries
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
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue & Space Info */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-text-primary">{enquiry.venue?.name}</h2>
                  <p className="text-text-secondary mt-1">{enquiry.venue?.city}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-md text-sm font-medium">
                      {enquiry.space?.name}
                    </span>
                    <span className="text-text-secondary text-sm">·</span>
                    <span className="text-text-secondary text-sm capitalize">{enquiry.space?.type}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Event Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm text-text-secondary">Event Type</span>
                  </div>
                  <p className="font-medium text-text-primary capitalize">
                    {enquiry.eventType.startsWith("other:") 
                      ? enquiry.eventType.substring(6)
                      : enquiry.eventType}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm text-text-secondary">Attendees</span>
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
                    <span className="text-sm text-text-secondary">Budget</span>
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
            {quotes.length > 0 ? (
              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Quotes Received ({quotes.length})
                </h3>
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
                          {format(new Date(quote.createdAt), "MMM dd, yyyy")}
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
                
                {enquiry.status === "quoted" && (
                  <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-primary font-medium">
                      💡 Next Steps: Contact the venue directly to finalize booking details and payment.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-bg-primary border border-border rounded-lg p-8 text-center">
                <svg className="w-12 h-12 text-text-secondary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-text-primary mb-1">No Quotes Yet</h3>
                <p className="text-text-secondary text-sm">The venue will respond with a quote soon.</p>
              </div>
            )}

            {/* Status Alert Messages */}
            {enquiry.status === "declined" && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-error mb-1">Enquiry Declined</h3>
                    <p className="text-error text-sm">
                      Unfortunately, this venue is unable to accommodate your event. Browse other venues on our platform.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {enquiry.status === "externally_booked" && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-success mb-1">Booking Confirmed! 🎉</h3>
                    <p className="text-success mb-2">
                      Your booking for <strong>{enquiry.space?.name}</strong> has been confirmed.
                    </p>
                    {enquiry.bookedAt && (
                      <p className="text-success text-sm">
                        Confirmed on {format(new Date(enquiry.bookedAt), "MMMM dd, yyyy")}
                      </p>
                    )}
                    <p className="text-text-primary mt-3 text-sm">
                      Please complete all payments and documentation directly with the venue.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Section */}
            <VenueEnquiryChat requestId={id} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timeline */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Enquiry Submitted</p>
                    <p className="text-xs text-text-secondary">{format(new Date(enquiry.createdAt), "MMM dd, yyyy · HH:mm")}</p>
                  </div>
                </div>
                
                {quotes.length > 0 && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-warning mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Quote Received</p>
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

            {/* Venue Contact */}
            {enquiry.status !== "declined" && (
              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Venue Contact</h3>
                <div className="space-y-4">
                  {enquiry.venue?.primaryContact?.name && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <p className="text-xs text-text-secondary">Contact Person</p>
                        <p className="font-medium text-text-primary">{enquiry.venue.primaryContact.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {enquiry.venue?.primaryContact?.phone && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="text-xs text-text-secondary">Phone</p>
                        <a href={`tel:${enquiry.venue.primaryContact.phone}`} className="font-medium text-primary hover:text-primary/80 cursor-pointer">
                          {enquiry.venue.primaryContact.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {enquiry.venue?.primaryContact?.email && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-xs text-text-secondary">Email</p>
                        <a href={`mailto:${enquiry.venue.primaryContact.email}`} className="font-medium text-primary hover:text-primary/80 cursor-pointer break-all">
                          {enquiry.venue.primaryContact.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/venues")}
                  className="w-full bg-secondary text-bg-primary py-2.5 px-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer font-medium text-sm"
                >
                  Browse More Venues
                </button>
                <button
                  onClick={() => navigate("/venue-enquiries")}
                  className="w-full border border-border text-text-primary py-2.5 px-4 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer font-medium text-sm"
                >
                  View All Enquiries
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueEnquiryDetail;
