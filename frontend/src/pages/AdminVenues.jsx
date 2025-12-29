import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { getAmenityLabel } from "../constants/venueConstants";
import ConfirmModal from "../components/ConfirmModal";
import { Building2, X, CheckCircle2, Clock, XCircle } from "lucide-react";

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
  const [verifyConfirm, setVerifyConfirm] = useState({ open: false, venueId: null });
  const [suspendConfirm, setSuspendConfirm] = useState({ open: false, venueId: null, reason: "" });
  const [unsuspendConfirm, setUnsuspendConfirm] = useState({ open: false, venueId: null });

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
    setVerifyConfirm({ open: true, venueId });
  };

  const confirmVerify = async () => {
    try {
      await apiClient.patch(`/admin/venues/${verifyConfirm.venueId}/verify`);
      toast.success("Venue verified successfully");
      setVerifyConfirm({ open: false, venueId: null });
      fetchVenues();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify venue");
    }
  };

  const handleSuspend = async (venueId) => {
    setSuspendConfirm({ open: true, venueId, reason: "" });
  };

  const confirmSuspend = async () => {
    if (!suspendConfirm.reason.trim()) {
      toast.error("Suspension reason is required");
      return;
    }

    try {
      await apiClient.patch(`/admin/venues/${suspendConfirm.venueId}/suspend`, { reason: suspendConfirm.reason });
      toast.success("Venue suspended successfully");
      setSuspendConfirm({ open: false, venueId: null, reason: "" });
      fetchVenues();
    } catch (err) {
      console.error("Suspend error:", err);
      toast.error(err.response?.data?.message || "Failed to suspend venue");
    }
  };

  const handleUnsuspend = async (venueId) => {
    setUnsuspendConfirm({ open: true, venueId });
  };

  const confirmUnsuspend = async () => {
    try {
      await apiClient.patch(`/admin/venues/${unsuspendConfirm.venueId}/unsuspend`);
      toast.success("Venue reinstated successfully");
      setUnsuspendConfirm({ open: false, venueId: null });
      fetchVenues();
    } catch (err) {
      console.error("Unsuspend error:", err);
      toast.error(err.response?.data?.message || "Failed to reinstate venue");
    }
  };

  const handleViewDetails = async (venue) => {
    setViewingVenue(venue);
    setShowDetailsModal(true);
    
    // Fetch spaces for this venue
    try {
      const res = await apiClient.get(`/spaces/search?venueId=${venue._id}`);
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
      verified: { bg: "bg-success/10", text: "text-success", icon: <CheckCircle2 className="w-3 h-3" />, label: "Verified" },
      unverified: { bg: "bg-warning/10", text: "text-warning", icon: <Clock className="w-3 h-3" />, label: "Pending" },
      suspended: { bg: "bg-error/10", text: "text-error", icon: <XCircle className="w-3 h-3" />, label: "Suspended" },
    };
    const { bg, text, icon, label } = config[status] || config.unverified;
    return (
      <span className={`px-3 py-1 rounded-md text-xs font-medium ${bg} ${text} inline-flex items-center gap-1`}>
        {icon}
        <span>{label}</span>
      </span>
    );
  };

  const stats = venues.reduce((acc, v) => {
    acc[v.verificationStatus] = (acc[v.verificationStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Venue Management</h1>
            <p className="mt-1 text-text-secondary">Manage and verify venues on the platform</p>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && venues.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-primary border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-text-primary">{venues.length}</p>
              <p className="text-sm text-text-secondary mt-1">Total Venues</p>
            </div>
            <div className="bg-bg-primary border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-success">{stats.verified || 0}</p>
              <p className="text-sm text-text-secondary mt-1">Verified</p>
            </div>
            <div className="bg-bg-primary border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-warning">{stats.unverified || 0}</p>
              <p className="text-sm text-text-secondary mt-1">Pending</p>
            </div>
            <div className="bg-bg-primary border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-error">{stats.suspended || 0}</p>
              <p className="text-sm text-text-secondary mt-1">Suspended</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-bg-primary border border-border rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="unverified">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                City
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="Filter by city..."
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by name..."
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Venues List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : venues.length === 0 ? (
          <div className="bg-bg-primary border border-border rounded-lg p-12 text-center">
            <Building2 className="mx-auto h-16 w-16 text-text-secondary mb-4" />
            <p className="text-text-secondary text-lg">No venues found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {venues.map((venue) => (
              <div 
                key={venue._id} 
                className="bg-bg-primary border border-border rounded-lg p-6 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex gap-6">
                  {/* Venue Photo */}
                  {venue.photo && (
                    <img
                      src={venue.photo}
                      alt={venue.name}
                      className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                    />
                  )}

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-text-primary">
                            {venue.name}
                          </h3>
                          {getStatusBadge(venue.verificationStatus)}
                          {venue.owner?.isBanned && (
                            <span className="px-3 py-1 rounded-md text-xs font-medium bg-text-primary text-bg-primary">
                              Owner Banned
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">
                          {venue.city} • {venue.fullAddress}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-text-secondary">Owner</p>
                        <p className="text-sm font-medium text-text-primary">{venue.owner?.name || "N/A"}</p>
                        <p className="text-xs text-text-secondary">{venue.owner?.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Registered</p>
                        <p className="text-sm font-medium text-text-primary">
                          {new Date(venue.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Spaces</p>
                        <p className="text-sm font-medium text-text-primary">
                          {venue.statistics?.totalSpaces || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Bookings</p>
                        <p className="text-sm font-medium text-text-primary">
                          {venue.statistics?.externallyBooked || 0} / {venue.statistics?.totalRequests || 0}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(venue)}
                        className="px-4 py-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer text-sm font-medium"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => navigate(`/admin/venues/${venue._id}/activity`)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors cursor-pointer text-sm font-medium"
                      >
                        Activity Log
                      </button>

                      {venue.verificationStatus === "unverified" && (
                        <button
                          onClick={() => handleVerify(venue._id)}
                          className="px-4 py-2 bg-success text-bg-primary rounded-lg hover:bg-success/90 transition-colors cursor-pointer text-sm font-medium"
                        >
                          Verify
                        </button>
                      )}

                      {venue.verificationStatus === "suspended" ? (
                        <button
                          onClick={() => handleUnsuspend(venue._id)}
                          className="px-4 py-2 bg-success text-bg-primary rounded-lg hover:bg-success/90 transition-colors cursor-pointer text-sm font-medium"
                        >
                          Reinstate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(venue._id)}
                          className="px-4 py-2 bg-error text-bg-primary rounded-lg hover:bg-error/90 transition-colors cursor-pointer text-sm font-medium"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Venue Details Modal */}
        {showDetailsModal && viewingVenue && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-bg-primary rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-bg-primary border-b border-border px-6 py-4 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{viewingVenue.name}</h2>
                  <p className="text-text-secondary mt-1">{viewingVenue.city}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Venue Photo */}
                {viewingVenue.photo && (
                  <div className="mb-6">
                    <img
                      src={viewingVenue.photo}
                      alt={viewingVenue.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Venue Information */}
                  <div className="lg:col-span-2 bg-bg-secondary p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Venue Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-text-secondary">Full Address</p>
                        <p className="font-medium text-text-primary">{viewingVenue.fullAddress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">City</p>
                        <p className="font-medium text-text-primary">{viewingVenue.city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Status</p>
                        <p className="font-medium text-text-primary capitalize">{viewingVenue.verificationStatus}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Listed</p>
                        <p className="font-medium text-text-primary">{viewingVenue.isListed ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* Parking */}
                    {viewingVenue.parking && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-text-secondary mb-2">Parking</p>
                        <p className="text-sm font-medium text-text-primary inline-flex items-center gap-1">
                          {viewingVenue.parking.available ? (
                            <><CheckCircle2 className="w-4 h-4 text-success" /><span>Available</span></>
                          ) : (
                            <><XCircle className="w-4 h-4 text-error" /><span>Not Available</span></>
                          )}
                        </p>
                        {viewingVenue.parking.notes && (
                          <p className="text-xs text-text-secondary mt-1">{viewingVenue.parking.notes}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contact & Owner */}
                  <div className="space-y-6">
                    {/* Primary Contact */}
                    {viewingVenue.primaryContact && (
                      <div className="bg-bg-secondary p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Primary Contact</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-text-secondary">Name</p>
                            <p className="text-sm font-medium text-text-primary">{viewingVenue.primaryContact.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Phone</p>
                            <p className="text-sm font-medium text-text-primary">{viewingVenue.primaryContact.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Email</p>
                            <p className="text-sm font-medium text-text-primary">{viewingVenue.primaryContact.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Owner Information */}
                    {viewingVenue.owner && (
                      <div className="bg-bg-secondary p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Owner</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-text-secondary">Name</p>
                            <p className="text-sm font-medium text-text-primary">{viewingVenue.owner.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Email</p>
                            <p className="text-sm font-medium text-text-primary">{viewingVenue.owner.email}</p>
                          </div>
                          {viewingVenue.owner.isBanned && (
                            <div className="pt-2">
                              <span className="px-3 py-1 rounded-md text-xs font-medium bg-error/10 text-error inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                <span>Owner Banned</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                {viewingVenue.statistics && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-secondary/10 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-secondary">{viewingVenue.statistics.totalRequests || 0}</p>
                      <p className="text-sm text-text-secondary">Total Requests</p>
                    </div>
                    <div className="bg-success/10 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-success">{viewingVenue.statistics.externallyBooked || 0}</p>
                      <p className="text-sm text-text-secondary">Bookings</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{viewingVenue.statistics.totalSpaces || 0}</p>
                      <p className="text-sm text-text-secondary">Total Spaces</p>
                    </div>
                  </div>
                )}

                {/* Spaces */}
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Spaces ({venueSpaces.length})
                  </h3>
                  {venueSpaces.length === 0 ? (
                    <div className="bg-bg-secondary p-8 rounded-lg text-center">
                      <p className="text-text-secondary">No spaces added yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {venueSpaces.map((space) => (
                        <div key={space._id} className="border border-border rounded-lg overflow-hidden">
                          {/* Space Photos */}
                          {space.photos && space.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 p-2 bg-bg-secondary">
                              {space.photos.slice(0, 3).map((photo, idx) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt={`${space.name} ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                          
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-text-primary">{space.name}</h4>
                                <p className="text-sm text-text-secondary capitalize">{space.type} • {space.indoorOutdoor}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                space.isActive ? "bg-success/10 text-success" : "bg-error/10 text-error"
                              }`}>
                                {space.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-text-secondary text-xs">Capacity</span>
                                <p className="font-medium text-text-primary">{space.maxPax} people</p>
                              </div>
                              {space.areaSqFt && (
                                <div>
                                  <span className="text-text-secondary text-xs">Area</span>
                                  <p className="font-medium text-text-primary">{space.areaSqFt} sq ft</p>
                                </div>
                              )}
                            </div>

                            {/* Amenities */}
                            {space.amenities?.standard && space.amenities.standard.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-text-secondary mb-2">Amenities</p>
                                <div className="flex flex-wrap gap-1">
                                  {space.amenities.standard.slice(0, 3).map((item, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-success/10 text-success rounded-md text-xs">
                                      {getAmenityLabel(item)}
                                    </span>
                                  ))}
                                  {space.amenities.standard.length > 3 && (
                                    <span className="text-xs text-text-secondary">
                                      +{space.amenities.standard.length - 3} more
                                    </span>
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
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-bg-secondary border-t border-border px-6 py-4 flex justify-between">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-bg-primary border border-border text-text-primary rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
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
                      className="px-6 py-2 bg-success text-bg-primary rounded-lg hover:bg-success/90 transition-colors cursor-pointer"
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
                      className="px-6 py-2 bg-success text-bg-primary rounded-lg hover:bg-success/90 transition-colors cursor-pointer"
                    >
                      Reinstate Venue
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleSuspend(viewingVenue._id);
                      }}
                      className="px-6 py-2 bg-error text-bg-primary rounded-lg hover:bg-error/90 transition-colors cursor-pointer"
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

      {/* Verify Confirmation Modal */}
      <ConfirmModal
        open={verifyConfirm.open}
        title="Verify Venue"
        description="Are you sure you want to verify this venue? Once verified, it will be visible to users for booking."
        onClose={() => setVerifyConfirm({ open: false, venueId: null })}
        onConfirm={confirmVerify}
        confirmText="Verify"
        cancelText="Cancel"
        variant="info"
      />

      {/* Suspend Confirmation Modal */}
      <ConfirmModal
        open={suspendConfirm.open}
        title="Suspend Venue"
        description="Please provide a reason for suspending this venue. This information will be shared with the venue owner."
        onClose={() => setSuspendConfirm({ open: false, venueId: null, reason: "" })}
        onConfirm={confirmSuspend}
        confirmText="Suspend"
        cancelText="Cancel"
        variant="danger"
        showInput={true}
        inputValue={suspendConfirm.reason}
        setInputValue={(value) => setSuspendConfirm(prev => ({ ...prev, reason: value }))}
      />

      {/* Unsuspend Confirmation Modal */}
      <ConfirmModal
        open={unsuspendConfirm.open}
        title="Reinstate Venue"
        description="Are you sure you want to reinstate this venue? It will become active and visible to users again."
        onClose={() => setUnsuspendConfirm({ open: false, venueId: null })}
        onConfirm={confirmUnsuspend}
        confirmText="Reinstate"
        cancelText="Cancel"
        variant="info"
      />
    </div>
  );
}
