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
  const [activeTab, setActiveTab] = useState("enquiries");
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-select first venue if none selected
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
      // Only show error if it's not a 404 (which means no venues yet)
      if (err.response?.status !== 404) {
        toast.error("Failed to load dashboard data");
      }
    }
    setLoading(false);
  };

  // Check if user has any venues
  const hasVenues = venues.length > 0;

  // Filter data by selected venue
  const selectedVenue = venues.find(v => v._id === selectedVenueId);
  const venueSpaces = spaces.filter(s => {
    const venueId = typeof s.venue === 'object' ? s.venue._id : s.venue;
    return venueId === selectedVenueId;
  });
  const venueEnquiries = enquiries.filter(e => {
    const venueId = typeof e.venue === 'object' ? e.venue._id : e.venue;
    return venueId === selectedVenueId;
  });

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

  const filteredEnquiries = venueEnquiries.filter(e => e.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your venue dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Venue Partner Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your venue enquiries and availability
          </p>
        </div>

        {/* No Venues - Onboarding */}
        {!hasVenues && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Venue Partner!</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Register your venue to start receiving enquiries from event organizers on our platform.
            </p>
            <Link
              to="/venue-partner/register"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Register Your Venue
            </Link>
          </div>
        )}

        {/* Has Venues - Show Dashboard */}
        {hasVenues && (
          <>
            {/* Venue Selector (if multiple venues) */}
            {venues.length > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Venue
                </label>
                <select
                  value={selectedVenueId || ""}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {venues.map((venue) => (
                    <option key={venue._id} value={venue._id}>
                      {venue.name} - {venue.city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Venue Header with Add Button */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedVenue?.name || "My Venue"}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedVenue?.city} • {selectedVenue?.verificationStatus === 'verified' ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : selectedVenue?.verificationStatus === 'suspended' ? (
                    <span className="text-red-600 font-semibold">⚠ Suspended</span>
                  ) : (
                    <span className="text-yellow-600">Pending Verification</span>
                  )}
                </p>
              </div>
              <Link
                to="/venue-partner/register"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another Venue
              </Link>
            </div>

            {/* Suspension Warning Banner */}
            {selectedVenue?.verificationStatus === 'suspended' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Venue Suspended</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Your venue has been suspended and is not visible to users.</p>
                      {selectedVenue?.suspensionReason && (
                        <p className="mt-1"><strong>Reason:</strong> {selectedVenue.suspensionReason}</p>
                      )}
                      <p className="mt-2">Please contact support for more information.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link
                to={`/venue-partner/venues/${selectedVenueId}/edit`}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Edit Venue</h3>
                    <p className="text-sm text-gray-600">Update venue details</p>
                  </div>
                </div>
              </Link>

              <Link
                to={`/venue-partner/venues/${selectedVenueId}/spaces`}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Spaces</h3>
                    <p className="text-sm text-gray-600">{venueSpaces.length} space{venueSpaces.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </Link>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Total Enquiries</h3>
                    <p className="text-sm text-gray-600">{venueEnquiries.length} enquir{venueEnquiries.length !== 1 ? 'ies' : 'y'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab("enquiries")}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === "enquiries"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Enquiries
                  </button>
                  <button
                    onClick={() => setActiveTab("availability")}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === "availability"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Availability Management
                  </button>
                </nav>
              </div>
            </div>

        {/* Enquiries Tab */}
        {activeTab === "enquiries" && (
          <>
            {/* Status Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter("open")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === "open"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Open ({venueEnquiries.filter(e => e.status === "open").length})
                </button>
                <button
                  onClick={() => setFilter("quoted")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === "quoted"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Quoted ({venueEnquiries.filter(e => e.status === "quoted").length})
                </button>
                <button
                  onClick={() => setFilter("externally_booked")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === "externally_booked"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Booked ({venueEnquiries.filter(e => e.status === "externally_booked").length})
                </button>
                <button
                  onClick={() => setFilter("declined")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === "declined"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Declined ({venueEnquiries.filter(e => e.status === "declined").length})
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
                  No {filter} enquiries
                </h3>
                <p className="mt-2 text-gray-600">
                  You don't have any {filter} enquiries at the moment
                </p>
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
                          {enquiry.space?.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          From: {enquiry.organizer?.name}
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

                    <div className="flex gap-3">
                      <Link
                        to={`/venue-partner/enquiries/${enquiry._id}`}
                        className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View & Respond
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Availability Management Tab */}
        {activeTab === "availability" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Space Availability
              </h2>
              <p className="text-gray-600">
                Manage availability blocks for your spaces. Blocks can be for external bookings,
                maintenance, or internal holds.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : venueSpaces.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No spaces found for this venue</p>
                <Link
                  to={`/venue-partner/venues/${selectedVenueId}/spaces`}
                  className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Spaces
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {venueSpaces.map((space) => (
                  <div key={space._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{space.name}</h3>
                        <p className="text-sm text-gray-600">
                          Capacity: {space.maxPax} | Type: {space.type}
                        </p>
                      </div>
                      <Link
                        to={`/venue-partner/spaces/${space._id}/availability`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Manage Availability
                      </Link>
                    </div>

                    {space.availability && space.availability.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Current Blocks ({space.availability.length})
                        </p>
                        <div className="space-y-2">
                          {space.availability.slice(0, 3).map((block) => {
                            const startDate = block.start ? new Date(block.start) : null;
                            const endDate = block.end ? new Date(block.end) : null;
                            const isValidStart = startDate && !isNaN(startDate.getTime());
                            const isValidEnd = endDate && !isNaN(endDate.getTime());
                            
                            return (
                              <div
                                key={block._id}
                                className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                              >
                                <span>
                                  {isValidStart && isValidEnd
                                    ? `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")}`
                                    : "Invalid date range"}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    block.status === "blocked"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {block.status}
                                </span>
                              </div>
                            );
                          })}
                          {space.availability.length > 3 && (
                            <p className="text-xs text-blue-600">
                              +{space.availability.length - 3} more blocks
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default VenuePartnerDashboard;
