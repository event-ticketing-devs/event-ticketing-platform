import React, { useEffect, useState } from "react";
import EventDetailsModal from "../../events/components/EventDetailsModal";
import ConfirmModal from "../../../common/components/ConfirmModal";
import OrganizerActions from "../../organizer/components/OrganizerActions";
import apiClient from "../../../api/apiClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Building2, Mail, AlertCircle, Plus, Settings, Flag, MessageSquare } from "lucide-react";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventAttendees, setEventAttendees] = useState([]);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    cancelledEvents: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0,
    pendingReports: 0,
    pendingContacts: 0,
  });
  const [venueStats, setVenueStats] = useState({
    totalVenues: 0,
    verifiedVenues: 0,
    unverifiedVenues: 0,
    suspendedVenues: 0,
    totalSpaces: 0,
    flaggedVenues: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState({ open: false, categoryId: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes, categoriesRes, venueStatsRes] = await Promise.all([
        apiClient.get("/events"),
        apiClient.get("/events/admin/stats"),
        apiClient.get("/categories"),
        apiClient.get("/admin/venues/stats"),
      ]);
      
      // Handle both old and new API response formats
      setEvents(eventsRes.data.events || eventsRes.data);
      setStats(statsRes.data);
      setCategories(categoriesRes.data);
      setVenueStats(venueStatsRes.data);
    } catch (err) {
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  const viewEventDetails = async (event) => {
    try {
      const response = await apiClient.get(`/bookings/event/${event._id}`);
      setEventAttendees(response.data);
      setSelectedEvent(event);
      setShowEventDetailsModal(true);
    } catch (error) {
      console.error('Error fetching event attendees:', error);
      toast.error('Failed to load event details');
    }
  };

  const handleManageEvent = (event) => {
    viewEventDetails(event);
  };

  const handleEditEvent = (eventId) => {
    navigate(`/events/edit/${eventId}`);
  };

  const handleDelete = async (eventId) => {
    setEventToDelete(eventId);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/events/${eventToDelete}`, {
        data: cancelReason ? { cancelledReason: cancelReason } : {},
      });
      toast.success("Event cancelled successfully");
      setShowModal(false);
      setCancelReason("");
      setEventToDelete(null);
      fetchAdminData(); // Refresh data after deletion
    } catch (err) {
      toast.error("Failed to cancel event");
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await apiClient.post("/categories", categoryForm);
      toast.success("Category created successfully");
      setShowAddCategoryModal(false);
      setCategoryForm({ name: "", description: "" });
      fetchAdminData(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create category");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setDeleteCategoryConfirm({ open: true, categoryId });
  };

  const confirmDeleteCategory = async () => {
    try {
      await apiClient.delete(`/categories/${deleteCategoryConfirm.categoryId}`);
      toast.success("Category deleted successfully");
      setDeleteCategoryConfirm({ open: false, categoryId: null });
      fetchAdminData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete category");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full w-12 h-12 border-primary border-b-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Admin Dashboard</h1>
          <p className="text-text-secondary">Manage events, categories, and platform settings</p>
        </div>

        {/* Admin Action Notifications - Consolidated */}
        {(venueStats.unverifiedVenues > 0 || stats.pendingReports > 0 || venueStats.flaggedVenues > 0 || stats.pendingContacts > 0) && (
          <div className="bg-gradient-to-r from-primary/5 via-warning/5 to-error/5 border border-primary/20 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-text-primary mb-3">Admin Actions Required</h3>
                <div className="space-y-2 text-sm">
                  {venueStats.unverifiedVenues > 0 && (
                    <p className="text-text-secondary">
                      <Building2 className="inline h-4 w-4 mr-1 text-warning" />
                      {venueStats.unverifiedVenues === 1 ? "1 venue" : `${venueStats.unverifiedVenues} venues`} waiting for verification.{" "}
                      <button
                        onClick={() => navigate("/admin/venues")}
                        className="text-warning hover:text-warning/80 underline font-medium cursor-pointer"
                      >
                        Review now
                      </button>
                    </p>
                  )}
                  {stats.pendingReports > 0 && (
                    <p className="text-text-secondary">
                      <Flag className="inline h-4 w-4 mr-1 text-error" />
                      {stats.pendingReports === 1 ? "1 event report" : `${stats.pendingReports} event reports`} need review.{" "}
                      <button
                        onClick={() => navigate("/admin/flagged-events")}
                        className="text-error hover:text-error/80 underline font-medium cursor-pointer"
                      >
                        Review now
                      </button>
                    </p>
                  )}
                  {venueStats.flaggedVenues > 0 && (
                    <p className="text-text-secondary">
                      <AlertCircle className="inline h-4 w-4 mr-1 text-error" />
                      {venueStats.flaggedVenues === 1 ? "1 venue" : `${venueStats.flaggedVenues} venues`} with reports.{" "}
                      <button
                        onClick={() => navigate("/admin/flagged-venues")}
                        className="text-error hover:text-error/80 underline font-medium cursor-pointer"
                      >
                        Review now
                      </button>
                    </p>
                  )}
                  {stats.pendingContacts > 0 && (
                    <p className="text-text-secondary">
                      <MessageSquare className="inline h-4 w-4 mr-1 text-primary" />
                      {stats.pendingContacts === 1 ? "1 contact message" : `${stats.pendingContacts} contact messages`} awaiting response.{" "}
                      <button
                        onClick={() => navigate("/admin/contacts")}
                        className="text-primary hover:text-primary/80 underline font-medium cursor-pointer"
                      >
                        Respond now
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">         <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Total Events</h2>
            <p className="text-3xl font-bold text-text-primary mb-1">{stats.totalEvents}</p>
            <p className="text-sm text-text-secondary">
              {stats.activeEvents} active, {stats.cancelledEvents} cancelled
            </p>
          </div>
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Total Bookings</h2>
            <p className="text-3xl font-bold text-text-primary mb-1">{stats.totalBookings}</p>
            <p className="text-sm text-text-secondary">{stats.activeBookings} active bookings</p>
          </div>
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Total Revenue</h2>
            <p className="text-3xl font-bold text-text-primary mb-1">
              ₹{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-text-secondary">From all bookings</p>
          </div>
        </div>

        {/* Categories Management */}
        <div className="bg-bg-primary border border-border rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-primary">Categories</h2>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="inline-flex items-center gap-2 bg-primary text-bg-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-bg-primary border-b border-border">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Description
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Events Count
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Created
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-bg-primary divide-y divide-border">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-bg-secondary transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">{category.name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-text-secondary max-w-xs">
                        {category.description || 'No description'}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-text-primary">
                        {events.filter(event => event.categoryId?._id === category._id || event.categoryId === category._id).length}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="text-primary hover:text-primary/80 px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-lg"
                        disabled={events.some(event => event.categoryId?._id === category._id || event.categoryId === category._id)}
                        title={events.some(event => event.categoryId?._id === category._id || event.categoryId === category._id) ? "Cannot delete category with existing events" : "Delete category"}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-6 text-center text-text-secondary">
                      No categories found. Create your first category!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary">All Events</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-bg-primary border-b border-border">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Title
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Organizer
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
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-bg-secondary transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">{event.title}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">
                        {event.venue?.name || event.venue}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">
                        {event.categoryId?.name || event.categoryId}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-text-primary">
                        {event.organizerId?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {event.organizerId?.email || ''}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {event.cancelled ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium text-text-secondary rounded-md">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium text-text-primary rounded-md">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          className="text-primary hover:text-primary/80 px-3 py-1.5 transition-colors text-sm font-medium cursor-pointer rounded-lg"
                          onClick={() => handleManageEvent(event)}
                          title="View detailed event statistics"
                        >
                          Details
                        </button>
                        <button
                          className="text-primary hover:text-primary/80 px-3 py-1.5 transition-colors text-sm font-medium cursor-pointer rounded-lg"
                          onClick={() => handleEditEvent(event._id)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-primary hover:text-primary/80 px-3 py-1.5 transition-colors text-sm font-medium cursor-pointer rounded-lg"
                          onClick={() => handleDelete(event._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">
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

        {/* Add Category Modal */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-bg-primary border border-border rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-text-primary mb-4">Add New Category</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Description
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Enter category description (optional)"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddCategory}
                  className="flex-1 bg-primary hover:bg-primary/90 text-bg-primary px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Create Category
                </button>
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setCategoryForm({ name: "", description: "" });
                  }}
                  className="flex-1 border border-border text-text-primary px-4 py-2 rounded-lg font-semibold hover:bg-bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Event Details Modal */}
      <EventDetailsModal
        open={showEventDetailsModal}
        event={selectedEvent}
        attendees={eventAttendees}
        onClose={() => {
          setShowEventDetailsModal(false);
          setSelectedEvent(null);
          setEventAttendees([]);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={showModal}
        title={"Cancel Event"}
        description={
          "This action cannot be undone. If you wish to proceed, please provide a reason for cancellation:"
        }
        onClose={() => {
          setShowModal(false);
          setCancelReason("");
          setEventToDelete(null);
        }}
        onConfirm={confirmDelete}
        confirmText={"Cancel Event"}
        showInput={true}
        inputValue={cancelReason}
        setInputValue={setCancelReason}
      />

      {/* Delete Category Confirmation Modal */}
      <ConfirmModal
        open={deleteCategoryConfirm.open}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone. Events using this category will need to be reassigned."
        onClose={() => setDeleteCategoryConfirm({ open: false, categoryId: null })}
        onConfirm={confirmDeleteCategory}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      </div>
    </div>
  );
}
