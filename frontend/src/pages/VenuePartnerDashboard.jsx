import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import { format } from "date-fns";
import toast from "react-hot-toast";

const VenuePartnerDashboard = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (venues.length > 0 && !selectedVenueId) {
      setSelectedVenueId(venues[0]._id);
    }
  }, [venues]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [venuesRes, enquiriesRes, spacesRes] = await Promise.all([
        apiClient.get("/venues/my-venues"),
        apiClient.get("/venue-requests/venue-enquiries"),
        apiClient.get("/spaces/my-spaces"),
      ]);
      setVenues(venuesRes.data);
      setEnquiries(enquiriesRes.data);
      setSpaces(spacesRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status !== 404) {
        toast.error("Failed to load dashboard data");
      }
    }
    setLoading(false);
  };

  const hasVenues = venues.length > 0;
  const selectedVenue = venues.find(v => v._id === selectedVenueId);
  
  const venueSpaces = spaces.filter(s => {
    const venueId = typeof s.venue === 'object' ? s.venue._id : s.venue;
    return venueId === selectedVenueId;
  });
  
  const venueEnquiries = enquiries.filter(e => {
    const venueId = typeof e.venue === 'object' ? e.venue._id : e.venue;
    return venueId === selectedVenueId;
  });

  const filteredEnquiries = statusFilter === "all" 
    ? venueEnquiries 
    : venueEnquiries.filter(e => e.status === statusFilter);

  const stats = {
    total: venueEnquiries.length,
    open: venueEnquiries.filter(e => e.status === "open").length,
    quoted: venueEnquiries.filter(e => e.status === "quoted").length,
    booked: venueEnquiries.filter(e => e.status === "externally_booked").length,
    declined: venueEnquiries.filter(e => e.status === "declined").length,
  };

  const getStatusConfig = (status) => {
    const configs = {
      open: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", icon: "⏳" },
      quoted: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", icon: "💰" },
      declined: { bg: "bg-error/10", text: "text-error", border: "border-error/20", icon: "❌" },
      externally_booked: { bg: "bg-success/10", text: "text-success", border: "border-success/20", icon: "✅" },
      closed: { bg: "bg-bg-secondary", text: "text-text-primary", border: "border-border", icon: "🔒" },
    };
    return configs[status] || configs.open;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Venue Partner Dashboard</h1>
              <p className="mt-1 text-text-secondary">Manage your venues and enquiries in one place</p>
            </div>
            {hasVenues && (
              <Link
                to="/venue-partner/register"
                className="inline-flex items-center gap-2 bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Venue
              </Link>
            )}
          </div>
        </div>

        {/* No Venues - Onboarding */}
        {!hasVenues && (
          <div className="bg-bg-primary border border-border rounded-lg p-12 text-center">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Welcome to Venue Partner!</h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Start receiving enquiries from event organizers by registering your venue on our platform.
            </p>
            <Link
              to="/venue-partner/register"
              className="inline-block bg-primary text-bg-primary px-8 py-3 rounded-lg hover:bg-primary/90 font-medium cursor-pointer transition-colors"
            >
              Register Your First Venue
            </Link>
          </div>
        )}

        {/* Has Venues - Dashboard */}
        {hasVenues && (
          <>
            {/* Venue Selector */}
            {venues.length > 1 && (
              <div className="bg-bg-primary border border-border rounded-lg p-6 mb-6">
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Select Venue to Manage
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {venues.map((venue) => (
                    <button
                      key={venue._id}
                      onClick={() => setSelectedVenueId(venue._id)}
                      className={`text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedVenueId === venue._id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <h3 className="font-semibold text-text-primary">{venue.name}</h3>
                      <p className="text-sm text-text-secondary mt-1">{venue.city}</p>
                      <div className="mt-2">
                        {venue.verificationStatus === 'verified' && (
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-md">✓ Verified</span>
                        )}
                        {venue.verificationStatus === 'pending' && (
                          <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-md">⏳ Pending</span>
                        )}
                        {venue.verificationStatus === 'suspended' && (
                          <span className="text-xs bg-error/10 text-error px-2 py-1 rounded-md">⚠ Suspended</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Venue Header */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-border rounded-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{selectedVenue?.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-text-secondary">{selectedVenue?.city}</span>
                    <span className="text-text-secondary">•</span>
                    {selectedVenue?.verificationStatus === 'verified' && (
                      <span className="flex items-center gap-1 text-success text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Venue
                      </span>
                    )}
                    {selectedVenue?.verificationStatus === 'pending' && (
                      <span className="text-warning text-sm font-medium">⏳ Verification Pending</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/venue-partner/venues/${selectedVenueId}/edit`}
                    className="inline-flex items-center gap-2 border border-border bg-bg-primary text-text-primary px-4 py-2 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Details
                  </Link>
                  <Link
                    to={`/venue-partner/venues/${selectedVenueId}/spaces`}
                    className="inline-flex items-center gap-2 bg-secondary text-bg-primary px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    Manage Spaces
                  </Link>
                </div>
              </div>
            </div>

            {/* Suspension Warning */}
            {selectedVenue?.verificationStatus === 'suspended' && (
              <div className="bg-error/10 border-l-4 border-error p-6 mb-6 rounded-lg">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-error mb-2">Venue Suspended</h3>
                    <p className="text-error mb-2">Your venue is currently suspended and not visible to users.</p>
                    {selectedVenue?.suspensionReason && (
                      <p className="text-error text-sm mb-3">
                        <strong>Reason:</strong> {selectedVenue.suspensionReason}
                      </p>
                    )}
                    <p className="text-error text-sm">Please contact support for assistance.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Total Enquiries</p>
                    <p className="text-3xl font-bold text-text-primary">{stats.total}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Open Enquiries</p>
                    <p className="text-3xl font-bold text-text-primary">{stats.open}</p>
                  </div>
                  <div className="bg-warning/10 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => setStatusFilter("open")}
                  className="mt-3 text-sm text-primary hover:text-primary/80 cursor-pointer"
                >
                  View open →
                </button>
              </div>

              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Quoted</p>
                    <p className="text-3xl font-bold text-text-primary">{stats.quoted}</p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => setStatusFilter("quoted")}
                  className="mt-3 text-sm text-primary hover:text-primary/80 cursor-pointer"
                >
                  View quoted →
                </button>
              </div>

              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Confirmed Bookings</p>
                    <p className="text-3xl font-bold text-text-primary">{stats.booked}</p>
                  </div>
                  <div className="bg-success/10 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => setStatusFilter("externally_booked")}
                  className="mt-3 text-sm text-primary hover:text-primary/80 cursor-pointer"
                >
                  View bookings →
                </button>
              </div>
            </div>

            {/* Spaces Overview */}
            <div className="bg-bg-primary border border-border rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text-primary">Your Spaces ({venueSpaces.length})</h3>
                <Link
                  to={`/venue-partner/venues/${selectedVenueId}/spaces`}
                  className="text-primary hover:text-primary/80 text-sm font-medium cursor-pointer"
                >
                  Manage All →
                </Link>
              </div>
              
              {venueSpaces.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-text-secondary/60 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <p className="text-text-secondary mb-4">No spaces added yet</p>
                  <Link
                    to={`/venue-partner/venues/${selectedVenueId}/spaces`}
                    className="inline-block bg-primary text-bg-primary px-6 py-2 rounded-lg hover:bg-primary/90 cursor-pointer"
                  >
                    Add Your First Space
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {venueSpaces.slice(0, 6).map((space) => (
                    <div key={space._id} className="group border border-border hover:border-primary/30 rounded-lg p-4 transition-all hover:shadow-md">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-text-primary">{space.name}</h4>
                          <p className="text-sm text-text-secondary capitalize">{space.type}</p>
                        </div>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                          {space.maxPax} pax
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enquiries Section */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text-primary">Recent Enquiries</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      statusFilter === "all"
                        ? "bg-primary text-bg-primary"
                        : "bg-bg-secondary text-text-primary hover:bg-border"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("open")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      statusFilter === "open"
                        ? "bg-primary text-bg-primary"
                        : "bg-bg-secondary text-text-primary hover:bg-border"
                    }`}
                  >
                    Open ({stats.open})
                  </button>
                  <button
                    onClick={() => setStatusFilter("quoted")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      statusFilter === "quoted"
                        ? "bg-primary text-bg-primary"
                        : "bg-bg-secondary text-text-primary hover:bg-border"
                    }`}
                  >
                    Quoted ({stats.quoted})
                  </button>
                  <button
                    onClick={() => setStatusFilter("externally_booked")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      statusFilter === "externally_booked"
                        ? "bg-primary text-bg-primary"
                        : "bg-bg-secondary text-text-primary hover:bg-border"
                    }`}
                  >
                    Booked ({stats.booked})
                  </button>
                </div>
              </div>

              {filteredEnquiries.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-text-secondary/60 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-lg font-medium text-text-primary mb-1">
                    No {statusFilter !== "all" && statusFilter} enquiries
                  </h4>
                  <p className="text-text-secondary text-sm">
                    {statusFilter === "all" 
                      ? "You haven't received any enquiries yet" 
                      : `No ${statusFilter.replace("_", " ")} enquiries at the moment`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredEnquiries.slice(0, 6).map((enquiry) => {
                    const config = getStatusConfig(enquiry.status);
                    return (
                      <div
                        key={enquiry._id}
                        className="group border border-border hover:border-primary/30 rounded-lg p-5 transition-all hover:shadow-md flex flex-col"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-text-primary">{enquiry.space?.name}</h4>
                            <p className="text-sm text-text-secondary mt-1">
                              From: {enquiry.organizer?.name}
                            </p>
                          </div>
                          <span className={`${config.bg} ${config.text} ${config.border} border px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ml-2`}>
                            {config.icon} {enquiry.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                          <div>
                            <span className="text-text-secondary text-xs">Event</span>
                            <p className="font-medium text-text-primary truncate capitalize">
                              {enquiry.eventType.startsWith("other:") 
                                ? enquiry.eventType.substring(6)
                                : enquiry.eventType}
                            </p>
                          </div>
                          <div>
                            <span className="text-text-secondary text-xs">Date</span>
                            <p className="font-medium text-text-primary">
                              {format(new Date(enquiry.eventDateStart), "MMM dd")}
                            </p>
                          </div>
                          <div>
                            <span className="text-text-secondary text-xs">Guests</span>
                            <p className="font-medium text-text-primary">{enquiry.expectedPax}</p>
                          </div>
                          <div>
                            <span className="text-text-secondary text-xs">Budget</span>
                            <p className="font-medium text-text-primary">
                              ₹{Number(enquiry.budgetMax).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/venue-partner/enquiries/${enquiry._id}`}
                          className="block w-full text-center bg-primary text-bg-primary py-2 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium mt-auto pt-4"
                        >
                          View & Respond
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredEnquiries.length > 6 && (
                <div className="mt-6 text-center">
                  <p className="text-text-secondary text-sm">
                    Showing 6 of {filteredEnquiries.length} enquiries
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VenuePartnerDashboard;
