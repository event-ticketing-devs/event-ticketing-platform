import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, User, LogOut, Ticket, ChevronDown } from "lucide-react";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [eventsMenuOpen, setEventsMenuOpen] = useState(false);
  const [venuesMenuOpen, setVenuesMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/" className={linkClassName("/")} onClick={handleCloseMenu}>
              Home
            </Link>
            
            {/* Events Dropdown */}
            <div className="relative">
              <button
                onClick={() => setEventsMenuOpen(!eventsMenuOpen)}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  isActiveLink("/events") || isActiveLink("/dashboard") || isActiveLink("/organizer")
                    ? "text-primary"
                    : "text-text-primary hover:text-primary/80"
                }`}
              >
                Events
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${eventsMenuOpen ? "rotate-180" : ""}`} />
              </button>
              
              {eventsMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setEventsMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-56 bg-bg-primary rounded-lg shadow-lg border border-border py-2 z-20">
                    <Link
                      to="/events"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                      onClick={() => {
                        setEventsMenuOpen(false);
                        handleCloseMenu();
                      }}
                    >
                      Browse Events
                    </Link>
                    {currentUser && (
                      <>
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                          onClick={() => {
                            setEventsMenuOpen(false);
                            handleCloseMenu();
                          }}
                        >
                          My Bookings
                        </Link>
                        <Link
                          to="/organizer"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                          onClick={() => {
                            setEventsMenuOpen(false);
                            handleCloseMenu();
                          }}
                        >
                          Organizer
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Venues Dropdown */}
            <div className="relative">
              <button
                onClick={() => setVenuesMenuOpen(!venuesMenuOpen)}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  isActiveLink("/venues") || isActiveLink("/venue-enquiries") || isActiveLink("/venue-partner")
                    ? "text-primary"
                    : "text-text-primary hover:text-primary/80"
                }`}
              >
                Venues
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${venuesMenuOpen ? "rotate-180" : ""}`} />
              </button>
              
              {venuesMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setVenuesMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-56 bg-bg-primary rounded-lg shadow-lg border border-border py-2 z-20">
                    <Link
                      to="/venues"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                      onClick={() => {
                        setVenuesMenuOpen(false);
                        handleCloseMenu();
                      }}
                    >
                      Browse Venues
                    </Link>
                    {currentUser && (
                      <>
                        <Link
                          to="/venue-enquiries"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                          onClick={() => {
                            setVenuesMenuOpen(false);
                            handleCloseMenu();
                          }}
                        >
                          My Enquiries
                        </Link>
                        <Link
                          to="/venue-partner"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                          onClick={() => {
                            setVenuesMenuOpen(false);
                            handleCloseMenu();
                          }}
                        >
                          Venue Partner
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <Link to="/contact" className={linkClassName("/contact")} onClick={handleCloseMenu}>
              Contact
            </Link>
            {currentUser?.role?.toLowerCase() === "admin" && (
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isActiveLink("/admin")
                      ? "text-primary"
                      : "text-text-primary hover:text-primary/80"
                  }`}
                >
                  Admin
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${adminMenuOpen ? "rotate-180" : ""}`} />
                </button>
                
                {adminMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAdminMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-bg-primary rounded-lg shadow-lg border border-border py-2 z-20">
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                        onClick={() => {
                          setAdminMenuOpen(false);
                          handleCloseMenu();
                        }}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/admin/venues"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                        onClick={() => {
                          setAdminMenuOpen(false);
                          handleCloseMenu();
                        }}
                      >
                        Manage Venues
                      </Link>
                      <Link
                        to="/admin/venue-options"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                        onClick={() => {
                          setAdminMenuOpen(false);
                          handleCloseMenu();
                        }}
                      >
                        Venue Options
                      </Link>
                      <Link
                        to="/admin/contacts"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                        onClick={() => {
                          setAdminMenuOpen(false);
                          handleCloseMenu();
                        }}
                      >
                        Contact Messages
                      </Link>
                      <hr className="my-2 border-border" />
                      <Link
                        to="/admin/flagged-events"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                        onClick={() => {
                          setAdminMenuOpen(false);
                          handleCloseMenu();
                        }}
                      >
                        Flagged Events
                      </Link>
                      <Link
                        to="/admin/flagged-venues"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                        onClick={() => {
                          setAdminMenuOpen(false);
                          handleCloseMenu();
                        }}
                      >
                        Flagged Venues
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Side - Auth/Profile */}
          <div className="hidden lg:flex items-center gap-3">
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
                          window.location.href = "/login";
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
          <div className="lg:hidden">
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
        <div className="lg:hidden border-t border-border bg-bg-primary">
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
            
            {/* Events Section */}
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Events
              </div>
              <Link
                to="/events"
                className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                  isActiveLink("/events") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
                }`}
                onClick={handleCloseMenu}
              >
                Browse Events
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
            </div>
            
            {/* Venues Section */}
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Venues
              </div>
              <Link
                to="/venues"
                className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                  isActiveLink("/venues") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
                }`}
                onClick={handleCloseMenu}
              >
                Browse Venues
              </Link>
              {currentUser && (
                <>
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
                    to="/venue-partner"
                    className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                      isActiveLink("/venue-partner") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
                    }`}
                    onClick={handleCloseMenu}
                  >
                    Venue Partner
                  </Link>
                </>
              )}
            </div>
            
            <Link
              to="/contact"
              className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                isActiveLink("/contact") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
              }`}
              onClick={handleCloseMenu}
            >
              Contact
            </Link>

            {currentUser?.role?.toLowerCase() === "admin" && (
              <>
                <Link
                  to="/admin"
                  className={`block px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                    isActiveLink("/admin") ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-bg-secondary hover:text-primary"
                  }`}
                  onClick={handleCloseMenu}
                >
                  Admin Dashboard
                </Link>
                <div className="pl-4 space-y-1">
                  <Link
                    to="/admin/venues"
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-primary cursor-pointer"
                    onClick={handleCloseMenu}
                  >
                    Manage Venues
                  </Link>
                  <Link
                    to="/admin/venue-options"
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-primary cursor-pointer"
                    onClick={handleCloseMenu}
                  >
                    Venue Options
                  </Link>
                  <Link
                    to="/admin/contacts"
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-primary cursor-pointer"
                    onClick={handleCloseMenu}
                  >
                    Contact Messages
                  </Link>
                  <Link
                    to="/admin/flagged-events"
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-primary cursor-pointer"
                    onClick={handleCloseMenu}
                  >
                    Flagged Events
                  </Link>
                  <Link
                    to="/admin/flagged-venues"
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-primary cursor-pointer"
                    onClick={handleCloseMenu}
                  >
                    Flagged Venues
                  </Link>
                </div>
              </>
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
                      setTimeout(() => {
                        window.location.href = "/login";
                      }, 100);
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
