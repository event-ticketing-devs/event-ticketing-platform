import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import toast from "react-hot-toast";
import ConfirmModal from "../../../common/components/ConfirmModal";
import { ArrowLeft, Plus, Calendar, X, Info } from 'lucide-react';

export default function SpaceAvailabilityManagement() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [space, setSpace] = useState(null);
  const [venue, setVenue] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [unblockConfirm, setUnblockConfirm] = useState({ open: false, blockId: null, isBooking: false });

  useEffect(() => {
    fetchData();
  }, [spaceId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch space details
      const spaceRes = await apiClient.get(`/spaces/${spaceId}`);
      setSpace(spaceRes.data);

      // Extract venue ID (handle both populated object and ObjectId string)
      const venueId = typeof spaceRes.data.venue === 'object' 
        ? spaceRes.data.venue._id 
        : spaceRes.data.venue;

      // Fetch venue details
      const venueRes = await apiClient.get(`/venues/${venueId}`);
      setVenue(venueRes.data);

      // Fetch availability blocks
      const blocksRes = await apiClient.get(`/spaces/${spaceId}/blocks`);
      setBlocks(blocksRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load data");
      navigate("/venue-partner");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!blockForm.startDate || !blockForm.endDate) {
      return toast.error("Start date and end date are required");
    }

    const start = new Date(blockForm.startDate);
    const end = new Date(blockForm.endDate);

    if (end <= start) {
      return toast.error("End date must be after start date");
    }

    try {
      await apiClient.post(`/spaces/${spaceId}/block`, {
        startDate: blockForm.startDate,
        endDate: blockForm.endDate,
        reason: blockForm.reason,
      });

      toast.success("Availability blocked successfully");
      setBlockForm({ startDate: "", endDate: "", reason: "" });
      setShowBlockForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to block availability");
    }
  };

  const handleUnblock = async (blockId, isBooking) => {
    setUnblockConfirm({ open: true, blockId, isBooking });
  };

  const confirmUnblock = async () => {
    try {
      const response = await apiClient.delete(`/spaces/${spaceId}/unblock/${unblockConfirm.blockId}`);
      
      if (response.data.wasBooking) {
        toast.success("Booking cancelled and block removed successfully");
      } else {
        toast.success("Block removed successfully");
      }
      
      setUnblockConfirm({ open: false, blockId: null, isBooking: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove block");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!space || !venue) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-lg text-error">Space not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/venue-partner/venues/${venue._id}/spaces`)}
            className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Spaces
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Availability Management
            </h1>
            <p className="text-text-secondary mt-2">
              {space.name} - {venue.name}
            </p>
          </div>
        </div>

        {/* Space Info Card */}
        <div className="bg-bg-primary border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Space Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Type</p>
              <p className="text-text-primary font-medium capitalize">
                {space.type}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Capacity</p>
              <p className="text-text-primary font-medium">{space.maxPax} guests</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Booking Unit</p>
              <p className="text-text-primary font-medium capitalize">
                {space.bookingUnit}
              </p>
            </div>
            {space.priceRange && (
              <div>
                <p className="text-sm text-text-secondary mb-1">Price Range</p>
                <p className="text-primary font-semibold">
                  ₹{space.priceRange.min.toLocaleString('en-IN')} - ₹{space.priceRange.max.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-text-secondary">
                  per {space.bookingUnit === 'hour' ? 'hour' : space.bookingUnit === 'half-day' ? 'half day' : 'full day'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add Block Button */}
        {!showBlockForm && (
          <button
            onClick={() => setShowBlockForm(true)}
            className="mb-6 inline-flex items-center gap-2 bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium"
          >
            <Plus className="w-5 h-5" />
            Block Availability
          </button>
        )}

        {/* Block Form */}
        {showBlockForm && (
          <div className="bg-bg-primary border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                Block Availability
              </h2>
              <button
                onClick={() => {
                  setShowBlockForm(false);
                  setBlockForm({ startDate: "", endDate: "", reason: "" });
                }}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleBlockSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Start Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={blockForm.startDate}
                    min={getTodayString()}
                    onChange={(e) =>
                      setBlockForm({ ...blockForm, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    End Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={blockForm.endDate}
                    min={blockForm.startDate || getTodayString()}
                    onChange={(e) =>
                      setBlockForm({ ...blockForm, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={blockForm.reason}
                  onChange={(e) =>
                    setBlockForm({ ...blockForm, reason: e.target.value })
                  }
                  placeholder="E.g., Maintenance, Private event, etc."
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-primary text-bg-primary px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium"
                >
                  Block Dates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockForm(false);
                    setBlockForm({ startDate: "", endDate: "", reason: "" });
                  }}
                  className="bg-bg-secondary border border-border text-text-primary px-6 py-2 rounded-lg hover:bg-bg-secondary/80 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Blocks List */}
        <div className="bg-bg-primary border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Blocked Dates
          </h2>

          {blocks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-16 w-16 text-text-secondary mb-4" />
              <p className="text-text-secondary text-lg">
                No blocked dates. This space is fully available.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => {
                const startDate = block.start ? new Date(block.start) : null;
                const endDate = block.end ? new Date(block.end) : null;
                const isValidStart = startDate && !isNaN(startDate.getTime());
                const isValidEnd = endDate && !isNaN(endDate.getTime());
                
                return (
                  <div
                    key={block._id}
                    className="border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2 text-text-primary font-medium">
                            <Calendar className="h-5 w-5 text-primary" />
                            {isValidStart && isValidEnd
                              ? `${formatDate(block.start)} - ${formatDate(block.end)}`
                              : "Invalid date range"}
                          </div>
                          {block.status === "booked" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-success/10 text-success">
                              Booking
                            </span>
                          )}
                        </div>

                        {block.reason && (
                          <p className="text-sm text-text-secondary mt-2">
                            <span className="font-medium">Reason:</span> {block.reason}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleUnblock(block._id, block.status === "booked")}
                        className="ml-4 text-error hover:text-error/80 hover:bg-error/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                      >
                        {block.status === "booked" ? "Cancel Booking" : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-secondary/10 border border-secondary/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-text-primary font-medium mb-1">
                About Availability Blocks
              </p>
              <p className="text-sm text-text-secondary">
                When you block dates, this space won't appear in search results
                for those dates. Use this for maintenance, private bookings, or
                any other reason you need to make the space unavailable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unblock Confirmation Modal */}
      <ConfirmModal
        open={unblockConfirm.open}
        title={unblockConfirm.isBooking ? "Cancel Booking & Remove Block" : "Remove Block"}
        description={
          unblockConfirm.isBooking
            ? "This block is linked to a booking. Removing it will cancel the booking and return the enquiry to 'quoted' status. Are you sure you want to continue?"
            : "Are you sure you want to remove this availability block? This space will become available for bookings during this period."
        }
        onClose={() => setUnblockConfirm({ open: false, blockId: null, isBooking: false })}
        onConfirm={confirmUnblock}
        confirmText="Remove"
        cancelText="Cancel"
        variant={unblockConfirm.isBooking ? "danger" : "warning"}
      />
    </div>
  );
}
