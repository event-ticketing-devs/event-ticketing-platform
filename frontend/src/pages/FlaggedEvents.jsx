import React, { useEffect, useState } from "react";
import EventDetailsModal from "../components/EventDetailsModal";
import ConfirmModal from "../components/ConfirmModal";
import OrganizerActions from "../components/OrganizerActions";
import apiClient from "../api/apiClient";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-gray-100 text-gray-800",
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
            <div className="animate-spin rounded-full w-12 h-12 border-slate-900 border-b-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Flagged Events</h1>
              <p className="text-slate-600">Review and manage reported events</p>
            </div>
            <button
              onClick={() => navigate("/admin")}
              className="border border-slate-700 text-slate-900 px-4 py-2 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>

        {flaggedEvents.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Flagged Events</h3>
            <p className="text-slate-600">Great! There are currently no events with reports.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Event Actions
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Organizer Actions
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flaggedEvents.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">{event.venue?.name || event.venue}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {event.reportCount} reports
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{event.organizerId?.name}</div>
                      <div className="text-sm text-gray-500">{event.organizerId?.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {event.cancelled ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewEvent(event)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                          title="View detailed event statistics"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => viewReports(event)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                        >
                          Reports
                        </button>
                        <button
                          onClick={() => navigate(`/events/edit/${event._id}`)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Reports for: {selectedEvent.title}
                </h3>
                <button
                  onClick={() => {
                    setShowReportsModal(false);
                    setSelectedEvent(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {selectedEvent.reports?.map((report) => (
                  <div key={report._id} className="border border-slate-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">
                            {REPORT_REASON_LABELS[report.reason]}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          Reported by: {report.userId?.name} ({report.userId?.email})
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(report.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {report.description && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-700 bg-slate-50 p-3">
                          {report.description}
                        </p>
                      </div>
                    )}

                    {report.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateReportStatus(report._id, "reviewed")}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 text-sm transition-colors cursor-pointer"
                        >
                          Mark as Reviewed
                        </button>
                        <button
                          onClick={() => updateReportStatus(report._id, "resolved")}
                          className="border border-slate-700 text-slate-900 px-3 py-1 text-sm hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => updateReportStatus(report._id, "dismissed")}
                          className="border border-slate-300 text-slate-600 px-3 py-1 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {report.adminNotes && (
                      <div className="mt-3 bg-slate-50 p-3">
                        <div className="text-xs text-slate-600 font-medium">Admin Notes:</div>
                        <p className="text-sm text-slate-900">{report.adminNotes}</p>
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
