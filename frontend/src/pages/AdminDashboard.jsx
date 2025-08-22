import React, { useEffect, useState } from "react";
import EventDetailsModal from "../components/EventDetailsModal";
import ConfirmModal from "../components/ConfirmModal";
import OrganizerActions from "../components/OrganizerActions";
import apiClient from "../api/apiClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

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
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [eventToDelete, setEventToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes, categoriesRes] = await Promise.all([
        apiClient.get("/events"),
        apiClient.get("/events/admin/stats"),
        apiClient.get("/categories"),
      ]);
      setEvents(eventsRes.data);
      setStats(statsRes.data);
      setCategories(categoriesRes.data);
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
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await apiClient.delete(`/events/${eventId}`);
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
    }
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
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await apiClient.delete(`/categories/${categoryId}`);
        toast.success("Category deleted successfully");
        fetchAdminData(); // Refresh data
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete category");
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Admin Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/contacts")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Manage Contacts
          </button>
          <button
            onClick={() => navigate("/admin/flagged-events")}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Flagged Events
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2 text-slate-700">Total Events</h2>
          <p className="text-2xl font-bold text-blue-700">{stats.totalEvents}</p>
          <p className="text-sm text-slate-500">
            {stats.activeEvents} active, {stats.cancelledEvents} cancelled
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2 text-slate-700">Total Bookings</h2>
          <p className="text-2xl font-bold text-green-700">{stats.totalBookings}</p>
          <p className="text-sm text-slate-500">{stats.activeBookings} active bookings</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2 text-slate-700">Total Revenue</h2>
          <p className="text-2xl font-bold text-purple-700">
            ₹{stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">From all bookings</p>
        </div>
      </div>

      {/* Categories Management */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-800">Categories</h2>
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Events Count
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {categories.map((category) => (
                <tr key={category._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{category.name}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-slate-900 max-w-xs">
                      {category.description || 'No description'}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {events.filter(event => event.categoryId?._id === category._id || event.categoryId === category._id).length}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
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
                  <td colSpan={5} className="py-8 px-6 text-center text-slate-500">
                    No categories found. Create your first category!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-blue-800">All Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Organizer
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Event Actions
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Organizer Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {events.map((event) => (
                <tr key={event._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{event.title}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {event.venue?.name || event.venue}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {event.categoryId?.name || event.categoryId}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {event.organizerId?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {event.organizerId?.email || ''}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
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
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-medium"
                        onClick={() => handleManageEvent(event)}
                        title="View detailed event statistics"
                      >
                        Details
                      </button>
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-medium"
                        onClick={() => handleEditEvent(event._id)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category description (optional)"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddCategory}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Create Category
              </button>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setCategoryForm({ name: "", description: "" });
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
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
    </div>
  );
}
