import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Profile = () => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">
        Welcome, {currentUser.name}
      </h1>
      <ul className="mb-4 space-y-1">
        <li>
          <strong>Email:</strong> {currentUser.email}
        </li>
        <li>
          <strong>Phone:</strong> {currentUser.phone}
        </li>
      </ul>
      <Link
        to="/profile/update"
        className="text-blue-500 hover:underline mb-4 block"
      >
        Update Profile
      </Link>
      <button
        onClick={() => {
          logout();
          toast.success("Logged out");
        }}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default Profile;
