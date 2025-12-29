import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, User, LogOut, Ticket, ChevronDown } from "lucide-react";

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
    return `relative px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${
      isActive
        ? "text-primary"
        : "text-text-primary hover:text-primary/80"
    } ${isActive ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : ""}`;
  };

  return (
    <nav className="bg-bg-primary border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group cursor-pointer"
            onClick={handleCloseMenu}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 transition-colors duration-200">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">Eventify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkClassName("/")} onClick={handleCloseMenu}>
              Home
            </Link>
            <Link to="/events" className={linkClassName("/events")} onClick={handleCloseMenu}>
              Events
            </Link>
            <Link to="/venues" className={linkClassName("/venues")} onClick={handleCloseMenu}>
              Venues
            </Link>
            <Link to="/contact" className={linkClassName("/contact")} onClick={handleCloseMenu}>
              Contact
            </Link>
            {currentUser && (
              <>
                <Link to="/dashboard" className={linkClassName("/dashboard")} onClick={handleCloseMenu}>
                  My Bookings
                </Link>
                <Link to="/venue-enquiries" className={linkClassName("/venue-enquiries")} onClick={handleCloseMenu}>
                  My Enquiries
                </Link>
                <Link to="/organizer" className={linkClassName("/organizer")} onClick={handleCloseMenu}>
                  Organizer
                </Link>
                <Link to="/venue-partner" className={linkClassName("/venue-partner")} onClick={handleCloseMenu}>
                  Venue Partner
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-secondary transition-colors duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-text-primary max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${profileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-bg-primary rounded-lg shadow-lg border border-border py-2 z-20">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleCloseMenu();
                        }}
                      >
                        <User className="w-4 h-4" />
                        Your Profile
                      </Link>
                      <hr className="my-2 border-border" />
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                          handleCloseMenu();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
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
                  className="px-4 py-2 text-sm font-medium text-text-primary hover:text-primary transition-colors duration-200 cursor-pointer"
                  onClick={handleCloseMenu}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors duration-200 cursor-pointer"
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
              className="p-2 rounded-lg hover:bg-bg-secondary transition-colors duration-200 cursor-pointer"
              onClick={handleMenuToggle}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6 text-text-primary" /> : <Menu className="w-6 h-6 text-text-primary" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-bg-primary">
          <div className="px-4 py-4 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                isActiveLink("/") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
              }`}
              onClick={handleCloseMenu}
            >
              Home
            </Link>
            <Link
              to="/events"
              className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                isActiveLink("/events") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
              }`}
              onClick={handleCloseMenu}
            >
              Events
            </Link>
            <Link
              to="/contact"
              className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                isActiveLink("/contact") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
              }`}
              onClick={handleCloseMenu}
            >
              Contact
            </Link>

            {currentUser && (
              <>
                <Link
                  to="/dashboard"
                  className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                    isActiveLink("/dashboard") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
                  }`}
                  onClick={handleCloseMenu}
                >
                  My Bookings
                </Link>
                <Link
                  to="/venue-enquiries"
                  className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                    isActiveLink("/venue-enquiries") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
                  }`}
                  onClick={handleCloseMenu}
                >
                  My Enquiries
                </Link>
                <Link
                  to="/organizer"
                  className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                    isActiveLink("/organizer") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
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
                className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                  isActiveLink("/admin") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
                }`}
                onClick={handleCloseMenu}
              >
                Admin
              </Link>
            )}

            {/* Mobile Auth */}
            <div className="pt-4 mt-4 border-t border-border">
              {currentUser ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-secondary cursor-pointer"
                    onClick={handleCloseMenu}
                  >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{currentUser.name}</p>
                      <p className="text-xs text-text-secondary">View profile</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      handleCloseMenu();
                    }}
                    className="w-full mt-3 px-4 py-2.5 bg-error text-white text-sm font-medium rounded-lg hover:bg-error/90 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block px-4 py-2.5 text-center text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                    onClick={handleCloseMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2.5 text-center text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
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
