import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { getAmenityLabel, getPolicyItemLabel } from "../constants/venueConstants";

export default function AdminVenues() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    city: "",
    search: "",
  });
  const [viewingVenue, setViewingVenue] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [venueSpaces, setVenueSpaces] = useState([]);

  useEffect(() => {
    fetchVenues();
  }, [filters]);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.city) params.append("city", filters.city);
      if (filters.search) params.append("search", filters.search);

      const res = await apiClient.get(`/admin/venues?${params.toString()}`);
      setVenues(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (venueId) => {
    if (!window.confirm("Are you sure you want to verify this venue?")) {
      return;
    }

    try {
      await apiClient.patch(`/admin/venues/${venueId}/verify`);
      toast.success("Venue verified successfully");
      fetchVenues();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify venue");
    }
  };

  const handleSuspend = async (venueId) => {
    const reason = window.prompt("Enter suspension reason:");
    if (!reason || !reason.trim()) {
      toast.error("Suspension reason is required");
      return;
    }

    if (!window.confirm("Are you sure you want to suspend this venue?")) {
      return;
    }

    try {
      await apiClient.patch(`/admin/venues/${venueId}/suspend`, { reason });
      toast.success("Venue suspended successfully");
      fetchVenues();
    } catch (err) {
      console.error("Suspend error:", err);
      toast.error(err.response?.data?.message || "Failed to suspend venue");
    }
  };

  const handleUnsuspend = async (venueId) => {
    if (!window.confirm("Are you sure you want to reinstate this venue?")) {
      return;
    }

    try {
      await apiClient.patch(`/admin/venues/${venueId}/unsuspend`);
      toast.success("Venue reinstated successfully");
      fetchVenues();
    } catch (err) {
      console.error("Unsuspend error:", err);
      toast.error(err.response?.data?.message || "Failed to reinstate venue");
    }
  };

  const handleViewDetails = async (venue) => {
    setViewingVenue(venue);
    setShowDetailsModal(true);
    
    // Fetch spaces for this venue using the search endpoint
    try {
      const res = await apiClient.get(`/spaces/search?venueId=${venue._id}`);
      // Filter to only this venue's spaces (in case backend doesn't filter)
      const filteredSpaces = res.data.filter(space => 
        (space.venue._id === venue._id || space.venue === venue._id)
      );
      setVenueSpaces(filteredSpaces);
    } catch (err) {
      console.error("Error fetching spaces:", err);
      setVenueSpaces([]);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      verified: { bg: "bg-green-100", text: "text-green-800", label: "Verified" },
      unverified: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Unverified" },
      suspended: { bg: "bg-red-100", text: "text-red-800", label: "Suspended" },
    };
    const { bg, text, label } = config[status] || config.unverified;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Venue Management</h1>
          <p className="text-gray-600 mt-2">Manage and verify venues on the platform</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="Filter by city..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by name or address..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Venues List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : venues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="mt-4 text-gray-500">No venues found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {venues.map((venue) => (
              <div key={venue._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {venue.name}
                      </h3>
                      {getStatusBadge(venue.verificationStatus)}
                      {venue.owner?.isBanned && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-white">
                          Owner Banned
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">City:</span> {venue.city}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Address:</span> {venue.fullAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Owner:</span>{" "}
                          {venue.owner?.name || "N/A"} ({venue.owner?.email || "N/A"})
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Registered:</span>{" "}
                          {new Date(venue.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="flex gap-6 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Spaces:</span>{" "}
                        <span className="font-semibold text-gray-900">
                          {venue.statistics?.totalSpaces || 0}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Total Requests:</span>{" "}
                        <span className="font-semibold text-gray-900">
                          {venue.statistics?.totalRequests || 0}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Bookings:</span>{" "}
                        <span className="font-semibold text-gray-900">
                          {venue.statistics?.externallyBooked || 0}
                        </span>
                      </div>
                    </div>

                    {/* Primary Contact */}
                    {venue.primaryContact && (
                      <div className="text-sm text-gray-600 border-t pt-3">
                        <span className="font-medium">Primary Contact:</span>{" "}
                        {venue.primaryContact.name || "N/A"} |{" "}
                        {venue.primaryContact.phone || "N/A"} |{" "}
                        {venue.primaryContact.email || "N/A"}
                      </div>
                    )}
                    {!venue.primaryContact && (
                      <div className="text-sm text-gray-500 border-t pt-3 italic">
                        No primary contact information available
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleViewDetails(venue)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => navigate(`/admin/venues/${venue._id}/activity`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                    >
                      View Activity
                    </button>

                    {venue.verificationStatus === "unverified" && (
                      <button
                        onClick={() => handleVerify(venue._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                      >
                        Verify
                      </button>
                    )}

                    {venue.verificationStatus === "suspended" ? (
                      <button
                        onClick={() => handleUnsuspend(venue._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                      >
                        Reinstate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspend(venue._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && venues.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{venues.length}</p>
                <p className="text-sm text-gray-600">Total Venues</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {venues.filter((v) => v.verificationStatus === "verified").length}
                </p>
                <p className="text-sm text-gray-600">Verified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {venues.filter((v) => v.verificationStatus === "unverified").length}
                </p>
                <p className="text-sm text-gray-600">Unverified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {venues.filter((v) => v.verificationStatus === "suspended").length}
                </p>
                <p className="text-sm text-gray-600">Suspended</p>
              </div>
            </div>
          </div>
        )}

        {/* Venue Details Modal */}
        {showDetailsModal && viewingVenue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewingVenue.name}</h2>
                  <p className="text-gray-600 mt-1">{viewingVenue.city}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Venue Photo */}
                {viewingVenue.photo && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Venue Photo</h3>
                    <img
                      src={viewingVenue.photo}
                      alt={viewingVenue.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Venue Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Venue Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Full Address</p>
                      <p className="font-medium text-gray-900">{viewingVenue.fullAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-medium text-gray-900">{viewingVenue.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-medium text-gray-900 capitalize">{viewingVenue.verificationStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Listed</p>
                      <p className="font-medium text-gray-900">{viewingVenue.isListed ? "Yes" : "No"}</p>
                    </div>
                  </div>
                </div>

                {/* Parking */}
                {viewingVenue.parking && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Parking</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Available: <span className="font-medium text-gray-900">{viewingVenue.parking.available ? "Yes" : "No"}</span></p>
                      {viewingVenue.parking.notes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: <span className="font-medium text-gray-900">{viewingVenue.parking.notes}</span></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Primary Contact */}
                {viewingVenue.primaryContact && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Contact</h3>
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">{viewingVenue.primaryContact.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{viewingVenue.primaryContact.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{viewingVenue.primaryContact.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Owner Information */}
                {viewingVenue.owner && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Owner Information</h3>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">{viewingVenue.owner.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{viewingVenue.owner.email}</p>
                      </div>
                      {viewingVenue.owner.isBanned && (
                        <div className="col-span-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Owner is Banned
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Spaces */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Spaces ({venueSpaces.length})
                  </h3>
                  {venueSpaces.length === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <p className="text-gray-500">No spaces added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {venueSpaces.map((space) => (
                        <div key={space._id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Space Photos */}
                          {space.photos && space.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50">
                              {space.photos.map((photo, idx) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt={`${space.name} - ${idx + 1}`}
                                  className="w-full h-32 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                          
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{space.name}</h4>
                                <p className="text-sm text-gray-600 capitalize">{space.type} • {space.indoorOutdoor}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                space.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}>
                                {space.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                              <div>
                                <span className="text-gray-600">Capacity:</span>
                                <p className="font-medium">{space.maxPax} people</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Area:</span>
                                <p className="font-medium">{space.areaSqFt} sq ft</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Booking:</span>
                                <p className="font-medium capitalize">{space.bookingUnit}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Event Types:</span>
                                <p className="font-medium">{space.supportedEventTypes?.length || 0}</p>
                              </div>
                            </div>

                            {/* Amenities */}
                            {((space.amenities?.standard && space.amenities.standard.length > 0) || 
                              (space.amenities?.custom && space.amenities.custom.length > 0)) && (
                              <div className="mb-3">
                                <span className="text-sm text-gray-600 font-medium">Amenities: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {space.amenities.standard?.map((item, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                                      {getAmenityLabel(item)}
                                    </span>
                                  ))}
                                  {space.amenities.custom?.map((item, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Policies */}
                            {((space.policies?.allowedItems?.standard && space.policies.allowedItems.standard.length > 0) ||
                              (space.policies?.allowedItems?.custom && space.policies.allowedItems.custom.length > 0) ||
                              (space.policies?.bannedItems?.standard && space.policies.bannedItems.standard.length > 0) ||
                              (space.policies?.bannedItems?.custom && space.policies.bannedItems.custom.length > 0)) && (
                              <div className="border-t pt-3">
                                <span className="text-sm text-gray-600 font-medium">Policies:</span>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                  {((space.policies?.allowedItems?.standard && space.policies.allowedItems.standard.length > 0) ||
                                    (space.policies?.allowedItems?.custom && space.policies.allowedItems.custom.length > 0)) && (
                                    <div>
                                      <p className="text-xs text-green-700 font-medium mb-1">✓ Allowed</p>
                                      <div className="flex flex-wrap gap-1">
                                        {space.policies.allowedItems.standard?.map((item, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                            {getPolicyItemLabel(item)}
                                          </span>
                                        ))}
                                        {space.policies.allowedItems.custom?.map((item, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {((space.policies?.bannedItems?.standard && space.policies.bannedItems.standard.length > 0) ||
                                    (space.policies?.bannedItems?.custom && space.policies.bannedItems.custom.length > 0)) && (
                                    <div>
                                      <p className="text-xs text-red-700 font-medium mb-1">✗ Not Allowed</p>
                                      <div className="flex flex-wrap gap-1">
                                        {space.policies.bannedItems.standard?.map((item, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                                            {getPolicyItemLabel(item)}
                                          </span>
                                        ))}
                                        {space.policies.bannedItems.custom?.map((item, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Statistics */}
                {viewingVenue.statistics && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">{viewingVenue.statistics.totalRequests || 0}</p>
                        <p className="text-sm text-gray-600">Total Requests</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{viewingVenue.statistics.externallyBooked || 0}</p>
                        <p className="text-sm text-gray-600">Bookings</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">{viewingVenue.statistics.totalSpaces || 0}</p>
                        <p className="text-sm text-gray-600">Total Spaces</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <div className="flex gap-2">
                  {viewingVenue.verificationStatus === "unverified" && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleVerify(viewingVenue._id);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Verify Venue
                    </button>
                  )}
                  {viewingVenue.verificationStatus === "suspended" ? (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleUnsuspend(viewingVenue._id);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Reinstate Venue
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleSuspend(viewingVenue._id);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Suspend Venue
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
