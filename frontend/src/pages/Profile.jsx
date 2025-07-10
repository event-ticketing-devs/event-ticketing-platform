import toast from "react-hot-toast";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../services/authService";
import ConfirmModal from "../components/ConfirmModal";

const Profile = () => {
  const [showModal, setShowModal] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      await deleteAccount();
      toast.success("Account deleted successfully");
      logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-lg border mt-10">
      <h1 className="text-2xl font-semibold mb-4 text-blue-700">
        Welcome, {currentUser.name}
      </h1>
      <ul className="mb-4 space-y-1 text-slate-700">
        <li>
          <strong>Email:</strong> {currentUser.email}
        </li>
        <li>
          <strong>Phone:</strong> {currentUser.phone}
        </li>
      </ul>
      <Link
        to="/profile/update"
        className="text-blue-600 hover:underline mb-4 block"
      >
        Edit Profile
      </Link>
      <button
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow hover:from-red-600 hover:to-pink-600 transition-all font-semibold cursor-pointer"
      >
        Delete Account
      </button>
      <ConfirmModal
        open={showModal}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone."
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
};

export default Profile;
