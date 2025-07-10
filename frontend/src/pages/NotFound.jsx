import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
      }}
    >
      {/* Sad/Broken Robot SVG illustration */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: "1.5rem" }}
      >
        {/* Robot body */}
        <rect
          x="30"
          y="50"
          width="60"
          height="40"
          rx="10"
          fill="#e0e7ef"
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
          fill="#e0e7ef"
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
      <h1 style={{ fontSize: "4rem", color: "#1e293b", marginBottom: "1rem" }}>
        404
      </h1>
      <p style={{ fontSize: "1.5rem", color: "#64748b", marginBottom: "2rem" }}>
        Oops! The page you’re looking for doesn’t exist.
      </p>
      <Link
        to="/"
        style={{
          padding: "0.75rem 2rem",
          background: "#2563eb",
          color: "#fff",
          borderRadius: "0.5rem",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "1rem",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
