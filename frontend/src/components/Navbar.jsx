import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleCloseMenu = () => setMenuOpen(false);

  return (
    <nav className="backdrop-blur bg-white/80 border-b border-slate-200 text-slate-800 px-6 py-3 flex justify-between items-center shadow-lg rounded-b-xl sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight text-blue-700 hover:text-blue-900 transition-colors"
          onClick={handleCloseMenu}
        >
          <span className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
            Eventify
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/events"
            className="hover:text-blue-600 transition-colors font-medium"
            onClick={handleCloseMenu}
          >
            Events
          </Link>
          {currentUser && (
            <Link
              to="/dashboard"
              className="hover:text-blue-600 transition-colors font-medium"
              onClick={handleCloseMenu}
            >
              Dashboard
            </Link>
          )}
          {["organizer", "admin"].includes(
            currentUser?.role?.toLowerCase?.()
          ) && (
            <Link
              to="/organizer"
              className="hover:text-blue-600 transition-colors font-medium"
              onClick={handleCloseMenu}
            >
              Organizer
            </Link>
          )}
        </div>
      </div>
      <div className="md:hidden flex items-center">
        <button
          className="focus:outline-none flex flex-col justify-center items-center w-10 h-10"
          onClick={handleMenuToggle}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-6 bg-blue-700 rounded transition-all duration-300 mb-1 origin-center ${
              menuOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          ></span>
          <span
            className={`block h-0.5 w-6 bg-blue-700 rounded transition-all duration-300 mb-1 origin-center ${
              menuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block h-0.5 w-6 bg-blue-700 rounded transition-all duration-300 origin-center ${
              menuOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          ></span>
        </button>
      </div>
      {/* Desktop right side */}
      <div className="hidden md:flex items-center gap-4">
        {currentUser ? (
          <>
            <Link
              to="/profile"
              className="hidden sm:inline font-semibold text-slate-700"
              onClick={handleCloseMenu}
            >
              {currentUser.name}
            </Link>
            <button
              onClick={() => {
                logout();
                handleCloseMenu();
              }}
              className="bg-gradient-to-r from-red-500 to-pink-500 px-4 py-1.5 rounded-lg text-white font-semibold shadow hover:from-red-600 hover:to-pink-600 transition-all focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="hover:text-blue-600 transition-colors font-medium"
              onClick={handleCloseMenu}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="hover:text-blue-600 transition-colors font-medium"
              onClick={handleCloseMenu}
            >
              Register
            </Link>
          </>
        )}
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-lg flex flex-col items-center gap-4 py-4 md:hidden animate-fade-in z-50">
          <Link
            to="/events"
            className="hover:text-blue-600 transition-colors font-medium"
            onClick={handleCloseMenu}
          >
            Events
          </Link>
          {currentUser && (
            <Link
              to="/dashboard"
              className="hover:text-blue-600 transition-colors font-medium"
              onClick={handleCloseMenu}
            >
              Dashboard
            </Link>
          )}
          {["organizer", "admin"].includes(
            currentUser?.role?.toLowerCase?.()
          ) && (
            <Link
              to="/organizer"
              className="hover:text-blue-600 transition-colors font-medium"
              onClick={handleCloseMenu}
            >
              Organizer
            </Link>
          )}
          {currentUser ? (
            <>
              <Link
                to="/profile"
                className="font-semibold text-slate-700"
                onClick={handleCloseMenu}
              >
                {currentUser.name}
              </Link>
              <button
                onClick={() => {
                  logout();
                  handleCloseMenu();
                }}
                className="bg-gradient-to-r from-red-500 to-pink-500 px-4 py-1.5 rounded-lg text-white font-semibold shadow hover:from-red-600 hover:to-pink-600 transition-all focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:text-blue-600 transition-colors font-medium"
                onClick={handleCloseMenu}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hover:text-blue-600 transition-colors font-medium"
                onClick={handleCloseMenu}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
