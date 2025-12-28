import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

export default function AdminVenueActivity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/venues/${id}/activity`);
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load venue activity");
      navigate("/admin/venues");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      open: { bg: "bg-blue-100", text: "text-blue-800", label: "Open" },
      quoted: { bg: "bg-purple-100", text: "text-purple-800", label: "Quoted" },
      declined: { bg: "bg-red-100", text: "text-red-800", label: "Declined" },
      externally_booked: { bg: "bg-green-100", text: "text-green-800", label: "Booked" },
    };
    const { bg, text, label } = config[status] || config.open;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Activity data not found</div>
      </div>
    );
  }

  const { venue, spaces, requests, quotes, totalRevenue } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/venues")}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Venues
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{venue.name}</h1>
          <p className="text-gray-600 mt-2">{venue.city} | {venue.fullAddress}</p>
        </div>

        {/* Venue Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Venue Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Owner Details</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {venue.owner?.name || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {venue.owner?.email || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status:</span>{" "}
                {venue.owner?.isBanned ? (
                  <span className="text-red-600 font-semibold">Banned</span>
                ) : (
                  <span className="text-green-600 font-semibold">Active</span>
                )}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Primary Contact</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {venue.primaryContact?.name || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Phone:</span> {venue.primaryContact?.phone || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {venue.primaryContact?.email || "N/A"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Verification</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status:</span>{" "}
                <span className="capitalize">{venue.verificationStatus}</span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Registered:</span> {formatDate(venue.createdAt)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Team Members</h3>
              <p className="text-sm text-gray-600">
                {venue.teamMembers && venue.teamMembers.length > 0
                  ? `${venue.teamMembers.length} member(s)`
                  : "No team members"}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Spaces</p>
            <p className="text-3xl font-bold text-blue-600">{spaces.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Requests</p>
            <p className="text-3xl font-bold text-purple-600">{requests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Quotes Sent</p>
            <p className="text-3xl font-bold text-yellow-600">{quotes.length}</p>
          </div>
        </div>

        {/* Spaces */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Spaces ({spaces.length})</h2>
          {spaces.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No spaces added yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.map((space) => (
                <div key={space._id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{space.name}</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span>{" "}
                    <span className="capitalize">{space.type}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Capacity:</span> {space.maxPax} guests
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Booking:</span>{" "}
                    <span className="capitalize">{space.bookingUnit}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span>{" "}
                    <span className={space.isActive ? "text-green-600" : "text-red-600"}>
                      {space.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Requests ({requests.length})
          </h2>
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No requests yet</p>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 10).map((request) => (
                <div
                  key={request._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.eventName}</h3>
                      <p className="text-sm text-gray-600">
                        {request.organizer?.name} ({request.organizer?.email})
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Space:</span> {request.space?.name || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(request.eventDateStart).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div>
                      <span className="font-medium">Guests:</span> {request.expectedPax}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(request.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  {request.status === "externally_booked" && request.bookedAt && (
                    <p className="text-sm text-green-600 mt-2">
                      <span className="font-medium">Booked on:</span>{" "}
                      {new Date(request.bookedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}

                  {request.status === "declined" && request.declinedAt && (
                    <p className="text-sm text-red-600 mt-2">
                      <span className="font-medium">Declined on:</span>{" "}
                      {new Date(request.declinedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {request.declineReason && (
                        <span className="ml-2">- {request.declineReason}</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {requests.length > 10 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              Showing 10 of {requests.length} requests
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
