import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/venue-enquiries")}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to My Enquiries
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enquiry Details</h1>
              <p className="text-gray-600 mt-1">Track your venue enquiry</p>
            </div>
            {getStatusBadge(enquiry.status)}
          </div>
        </div>

        {/* Venue Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Venue Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Venue</p>
              <p className="font-medium">{enquiry.venue?.name || "N/A"}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">City</p>
              <p className="font-medium">{enquiry.venue?.city || "N/A"}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Space</p>
              <p className="font-medium">{enquiry.space?.name || "N/A"}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Space Type</p>
              <p className="font-medium capitalize">{enquiry.space?.type || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Enquiry Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Enquiry</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-sm text-gray-600">Your Budget</p>
              <p className="font-medium">
                ₹{enquiry.budgetMax?.toLocaleString()}
              </p>
            </div>
          </div>
          
          {enquiry.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Your Notes</p>
              <p className="mt-1 text-gray-900">{enquiry.notes}</p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="text-gray-900">{new Date(enquiry.createdAt).toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Quotes Section */}
        {quotes.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Quotes Received</h2>
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote._id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-xl text-green-800">₹{quote.quotedAmount?.toLocaleString()}</p>
                      {quote.terms && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Terms & Conditions:</p>
                          <p className="text-gray-600 mt-1">{quote.terms}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {enquiry.status === "quoted" && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Next Steps:</strong> The venue has sent you a quote. Please contact them directly to finalize the booking details.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Quotes</h2>
            <p className="text-gray-600">No quotes received yet. The venue will respond soon.</p>
          </div>
        )}

        {/* Status Messages */}
        {enquiry.status === "declined" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Enquiry Declined</h3>
            <p className="text-red-700">
              Unfortunately, this venue is unable to accommodate your event. You can browse other venues on our platform.
            </p>
          </div>
        )}
        
        {enquiry.status === "externally_booked" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Booking Confirmed!</h3>
            <p className="text-green-700 mb-2">
              Your booking for <strong>{enquiry.space?.name}</strong> has been confirmed by the venue.
            </p>
            <p className="text-green-600 text-sm">
              Confirmed on: {enquiry.bookedAt ? new Date(enquiry.bookedAt).toLocaleDateString("en-IN") : "N/A"}
            </p>
            <p className="text-gray-700 mt-3 text-sm">
              Please ensure all payments and documentation are completed directly with the venue.
            </p>
          </div>
        )}

        {/* Chat Section */}
        <VenueEnquiryChat requestId={id} />

        {/* Contact Information */}
        {enquiry.status !== "declined" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Venue Contact</h2>
            <div className="space-y-2">
              {enquiry.venue?.primaryContact?.name && (
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-medium">{enquiry.venue.primaryContact.name}</p>
                </div>
              )}
              {enquiry.venue?.primaryContact?.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{enquiry.venue.primaryContact.phone}</p>
                </div>
              )}
              {enquiry.venue?.primaryContact?.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{enquiry.venue.primaryContact.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueEnquiryDetail;
