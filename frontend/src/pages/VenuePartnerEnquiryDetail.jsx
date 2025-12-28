import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDates, setBookingDates] = useState({ startDate: "", endDate: "" });
  
  const [quoteData, setQuoteData] = useState({
    quotedAmount: "",
    terms: "",
  });
  
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    fetchEnquiryDetails();
  }, [id]);

  const fetchEnquiryDetails = async () => {
    setLoading(true);
    try {
      // Fetch enquiry details - we'll need to add this endpoint
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
      fetchEnquiryDetails(); // Refresh data
    } catch (err) {
      console.error("Error sending quote:", err);
      toast.error(err.response?.data?.message || "Failed to send quote");
    } finally {
      setSendingQuote(false);
    }
  };

  const handleDecline = async (e) => {
    e.preventDefault();
    
    try {
      await apiClient.post(`/venue-requests/${id}/decline`, {
        reason: declineReason,
      });
      
      toast.success("Enquiry declined successfully");
      setShowDeclineForm(false);
      setDeclineReason("");
      fetchEnquiryDetails(); // Refresh data
    } catch (err) {
      console.error("Error declining enquiry:", err);
      toast.error(err.response?.data?.message || "Failed to decline enquiry");
    }
  };

  const handleMarkBooked = () => {
    // Pre-fill with enquiry dates if available
    setBookingDates({
      startDate: enquiry?.startDate ? new Date(enquiry.startDate).toISOString().split('T')[0] : "",
      endDate: enquiry?.endDate ? new Date(enquiry.endDate).toISOString().split('T')[0] : ""
    });
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    
    if (!bookingDates.startDate || !bookingDates.endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    const start = new Date(bookingDates.startDate);
    const end = new Date(bookingDates.endDate);

    if (end < start) {
      toast.error("End date cannot be before start date");
      return;
    }
    
    try {
      await apiClient.post(`/venue-requests/${id}/mark-booked`, {
        startDate: bookingDates.startDate,
        endDate: bookingDates.endDate
      });
      
      toast.success("Enquiry marked as externally booked!");
      setShowBookingModal(false);
      setBookingDates({ startDate: "", endDate: "" });
      fetchEnquiryDetails(); // Refresh data
    } catch (err) {
      console.error("Error marking as booked:", err);
      toast.error(err.response?.data?.message || "Failed to mark as booked");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Enquiry not found</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { bg: "bg-blue-100", text: "text-blue-800", label: "Open" },
      quoted: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Quoted" },
      declined: { bg: "bg-red-100", text: "text-red-800", label: "Declined" },
      externally_booked: { bg: "bg-green-100", text: "text-green-800", label: "Externally Booked" },
      closed: { bg: "bg-gray-100", text: "text-gray-800", label: "Closed" },
    };
    
    const config = statusConfig[status] || statusConfig.open;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const canTakeAction = enquiry.status === "open" || enquiry.status === "quoted";
  const canMarkBooked = enquiry.status === "open" || enquiry.status === "quoted";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/venue-partner")}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enquiry Details</h1>
              <p className="text-gray-600 mt-1">Manage this venue enquiry</p>
            </div>
            {getStatusBadge(enquiry.status)}
          </div>
        </div>

        {/* Enquiry Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enquiry Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Organizer</p>
              <p className="font-medium">{enquiry.organizer?.name || "N/A"}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Space</p>
              <p className="font-medium">{enquiry.space?.name || "N/A"}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Event Type</p>
              <p className="font-medium capitalize">
                {enquiry.eventType.startsWith("other:") 
                  ? enquiry.eventType.substring(6)
                  : enquiry.eventType}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Expected Attendees</p>
              <p className="font-medium">{enquiry.expectedPax} people</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Event Dates</p>
              <p className="font-medium">
                {new Date(enquiry.eventDateStart).toLocaleDateString("en-IN")} - {new Date(enquiry.eventDateEnd).toLocaleDateString("en-IN")}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="font-medium">
                ₹{enquiry.budgetMax?.toLocaleString()}
              </p>
            </div>
          </div>
          
          {enquiry.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Additional Notes</p>
              <p className="mt-1 text-gray-900">{enquiry.notes}</p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="text-gray-900">{new Date(enquiry.createdAt).toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Quotes Section */}
        {quotes.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Quotes Sent</h2>
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">₹{quote.quotedAmount?.toLocaleString()}</p>
                      {quote.terms && (
                        <p className="text-gray-600 mt-1">{quote.terms}</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Sent by: {quote.createdBy?.name || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canTakeAction && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              {enquiry.status === "open" && (
                <button
                  onClick={() => setShowQuoteForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Send Quote
                </button>
              )}
              
              {canMarkBooked && (
                <button
                  onClick={handleMarkBooked}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Mark as Externally Booked
                </button>
              )}
              
              {enquiry.status === "open" && (
                <button
                  onClick={() => setShowDeclineForm(true)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                  Decline Enquiry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quote Form Modal */}
        {showQuoteForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Send Quote</h3>
              <form onSubmit={handleSendQuote}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quoted Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={quoteData.quotedAmount}
                    onChange={(e) => setQuoteData({ ...quoteData, quotedAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={quoteData.terms}
                    onChange={(e) => setQuoteData({ ...quoteData, terms: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter any terms, conditions, or additional details..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={sendingQuote}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {sendingQuote ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      "Send Quote"
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={sendingQuote}
                    onClick={() => {
                      setShowQuoteForm(false);
                      setQuoteData({ quotedAmount: "", terms: "" });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chat Section */}
        <VenueEnquiryChat requestId={id} />

        {/* Booking Dates Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Confirm Booking Dates</h3>
              <p className="text-sm text-gray-600 mb-4">
                Specify the actual booking dates. These can differ from the original enquiry dates if changed during negotiation.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={bookingDates.startDate}
                    onChange={(e) => setBookingDates({ ...bookingDates, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={bookingDates.endDate}
                    onChange={(e) => setBookingDates({ ...bookingDates, endDate: e.target.value })}
                    min={bookingDates.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  * For single-day events, start and end dates can be the same
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Confirm Booking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingDates({ startDate: "", endDate: "" });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Decline Form Modal */}
        {showDeclineForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Decline Enquiry</h3>
              <form onSubmit={handleDecline}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Declining (Optional)
                  </label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Provide a reason for the organizer..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                  >
                    Decline Enquiry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeclineForm(false);
                      setDeclineReason("");
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenuePartnerEnquiryDetail;
