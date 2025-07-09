import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="backdrop-blur bg-white/80 border-b border-slate-200 text-slate-800 px-6 py-3 flex justify-between items-center shadow-lg rounded-b-xl sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight text-blue-700 hover:text-blue-900 transition-colors"
        >
          <span className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
            Eventify
          </span>
        </Link>
        <Link
          to="/events"
          className="hover:text-blue-600 transition-colors font-medium"
        >
          Events
        </Link>
        {currentUser && (
          <Link
            to="/dashboard"
            className="hover:text-blue-600 transition-colors font-medium"
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
          >
            Organizer
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {currentUser ? (
          <>
            <Link
              to="/profile"
              className="hidden sm:inline font-semibold text-slate-700"
            >
              {currentUser.name}
            </Link>
            <button
              onClick={logout}
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
            >
              Login
            </Link>
            <Link
              to="/register"
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
