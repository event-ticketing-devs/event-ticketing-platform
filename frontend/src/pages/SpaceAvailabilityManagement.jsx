import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

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
    const message = isBooking
      ? "This block is linked to a booking. Removing it will cancel the booking and return the enquiry to 'quoted' status. Continue?"
      : "Are you sure you want to remove this block?";
    
    if (!window.confirm(message)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/spaces/${spaceId}/unblock/${blockId}`);
      
      if (response.data.wasBooking) {
        toast.success("Booking cancelled and block removed successfully");
      } else {
        toast.success("Block removed successfully");
      }
      
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!space || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Space not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/venue-partner/venues/${venue._id}/spaces`)}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Spaces
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Availability Management
          </h1>
          <p className="text-gray-600 mt-2">
            {space.name} - {venue.name}
          </p>
        </div>

        {/* Space Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Space Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-gray-900 font-medium capitalize">
                {space.type}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="text-gray-900 font-medium">{space.maxPax} guests</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Booking Unit</p>
              <p className="text-gray-900 font-medium capitalize">
                {space.bookingUnit}
              </p>
            </div>
          </div>
        </div>

        {/* Add Block Button */}
        {!showBlockForm && (
          <button
            onClick={() => setShowBlockForm(true)}
            className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Block Availability
          </button>
        )}

        {/* Block Form */}
        {showBlockForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Block Availability
              </h2>
              <button
                onClick={() => {
                  setShowBlockForm(false);
                  setBlockForm({ startDate: "", endDate: "", reason: "" });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={blockForm.startDate}
                    min={getTodayString()}
                    onChange={(e) =>
                      setBlockForm({ ...blockForm, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={blockForm.endDate}
                    min={blockForm.startDate || getTodayString()}
                    onChange={(e) =>
                      setBlockForm({ ...blockForm, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={blockForm.reason}
                  onChange={(e) =>
                    setBlockForm({ ...blockForm, reason: e.target.value })
                  }
                  placeholder="E.g., Maintenance, Private event, etc."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Block Dates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockForm(false);
                    setBlockForm({ startDate: "", endDate: "", reason: "" });
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Blocks List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Blocked Dates
          </h2>

          {blocks.length === 0 ? (
            <div className="text-center py-12">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-4 text-gray-500">
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
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2 text-gray-900 font-medium">
                            <svg
                              className="h-5 w-5 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {isValidStart && isValidEnd
                              ? `${formatDate(block.start)} - ${formatDate(block.end)}`
                              : "Invalid date range"}
                          </div>
                          {block.status === "booked" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Booking
                            </span>
                          )}
                        </div>

                        {block.reason && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Reason:</span> {block.reason}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleUnblock(block._id, block.status === "booked")}
                        className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors text-sm font-medium"
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
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-blue-600 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-900 font-medium">
                About Availability Blocks
              </p>
              <p className="text-sm text-blue-700 mt-1">
                When you block dates, this space won't appear in search results
                for those dates. Use this for maintenance, private bookings, or
                any other reason you need to make the space unavailable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
