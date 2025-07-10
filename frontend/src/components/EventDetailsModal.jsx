import React from "react";

export default function EventDetailsModal({ open, event, attendees, onClose }) {
  if (!open || !event) return null;

  // Calculate values for the donut chart
  const totalSeats =
    typeof event.totalSeats === "number" ? event.totalSeats : 0;
  const availableSeats =
    typeof event.availableSeats === "number" ? event.availableSeats : 0;
  const bookedSeats = totalSeats - availableSeats;
  const percentBooked = totalSeats
    ? Math.round((bookedSeats / totalSeats) * 100)
    : 0;

  // Donut chart parameters
  const radius = 32;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const bookedStroke = circumference * (bookedSeats / totalSeats || 0);

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
        {/* Donut chart for seat availability */}
        <div className="flex items-center gap-4 my-4">
          <svg width={radius * 2} height={radius * 2}>
            <circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={stroke}
            />
            <circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - bookedStroke}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s" }}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dy="0.3em"
              fontSize="1.1em"
              fill="#1e293b"
              fontWeight="bold"
            >
              {totalSeats ? `${percentBooked}%` : "N/A"}
            </text>
          </svg>
          <div>
            <div>
              <span className="font-semibold">Booked:</span> {bookedSeats} /{" "}
              {totalSeats || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Available:</span>{" "}
              {availableSeats === 0 ? (
                <span className="text-red-600 font-semibold">Sold out</span>
              ) : typeof event.availableSeats === "number" ? (
                event.availableSeats
              ) : (
                "N/A"
              )}
            </div>
          </div>
        </div>
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
