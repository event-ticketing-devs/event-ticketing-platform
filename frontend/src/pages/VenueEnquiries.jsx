import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import { format } from "date-fns";
import toast from "react-hot-toast";

const VenueEnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/venue-requests/my-enquiries");
      setEnquiries(res.data);
    } catch (err) {
      console.error("Error fetching enquiries:", err);
      toast.error("Failed to load enquiries");
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "bg-blue-100 text-blue-800",
      quoted: "bg-yellow-100 text-yellow-800",
      declined: "bg-red-100 text-red-800",
      externally_booked: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredEnquiries = filter === "all" 
    ? enquiries 
    : enquiries.filter(e => e.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Venue Enquiries</h1>
          <p className="mt-2 text-gray-600">
            Track your venue enquiries and quotes
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({enquiries.length})
            </button>
            <button
              onClick={() => setFilter("open")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "open"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Open ({enquiries.filter(e => e.status === "open").length})
            </button>
            <button
              onClick={() => setFilter("quoted")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "quoted"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Quoted ({enquiries.filter(e => e.status === "quoted").length})
            </button>
            <button
              onClick={() => setFilter("externally_booked")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "externally_booked"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Booked ({enquiries.filter(e => e.status === "externally_booked").length})
            </button>
            <button
              onClick={() => setFilter("declined")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "declined"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Declined ({enquiries.filter(e => e.status === "declined").length})
            </button>
          </div>
        </div>

        {/* Enquiries List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading enquiries...</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No enquiries found
            </h3>
            <p className="mt-2 text-gray-600">
              {filter === "all" 
                ? "You haven't sent any venue enquiries yet"
                : `No ${filter.replace("_", " ")} enquiries`}
            </p>
            <Link
              to="/venues"
              className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Browse Venues
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => (
              <div
                key={enquiry._id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {enquiry.space?.name} at {enquiry.venue?.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {enquiry.venue?.city}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                      enquiry.status
                    )}`}
                  >
                    {enquiry.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Event Type</span>
                    <p className="font-medium text-gray-900">
                      {enquiry.eventType.startsWith("other:") 
                        ? enquiry.eventType.substring(6)
                        : enquiry.eventType}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Attendees</span>
                    <p className="font-medium text-gray-900">{enquiry.expectedPax}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Event Date</span>
                    <p className="font-medium text-gray-900">
                      {format(new Date(enquiry.eventDateStart), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Budget</span>
                    <p className="font-medium text-gray-900">
                      ₹{enquiry.budgetMax.toLocaleString()}
                    </p>
                  </div>
                </div>

                {enquiry.quotes && enquiry.quotes.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Latest Quote</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        ₹{enquiry.quotes[0].quotedAmount.toLocaleString()}
                      </span>
                      {enquiry.quotes[0].terms && (
                        <span className="text-sm text-gray-600">Terms apply</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link
                    to={`/venue-enquiries/${enquiry._id}`}
                    className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                  {enquiry.status === "externally_booked" && (
                    <span className="flex-1 text-center bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                      ✓ Booking Confirmed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueEnquiriesPage;
