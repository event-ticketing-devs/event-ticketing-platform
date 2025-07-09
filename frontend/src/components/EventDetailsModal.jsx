import React from "react";

export default function EventDetailsModal({ open, event, attendees, onClose }) {
  if (!open || !event) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl relative border">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl cursor-pointer"
        >
          &times;
        </button>
        {event.photo && (
          <img
            src={event.photo}
            alt={event.title}
            className="w-full max-h-60 object-cover rounded-xl mb-4 border shadow"
          />
        )}
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-blue-700">
          {event.title}
          {event.categoryId && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-semibold">
              {typeof event.categoryId === "object"
                ? event.categoryId.name
                : event.categoryId}
            </span>
          )}
          {event.cancelled && (
            <span className="ml-2 px-2 py-1 text-xs bg-red-200 text-red-800 rounded font-semibold">
              Cancelled
            </span>
          )}
        </h2>
        <p className="mb-1 text-slate-600">
          Date: {new Date(event.date).toLocaleString()}
        </p>
        <p className="mb-1 text-slate-700">Description: {event.description}</p>
        <p className="mb-1 text-slate-700">Total Seats: {event.totalSeats}</p>
        <p className="mb-1 text-slate-700">Price: ₹{event.price}</p>
        {event.cancelled && event.cancelledReason && (
          <p className="mb-2 text-red-600 font-semibold">
            Reason: {event.cancelledReason}
          </p>
        )}
        <h3 className="mt-4 text-lg font-semibold text-blue-700">Attendees:</h3>
        {attendees && attendees.length === 0 ? (
          <p className="text-slate-500">No attendees yet.</p>
        ) : (
          <ul className="list-disc pl-6 max-h-32 overflow-y-auto text-slate-700">
            {attendees.map(({ _id, userId, noOfSeats }) => (
              <li key={_id}>
                {userId.name} ({userId.email}) – Seats: {noOfSeats}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
