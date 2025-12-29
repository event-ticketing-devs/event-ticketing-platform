import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import VenueEnquiryChat from "../components/VenueEnquiryChat";
import { ArrowLeft, Building2, Calendar, Users, CheckCircle2, AlertCircle, User, Tag, Phone, Mail, FileText, Clock, XCircle, Lock, Info, Lightbulb } from 'lucide-react';

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
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/venue-enquiries")}
            className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
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
                  <Building2 className="w-8 h-8 text-primary" />
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
                    <Tag className="w-5 h-5 text-primary" />
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
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-sm text-text-secondary">Attendees</span>
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
                  <FileText className="w-5 h-5 text-success" />
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
                    <p className="text-sm text-primary font-medium flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Next Steps: Contact the venue directly to finalize booking details and payment.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-bg-primary border border-border rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <h3 className="text-lg font-medium text-text-primary mb-1">No Quotes Yet</h3>
                <p className="text-text-secondary text-sm">The venue will respond with a quote soon.</p>
              </div>
            )}

            {/* Status Alert Messages */}
            {enquiry.status === "declined" && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-error" />
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
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-success mb-1">Booking Confirmed!</h3>
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
                      <User className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-text-secondary">Contact Person</p>
                        <p className="font-medium text-text-primary">{enquiry.venue.primaryContact.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {enquiry.venue?.primaryContact?.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-0.5" />
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
                      <Mail className="w-5 h-5 text-primary mt-0.5" />
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
