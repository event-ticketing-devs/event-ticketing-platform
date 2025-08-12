import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 px-4">
      {/* Sad/Broken Robot SVG illustration */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-6"
      >
        {/* Robot body */}
        <rect
          x="30"
          y="50"
          width="60"
          height="40"
          rx="10"
          fill="#e2e8f0"
          stroke="#64748b"
          strokeWidth="2"
        />
        {/* Robot head */}
        <rect
          x="40"
          y="25"
          width="40"
          height="30"
          rx="8"
          fill="#e2e8f0"
          stroke="#64748b"
          strokeWidth="2"
        />
        {/* Eyes (X for sad/broken) */}
        <line
          x1="50"
          y1="38"
          x2="56"
          y2="32"
          stroke="#2563eb"
          strokeWidth="2"
        />
        <line
          x1="56"
          y1="38"
          x2="50"
          y2="32"
          stroke="#2563eb"
          strokeWidth="2"
        />
        <line
          x1="64"
          y1="38"
          x2="70"
          y2="32"
          stroke="#2563eb"
          strokeWidth="2"
        />
        <line
          x1="70"
          y1="38"
          x2="64"
          y2="32"
          stroke="#2563eb"
          strokeWidth="2"
        />
        {/* Neutral mouth (horizontal line) */}
        <line
          x1="54"
          y1="46"
          x2="66"
          y2="46"
          stroke="#64748b"
          strokeWidth="2"
        />
        {/* Antenna */}
        <rect x="58" y="15" width="4" height="10" rx="2" fill="#64748b" />
        <circle cx="60" cy="13" r="3" fill="#2563eb" />
        {/* Arms (broken) */}
        <line
          x1="30"
          y1="60"
          x2="15"
          y2="50"
          stroke="#64748b"
          strokeWidth="3"
          strokeDasharray="4 3"
        />
        <line
          x1="90"
          y1="60"
          x2="105"
          y2="50"
          stroke="#64748b"
          strokeWidth="3"
          strokeDasharray="4 3"
        />
        {/* Legs */}
        <rect x="45" y="90" width="6" height="15" rx="3" fill="#64748b" />
        <rect x="69" y="90" width="6" height="15" rx="3" fill="#64748b" />
        {/* Ground shadow */}
        <ellipse cx="60" cy="110" rx="28" ry="5" fill="#cbd5e1" />
      </svg>

      <h1 className="text-6xl font-black text-slate-800 mb-4">404</h1>

      <p className="text-xl text-slate-600 mb-8 text-center max-w-md">
        Oops! The page you're looking for doesn't exist.
      </p>

      <Link
        to="/"
        className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Back to Home
      </Link>
    </div>
  );
}
