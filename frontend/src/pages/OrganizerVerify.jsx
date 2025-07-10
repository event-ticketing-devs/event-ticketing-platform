import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

export default function OrganizerVerify() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(eventId || "");

  useEffect(() => {
    if (!eventId) {
      apiClient.get("/events").then((res) => {
        setEvents(res.data);
      });
    }
  }, [eventId]);

  const handleVerify = async () => {
    setResult(null);
    if (!selectedEvent) {
      setResult("Please select an event.");
      return;
    }
    try {
      const res = await apiClient.post("/bookings/verify", {
        code,
        eventId: selectedEvent,
      });
      if (res.data.booking?.eventId !== selectedEvent) {
        setResult("This code does not belong to the selected event.");
      } else {
        setResult(res.data.message);
      }
    } catch (err) {
      setResult(err.response?.data?.message || "Error verifying code");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl border max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">
          Verify Ticket Code
        </h2>
        {!eventId && (
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-slate-700">
              Select Event
            </label>
            <select
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">-- Select Event --</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <input
          className="border rounded-lg px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter ticket code"
        />
        <button
          className="w-full bg-gradient-to-r from-blue-600 to-teal-400 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-500 transition-all mb-2"
          onClick={handleVerify}
        >
          Verify
        </button>
        {result && (
          <div
            className={`mt-3 text-center text-base font-semibold ${
              result === "Booking verified" ? "text-green-600" : "text-red-600"
            }`}
          >
            {result}
          </div>
        )}
        <button
          className="mt-6 w-full text-blue-500 underline hover:text-blue-700"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}
