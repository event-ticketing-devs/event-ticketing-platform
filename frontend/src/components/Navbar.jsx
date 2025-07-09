import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  return (
    <nav className="bg-teal-900 text-white px-4 py-3 flex justify-between items-center shadow">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Eventify
        </Link>
        <Link to="/events" className="hover:underline">
          Events
        </Link>
        {currentUser && (
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>
        )}
        {currentUser && currentUser.role === "organizer" && (
          <Link to="/organizer" className="hover:underline">
            Organizer
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {currentUser ? (
          <>
            <span className="hidden sm:inline">{currentUser.name}</span>
            <button
              onClick={logout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
