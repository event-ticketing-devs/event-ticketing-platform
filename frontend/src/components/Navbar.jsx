import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleCloseMenu = () => setMenuOpen(false);

  const isActiveLink = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const linkClassName = (path) => `
    relative px-4 py-2 rounded-xl font-medium transition-all duration-300 
    ${
      isActiveLink(path)
        ? "text-blue-600 bg-blue-50"
        : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
    }
  `;

  return (
    <nav className="backdrop-blur-md bg-white/95 border-b border-slate-200/50 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Left Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group"
              onClick={handleCloseMenu}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  Eventify
                </span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/"
                className={linkClassName("/")}
                onClick={handleCloseMenu}
              >
                Home
              </Link>
              <Link
                to="/events"
                className={linkClassName("/events")}
                onClick={handleCloseMenu}
              >
                Events
              </Link>
              <Link
                to="/contact"
                className={linkClassName("/contact")}
                onClick={handleCloseMenu}
              >
                Contact
              </Link>
              {currentUser && (
                <Link
                  to="/dashboard"
                  className={linkClassName("/dashboard")}
                  onClick={handleCloseMenu}
                >
                  Dashboard
                </Link>
              )}
              {currentUser && (
                <Link
                  to="/organizer"
                  className={linkClassName("/organizer")}
                  onClick={handleCloseMenu}
                >
                  Organizer
                </Link>
              )}
              {currentUser?.role?.toLowerCase() === "admin" && (
                <Link
                  to="/admin"
                  className={linkClassName("/admin")}
                  onClick={handleCloseMenu}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleMenuToggle}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 relative flex items-center justify-center">
                <span
                  className={`absolute h-0.5 w-6 bg-slate-700 rounded transition-all duration-300 ${
                    menuOpen ? "rotate-45" : "-translate-y-2"
                  }`}
                ></span>
                <span
                  className={`absolute h-0.5 w-6 bg-slate-700 rounded transition-all duration-300 ${
                    menuOpen ? "opacity-0" : ""
                  }`}
                ></span>
                <span
                  className={`absolute h-0.5 w-6 bg-slate-700 rounded transition-all duration-300 ${
                    menuOpen ? "-rotate-45" : "translate-y-2"
                  }`}
                ></span>
              </div>
            </button>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-4">
                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all duration-300 group"
                  onClick={handleCloseMenu}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                    {currentUser.name}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    handleCloseMenu();
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 rounded-xl text-white font-semibold shadow-lg hover:from-red-600 hover:to-pink-600 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 font-medium rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-all duration-300"
                  onClick={handleCloseMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-teal-600 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  onClick={handleCloseMenu}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200/50 bg-white/95 backdrop-blur-md">
          <div className="px-6 py-4 space-y-3">
            {/* Mobile Navigation Links */}
            <Link
              to="/"
              className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActiveLink("/")
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
              }`}
              onClick={handleCloseMenu}
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </div>
            </Link>

            <Link
              to="/events"
              className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActiveLink("/events")
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
              }`}
              onClick={handleCloseMenu}
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Events
              </div>
            </Link>

            <Link
              to="/contact"
              className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActiveLink("/contact")
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
              }`}
              onClick={handleCloseMenu}
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contact
              </div>
            </Link>

            {currentUser && (
              <Link
                to="/dashboard"
                className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isActiveLink("/dashboard")
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                }`}
                onClick={handleCloseMenu}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Dashboard
                </div>
              </Link>
            )}

            {currentUser && (
              <Link
                to="/organizer"
                className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isActiveLink("/organizer")
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                }`}
                onClick={handleCloseMenu}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Organizer
                </div>
              </Link>
            )}

            {currentUser?.role?.toLowerCase() === "admin" && (
              <Link
                to="/admin"
                className={`block px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isActiveLink("/admin")
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                }`}
                onClick={handleCloseMenu}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Admin
                </div>
              </Link>
            )}

            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-slate-200/50">
              {currentUser ? (
                <div className="space-y-3">
                  {/* Mobile Profile */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all duration-300"
                    onClick={handleCloseMenu}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {currentUser.name}
                      </p>
                      <p className="text-sm text-slate-600">View Profile</p>
                    </div>
                  </Link>

                  {/* Mobile Logout */}
                  <button
                    onClick={() => {
                      logout();
                      handleCloseMenu();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-center text-slate-700 font-medium rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-all duration-300"
                    onClick={handleCloseMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-center font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-teal-600 transition-all duration-300"
                    onClick={handleCloseMenu}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
