import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Building2, Calendar, CheckCircle2, XCircle, Clock, ChevronLeft, FileText, Users } from "lucide-react";

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

  const getStatusBadge = (status) => {
    const config = {
      open: { bg: "bg-secondary/10", text: "text-secondary", label: "Open" },
      quoted: { bg: "bg-primary/10", text: "text-primary", label: "Quoted" },
      declined: { bg: "bg-error/10", text: "text-error", label: "Declined" },
      externally_booked: { bg: "bg-success/10", text: "text-success", label: "Booked" },
    };
    const { bg, text, label } = config[status] || config.open;
    return (
      <span className={`px-3 py-1 rounded-md text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-lg text-error">Activity data not found</div>
      </div>
    );
  }

  const { venue, spaces, requests, quotes } = data;

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/venues")}
            className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Venues
          </button>
          
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{venue.name}</h1>
                <p className="text-text-secondary mt-1">{venue.city} • {venue.fullAddress}</p>
              </div>
              <span className={`px-4 py-2 rounded-md text-sm font-medium ${
                venue.verificationStatus === 'verified' ? 'bg-success/10 text-success' :
                venue.verificationStatus === 'suspended' ? 'bg-error/10 text-error' :
                'bg-warning/10 text-warning'
              } inline-flex items-center gap-1`}>
                {venue.verificationStatus === 'verified' ? (
                  <><CheckCircle2 className="w-3 h-3" /><span>Verified</span></>
                ) : venue.verificationStatus === 'suspended' ? (
                  <><XCircle className="w-3 h-3" /><span>Suspended</span></>
                ) : (
                  <><Clock className="w-3 h-3" /><span>Pending</span></>
                )}
              </span>
            </div>

            {/* Compact Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-text-secondary mb-1">Owner</p>
                <p className="text-sm font-medium text-text-primary">{venue.owner?.name || "N/A"}</p>
                {venue.owner?.isBanned && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium bg-error/10 text-error">
                    Banned
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Primary Contact</p>
                <p className="text-sm font-medium text-text-primary">{venue.primaryContact?.name || "N/A"}</p>
                <p className="text-xs text-text-secondary">{venue.primaryContact?.phone || "—"}</p>
                <p className="text-xs text-text-secondary">{venue.primaryContact?.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Registered</p>
                <p className="text-sm font-medium text-text-primary">
                  {format(new Date(venue.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Team Members</p>
                <p className="text-sm font-medium text-text-primary">
                  {venue.teamMembers?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-bg-primary border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{spaces.length}</p>
                <p className="text-xs text-text-secondary">Spaces</p>
              </div>
            </div>
          </div>

          <div className="bg-bg-primary border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{requests.length}</p>
                <p className="text-xs text-text-secondary">Requests</p>
              </div>
            </div>
          </div>

          <div className="bg-bg-primary border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg flex items-center justify-center">
                <span className="w-5 h-5 flex items-center justify-center text-xl text-warning">₹</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{quotes.length}</p>
                <p className="text-xs text-text-secondary">Quotes</p>
              </div>
            </div>
          </div>

          <div className="bg-bg-primary border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {requests.filter(r => r.status === 'externally_booked').length}
                </p>
                <p className="text-xs text-text-secondary">Booked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spaces */}
        <div className="bg-bg-primary border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Spaces ({spaces.length})
          </h2>
          
          {spaces.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-text-secondary mb-3" />
              <p className="text-sm text-text-secondary">No spaces added</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.map((space) => (
                <div key={space._id} className="p-4 border border-border rounded-lg hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-text-primary">{space.name}</h3>
                      <p className="text-xs text-text-secondary capitalize">{space.type} • {space.indoorOutdoor}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      space.isActive ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    }`}>
                      {space.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>{space.maxPax} guests</span>
                    {space.areaSqFt && <span>{space.areaSqFt} sq ft</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-bg-primary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Recent Requests ({requests.length})
            </h2>
            
            {/* Status Filter Pills */}
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-md text-xs font-medium">
                {requests.filter(r => r.status === 'open').length} Open
              </span>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                {requests.filter(r => r.status === 'quoted').length} Quoted
              </span>
              <span className="px-3 py-1 bg-success/10 text-success rounded-md text-xs font-medium">
                {requests.filter(r => r.status === 'externally_booked').length} Booked
              </span>
              <span className="px-3 py-1 bg-error/10 text-error rounded-md text-xs font-medium">
                {requests.filter(r => r.status === 'declined').length} Declined
              </span>
            </div>
          </div>
          
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-text-secondary mb-3" />
              <p className="text-sm text-text-secondary">No requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 15).map((request) => (
                <div
                  key={request._id}
                  className="p-4 border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">{request.eventName}</h3>
                      <p className="text-sm text-text-secondary">
                        {request.organizer?.name} • {request.organizer?.email}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{request.space?.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{format(new Date(request.eventDateStart), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>{request.expectedPax} guests</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{format(new Date(request.createdAt), "MMM d")}</span>
                    </div>
                  </div>

                  {request.status === "externally_booked" && request.bookedAt && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Booked on {format(new Date(request.bookedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}

                  {request.status === "declined" && request.declineReason && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-error flex items-start gap-2">
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{request.declineReason}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {requests.length > 15 && (
            <p className="text-sm text-text-secondary text-center mt-6 pt-6 border-t border-border">
              Showing 15 of {requests.length} requests
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
