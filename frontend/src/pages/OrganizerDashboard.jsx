import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import EventDetailsModal from "../components/EventDetailsModal";

export default function OrganizerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get("/events");
      const myEvents = res.data.filter(
        (event) => event.organizerId === (currentUser && currentUser._id)
      );
      setEvents(myEvents);
    } catch (err) {
      toast.error("Failed to fetch events");
    }
  };

  const handleDelete = (eventId, isCancelled) => {
    setEventToDelete(eventId);
    setShowModal(true);
    setCancelReason("");
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/events/${eventToDelete}`, {
        data: cancelReason ? { cancelledReason: cancelReason } : {},
      });
      toast.success("Event deleted/cancelled");
      setShowModal(false);
      setCancelReason("");
      setEventToDelete(null);
      fetchEvents();
    } catch (err) {
      toast.error("Failed to delete/cancel event");
    }
  };

  const viewDetails = async (event) => {
    try {
      const res = await apiClient.get(`/bookings/event/${event._id}`);
      setSelectedEvent(event);
      setAttendees(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      toast.error("Failed to fetch attendees");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Organizer Dashboard</h1>
      {events.length === 0 ? (
        <p className="text-slate-500">You haven’t created any events yet.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event._id}
              className={`bg-white p-4 border rounded-xl shadow-md flex flex-col gap-2 ${
                event.cancelled
                  ? "bg-gray-100 opacity-70"
                  : "hover:shadow-lg transition-all"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-blue-700 flex-1">
                  {event.title}
                </h2>
                {event.categoryId && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {typeof event.categoryId === "object"
                      ? event.categoryId.name
                      : event.categoryId}
                  </span>
                )}
                {event.cancelled && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-200 text-red-800 rounded">
                    Cancelled
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-sm mb-1">
                {new Date(event.date).toLocaleString()}
              </p>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => navigate(`/events/edit/${event._id}`)}
                  className={`bg-yellow-500 text-white px-3 py-1 rounded-lg font-medium transition-all ${
                    event.cancelled ? "" : "hover:bg-yellow-600 cursor-pointer"
                  }`}
                  disabled={event.cancelled}
                >
                  Edit
                </button>
                {event.cancelled ? (
                  <button
                    className="bg-gray-400 text-white px-3 py-1 rounded-lg font-medium cursor-not-allowed"
                    disabled
                  >
                    Cancelled
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(event._id, false)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => viewDetails(event)}
                  className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-3 py-1 rounded-lg font-medium hover:from-blue-700 hover:to-teal-500 transition-all cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmModal
        open={showModal}
        title={"Cancel Event"}
        description={
          "This action cannot be undone. Please provide a reason for cancellation:"
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
      <EventDetailsModal
        open={showDetailsModal}
        event={selectedEvent}
        attendees={attendees}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
}
