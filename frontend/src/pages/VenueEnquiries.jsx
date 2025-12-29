import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { FileText, CheckCircle2 } from 'lucide-react';

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
      open: "bg-primary/10 text-primary border border-primary/20",
      quoted: "bg-warning/10 text-warning border border-warning/20",
      declined: "bg-error/10 text-error border border-error/20",
      externally_booked: "bg-success/10 text-success border border-success/20",
      closed: "bg-bg-secondary text-text-primary border border-border",
    };
    return colors[status] || "bg-bg-secondary text-text-primary border border-border";
  };

  const filteredEnquiries = filter === "all" 
    ? enquiries 
    : enquiries.filter(e => e.status === filter);

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">My Venue Enquiries</h1>
          <p className="mt-2 text-text-secondary">
            Track your venue enquiries and quotes
          </p>
        </div>

        {/* Filters */}
        <div className="bg-bg-primary border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-primary text-bg-primary"
                  : "bg-bg-secondary text-text-primary hover:bg-border"
              }`}
            >
              All ({enquiries.length})
            </button>
            <button
              onClick={() => setFilter("open")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "open"
                  ? "bg-primary text-bg-primary"
                  : "bg-bg-secondary text-text-primary hover:bg-border"
              }`}
            >
              Open ({enquiries.filter(e => e.status === "open").length})
            </button>
            <button
              onClick={() => setFilter("quoted")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "quoted"
                  ? "bg-primary text-bg-primary"
                  : "bg-bg-secondary text-text-primary hover:bg-border"
              }`}
            >
              Quoted ({enquiries.filter(e => e.status === "quoted").length})
            </button>
            <button
              onClick={() => setFilter("externally_booked")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "externally_booked"
                  ? "bg-primary text-bg-primary"
                  : "bg-bg-secondary text-text-primary hover:bg-border"
              }`}
            >
              Booked ({enquiries.filter(e => e.status === "externally_booked").length})
            </button>
            <button
              onClick={() => setFilter("declined")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "declined"
                  ? "bg-primary text-bg-primary"
                  : "bg-bg-secondary text-text-primary hover:bg-border"
              }`}
            >
              Declined ({enquiries.filter(e => e.status === "declined").length})
            </button>
          </div>
        </div>

        {/* Enquiries List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading enquiries...</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="bg-bg-primary border border-border rounded-lg p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-text-secondary/60" />
            <h3 className="mt-4 text-lg font-medium text-text-primary">
              No enquiries found
            </h3>
            <p className="mt-2 text-text-secondary">
              {filter === "all" 
                ? "You haven't sent any venue enquiries yet"
                : `No ${filter.replace("_", " ")} enquiries`}
            </p>
            <Link
              to="/venues"
              className="mt-6 inline-block bg-primary text-bg-primary px-6 py-2 rounded-lg hover:bg-primary/90"
            >
              Browse Venues
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEnquiries.map((enquiry) => (
              <div
                key={enquiry._id}
                className="bg-bg-primary border border-border rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {enquiry.space?.name} at {enquiry.venue?.name}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
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
                    <span className="text-sm text-text-secondary">Event Type</span>
                    <p className="font-medium text-text-primary">
                      {enquiry.eventType.startsWith("other:") 
                        ? enquiry.eventType.substring(6)
                        : enquiry.eventType}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Attendees</span>
                    <p className="font-medium text-text-primary">{enquiry.expectedPax}</p>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Event Date</span>
                    <p className="font-medium text-text-primary">
                      {format(new Date(enquiry.eventDateStart), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-text-secondary">Budget</span>
                    <p className="font-medium text-text-primary">
                      ₹{enquiry.budgetMax.toLocaleString()}
                    </p>
                  </div>
                </div>

                {enquiry.quotes && enquiry.quotes.length > 0 && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-text-primary mb-2">Latest Quote</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-text-primary">
                        ₹{enquiry.quotes[0].quotedAmount.toLocaleString()}
                      </span>
                      {enquiry.quotes[0].terms && (
                        <span className="text-sm text-text-secondary">Terms apply</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-auto pt-4">
                  <Link
                    to={`/venue-enquiries/${enquiry._id}`}
                    className="flex-1 text-center bg-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    View Details
                  </Link>
                  {enquiry.status === "externally_booked" && (
                    <span className="flex-1 text-center bg-success/10 text-success px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Booking Confirmed</span>
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
