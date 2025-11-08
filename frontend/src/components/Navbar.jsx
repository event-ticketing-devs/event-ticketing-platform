import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleCloseMenu = () => setMenuOpen(false);

  const isActiveLink = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const linkClassName = (path) => {
    const isActive = isActiveLink(path);
    return `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "text-slate-900"
        : "text-slate-600 hover:text-slate-900"
    } ${isActive ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900" : ""}`;
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={handleCloseMenu}
          >
            <div className="w-8 h-8 bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition-colors duration-200">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">Eventify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkClassName("/")} onClick={handleCloseMenu}>
              Home
            </Link>
            <Link to="/events" className={linkClassName("/events")} onClick={handleCloseMenu}>
              Events
            </Link>
            <Link to="/contact" className={linkClassName("/contact")} onClick={handleCloseMenu}>
              Contact
            </Link>
            {currentUser && (
              <>
                <Link to="/dashboard" className={linkClassName("/dashboard")} onClick={handleCloseMenu}>
                  My Bookings
                </Link>
                <Link to="/organizer" className={linkClassName("/organizer")} onClick={handleCloseMenu}>
                  Organizer
                </Link>
              </>
            )}
            {currentUser?.role?.toLowerCase() === "admin" && (
              <Link to="/admin" className={linkClassName("/admin")} onClick={handleCloseMenu}>
                Admin
              </Link>
            )}
          </div>

          {/* Right Side - Auth/Profile */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${profileMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleCloseMenu();
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Your Profile
                      </Link>
                      <hr className="my-2 border-slate-200" />
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                          handleCloseMenu();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors duration-200"
                  onClick={handleCloseMenu}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200"
                  onClick={handleCloseMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
              onClick={handleMenuToggle}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActiveLink("/") ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              onClick={handleCloseMenu}
            >
              Home
            </Link>
            <Link
              to="/events"
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActiveLink("/events") ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              onClick={handleCloseMenu}
            >
              Events
            </Link>
            <Link
              to="/contact"
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActiveLink("/contact") ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              onClick={handleCloseMenu}
            >
              Contact
            </Link>

            {currentUser && (
              <>
                <Link
                  to="/dashboard"
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActiveLink("/dashboard") ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={handleCloseMenu}
                >
                  My Bookings
                </Link>
                <Link
                  to="/organizer"
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActiveLink("/organizer") ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={handleCloseMenu}
                >
                  Organizer
                </Link>
              </>
            )}

            {currentUser?.role?.toLowerCase() === "admin" && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActiveLink("/admin") ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                onClick={handleCloseMenu}
              >
                Admin
              </Link>
            )}

            {/* Mobile Auth */}
            <div className="pt-4 mt-4 border-t border-slate-200">
              {currentUser ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50"
                    onClick={handleCloseMenu}
                  >
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                      <p className="text-xs text-slate-500">View profile</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      handleCloseMenu();
                    }}
                    className="w-full mt-3 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block px-4 py-2.5 text-center text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    onClick={handleCloseMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2.5 text-center text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    onClick={handleCloseMenu}
                  >
                    Sign Up
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
