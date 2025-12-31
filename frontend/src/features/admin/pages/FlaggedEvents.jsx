import React, { useEffect, useState } from "react";
import EventDetailsModal from "../../events/components/EventDetailsModal";
import ConfirmModal from "../../../common/components/ConfirmModal";
import OrganizerActions from "../../organizer/components/OrganizerActions";
import apiClient from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Check, X } from 'lucide-react';

const REPORT_REASON_LABELS = {
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  scam_or_fraud: "Scam or Fraud",
  misleading_information: "Misleading Information",
  offensive_language: "Offensive Language",
  copyright_violation: "Copyright Violation",
  other: "Other",
};

const STATUS_COLORS = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewed: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
  dismissed: "bg-bg-secondary text-text-secondary border-border",
};

export default function FlaggedEventsPage() {
  const [flaggedEvents, setFlaggedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventAttendees, setEventAttendees] = useState([]);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [eventToDelete, setEventToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFlaggedEvents();
  }, []);

  const fetchFlaggedEvents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/reports/events/flagged");
      setFlaggedEvents(res.data);
    } catch (error) {
      toast.error("Failed to fetch flagged events");
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status, adminNotes = "") => {
    try {
      await apiClient.patch(`/reports/${reportId}`, {
        status,
        adminNotes,
      });
      
      toast.success("Report status updated successfully");
      fetchFlaggedEvents(); // Refresh data
    } catch (error) {
      toast.error("Failed to update report status");
    }
  };

  const viewReports = (event) => {
    setSelectedEvent(event);
    setShowReportsModal(true);
  };

  const viewEvent = async (event) => {
    try {
      const response = await apiClient.get(`/bookings/event/${event._id}`);
      setEventAttendees(response.data);
      setSelectedEvent(event);
      setShowEventModal(true);
    } catch (error) {
      console.error('Error fetching event attendees:', error);
      toast.error('Failed to load event details');
    }
  };

  const handleDelete = (eventId) => {
    setEventToDelete(eventId);
    setShowDeleteModal(true);
    setCancelReason("");
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/events/${eventToDelete}`, {
        data: cancelReason ? { cancelledReason: cancelReason } : {},
      });
      toast.success("Event cancelled successfully");
      setShowDeleteModal(false);
      setCancelReason("");
      setEventToDelete(null);
      fetchFlaggedEvents(); // Refresh data
    } catch (err) {
      toast.error("Failed to cancel event");
    }
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
              <h1 className="text-3xl font-bold text-text-primary">Flagged Events</h1>
              <p className="mt-1 text-text-secondary">Review and manage reported events</p>
            </div>
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center gap-2 border border-border text-text-primary px-6 py-3 rounded-lg font-medium hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>

        {flaggedEvents.length === 0 ? (
          <div className="bg-bg-primary border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No Flagged Events</h3>
            <p className="text-text-secondary">Great! There are currently no events with reports.</p>
          </div>
        ) : (
          <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-bg-secondary border-b border-border">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Event
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Event Actions
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Organizer Actions
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-bg-primary divide-y divide-border">
                {flaggedEvents.map((event) => (
                  <tr key={event._id} className="hover:bg-bg-secondary transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm font-medium text-text-primary">{event.title}</div>
                        <div className="text-sm text-text-secondary">{event.venue?.name || event.venue}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center">
                        <span className="inline-flex flex-col sm:flex-row items-center justify-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-error/10 text-error border border-error/20 text-center">
                          <span>{event.reportCount}</span>
                          <span>{event.reportCount === 1 ? 'report' : 'reports'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-text-primary">{event.organizerId?.name}</div>
                      <div className="text-sm text-text-secondary">{event.organizerId?.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-text-primary">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {event.cancelled ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-error/10 text-error border border-error/20">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-success/10 text-success border border-success/20">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewEvent(event)}
                          className="bg-primary hover:bg-primary/90 text-bg-primary px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                          title="View detailed event statistics"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => viewReports(event)}
                          className="bg-secondary hover:bg-secondary/90 text-bg-primary px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                          Reports
                        </button>
                        <button
                          onClick={() => navigate(`/events/edit/${event._id}`)}
                          className="bg-warning hover:bg-warning/90 text-bg-primary px-3 py-1 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event._id)}
                          className="bg-error hover:bg-error/90 text-bg-primary px-3 py-1 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {event.organizerId && (
                        <OrganizerActions organizer={event.organizerId} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      <EventDetailsModal
        open={showEventModal}
        event={selectedEvent}
        attendees={eventAttendees}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setEventAttendees([]);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={showDeleteModal}
        title={"Cancel Event"}
        description={
          "This action cannot be undone. If you wish to proceed, please provide a reason for cancellation:"
        }
        onClose={() => {
          setShowDeleteModal(false);
          setCancelReason("");
          setEventToDelete(null);
        }}
        onConfirm={confirmDelete}
        confirmText={"Cancel Event"}
        showInput={true}
        inputValue={cancelReason}
        setInputValue={setCancelReason}
      />

      {/* Reports Modal */}
      {showReportsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary border border-border rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-text-primary">
                  Reports for: {selectedEvent.title}
                </h3>
                <button
                  onClick={() => {
                    setShowReportsModal(false);
                    setSelectedEvent(null);
                  }}
                  className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedEvent.reports?.map((report) => (
                  <div key={report._id} className="border-2 border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary">
                            {REPORT_REASON_LABELS[report.reason]}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium border rounded-md ${STATUS_COLORS[report.status]}`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="text-sm text-text-secondary">
                          Reported by: {report.userId?.name} ({report.userId?.email})
                        </div>
                        <div className="text-xs text-text-secondary">
                          {new Date(report.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {report.description && (
                      <div className="mb-3">
                        <p className="text-sm text-text-primary bg-bg-secondary rounded-lg p-3">
                          {report.description}
                        </p>
                      </div>
                    )}

                    {report.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateReportStatus(report._id, "reviewed")}
                          className="bg-primary hover:bg-primary/90 text-bg-primary px-3 py-1 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                          Mark as Reviewed
                        </button>
                        <button
                          onClick={() => updateReportStatus(report._id, "resolved")}
                          className="bg-success hover:bg-success/90 text-bg-primary px-3 py-1 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => updateReportStatus(report._id, "dismissed")}
                          className="border border-border bg-bg-secondary text-text-primary px-3 py-1 rounded-lg text-sm hover:bg-bg-secondary/80 transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {report.adminNotes && (
                      <div className="mt-3 bg-bg-secondary rounded-lg p-3">
                        <div className="text-xs text-text-secondary font-medium">Admin Notes:</div>
                        <p className="text-sm text-text-primary">{report.adminNotes}</p>
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
    </div>
  );
}
