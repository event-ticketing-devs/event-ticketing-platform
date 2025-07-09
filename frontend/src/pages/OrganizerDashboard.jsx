import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

export default function OrganizerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [eventToDelete, setEventToDelete] = useState(null);

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
        <p>You haven’t created any events yet.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event._id}
              className={`p-4 border rounded shadow-sm ${
                event.cancelled ? "bg-gray-100 opacity-70" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{event.title}</h2>
                {event.cancelled && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-200 text-red-800 rounded">
                    Cancelled
                  </span>
                )}
              </div>
              <p>{new Date(event.date).toLocaleString()}</p>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => navigate(`/events/edit/${event._id}`)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                  disabled={event.cancelled}
                >
                  Edit
                </button>
                {event.cancelled ? (
                  <button
                    className="bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed"
                    disabled
                  >
                    Cancelled
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(event._id, false)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => viewDetails(event)}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
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

      {selectedEvent && (
        <div className="mt-6 p-4 border-t">
          <h2 className="text-xl font-bold mb-2">
            {selectedEvent.title} – Details
          </h2>
          <p>Date: {new Date(selectedEvent.date).toLocaleString()}</p>
          <p>Description: {selectedEvent.description}</p>
          <p>Total Seats: {selectedEvent.totalSeats}</p>
          <p>Price: ₹{selectedEvent.price}</p>

          <h3 className="mt-4 text-lg font-semibold">Attendees:</h3>
          {attendees.length === 0 ? (
            <p>No attendees yet.</p>
          ) : (
            <ul className="list-disc pl-6">
              {attendees.map(({ _id, userId, noOfSeats }) => (
                <li key={_id}>
                  {userId.name} ({userId.email}) – Seats: {noOfSeats}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
