import React, { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Check, X, Building2, MapPin, User, Calendar, Flag } from 'lucide-react';

const REPORT_REASON_LABELS = {
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  scam_or_fraud: "Scam or Fraud",
  misleading_information: "Misleading Information",
  offensive_language: "Offensive Language",
  false_information: "False Information",
  safety_concerns: "Safety Concerns",
  other: "Other",
};

const STATUS_COLORS = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewed: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
  dismissed: "bg-bg-secondary text-text-secondary border-border",
};

export default function FlaggedVenuesPage() {
  const [flaggedVenues, setFlaggedVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFlaggedVenues();
  }, []);

  const fetchFlaggedVenues = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/venue-reports/venues/flagged");
      setFlaggedVenues(res.data);
    } catch (error) {
      toast.error("Failed to fetch flagged venues");
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status, adminNotes = "") => {
    try {
      await apiClient.patch(`/venue-reports/${reportId}`, {
        status,
        adminNotes,
      });
      
      toast.success("Report status updated successfully");
      fetchFlaggedVenues(); // Refresh data
    } catch (error) {
      toast.error("Failed to update report status");
    }
  };

  const viewReports = (venue) => {
    setSelectedVenue(venue);
    setShowReportsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full w-12 h-12 border-primary border-b-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Flagged Venues</h1>
              <p className="mt-1 text-text-secondary">Review and manage reported venues</p>
            </div>
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center gap-2 border border-border text-text-primary px-6 py-3 rounded-lg font-medium hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>

        {flaggedVenues.length === 0 ? (
          <div className="bg-bg-primary border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No Flagged Venues</h3>
            <p className="text-text-secondary">Great! There are currently no venues with reports.</p>
          </div>
        ) : (
          <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-bg-secondary border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-primary divide-y divide-border">
                  {flaggedVenues.map((venue) => {
                    const pendingReports = venue.reports.filter(r => r.status === 'pending').length;
                    const totalReports = venue.reports.length;
                    
                    return (
                      <tr key={venue._id} className="hover:bg-bg-secondary transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-text-primary">{venue.name}</div>
                              <div className="flex items-center gap-1 text-sm text-text-secondary">
                                <MapPin className="w-3 h-3" />
                                {venue.city}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-text-secondary" />
                            <div>
                              <div className="text-sm text-text-primary">{venue.owner?.name || 'N/A'}</div>
                              <div className="text-xs text-text-secondary">{venue.owner?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Flag className="w-4 h-4 text-error" />
                            <span className="font-semibold text-error">{totalReports}</span>
                            {pendingReports > 0 && (
                              <span className="px-2 py-1 text-xs font-medium bg-warning/10 text-warning border border-warning/20 rounded">
                                {pendingReports} pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium border rounded ${
                            venue.verificationStatus === 'verified' 
                              ? 'bg-success/10 text-success border-success/20' 
                              : venue.verificationStatus === 'suspended'
                              ? 'bg-error/10 text-error border-error/20'
                              : 'bg-warning/10 text-warning border-warning/20'
                          }`}>
                            {venue.verificationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewReports(venue)}
                              className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors cursor-pointer"
                            >
                              View Reports
                            </button>
                            <button
                              onClick={() => navigate(`/admin/venues`)}
                              className="px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-secondary border border-border rounded-lg transition-colors cursor-pointer"
                            >
                              Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reports Modal */}
      {showReportsModal && selectedVenue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-primary">
                Reports for {selectedVenue.name}
              </h2>
              <button
                onClick={() => setShowReportsModal(false)}
                className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {selectedVenue.reports.map((report) => (
                  <div key={report._id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium border rounded ${STATUS_COLORS[report.status]}`}>
                          {report.status}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-sm font-medium text-text-primary">Reason: </span>
                      <span className="text-sm text-text-secondary">{REPORT_REASON_LABELS[report.reason]}</span>
                    </div>
                    
                    {report.description && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-text-primary">Description: </span>
                        <p className="text-sm text-text-secondary mt-1">{report.description}</p>
                      </div>
                    )}
                    
                    <div className="text-sm text-text-secondary mb-3">
                      Reported by: {report.userId?.name || 'Anonymous'}
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <button
                          onClick={() => updateReportStatus(report._id, 'reviewed')}
                          className="px-3 py-1.5 text-sm font-medium bg-primary text-bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          Mark as Reviewed
                        </button>
                        <button
                          onClick={() => updateReportStatus(report._id, 'resolved')}
                          className="px-3 py-1.5 text-sm font-medium bg-success text-bg-primary rounded-lg hover:bg-success/90 transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => updateReportStatus(report._id, 'dismissed')}
                          className="px-3 py-1.5 text-sm font-medium bg-bg-secondary text-text-primary border border-border rounded-lg hover:bg-bg-secondary/80 transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
