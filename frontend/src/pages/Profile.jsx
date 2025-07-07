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
        className="text-blue-600 hover:underline mb-4 block"
      >
        Update Profile
      </Link>
      <button
        onClick={() => {
          logout();
          toast.success("Logged out");
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded block"
      >
        Logout
      </button>
      <button
        onClick={() => setShowModal(true)}
        className="bg-red-600 text-white px-4 py-2 rounded mt-3"
      >
        Delete My Account
      </button>

      <ConfirmModal
        open={showModal}
        title="Delete Account?"
        message="This action cannot be undone. Are you sure you want to delete your account?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        onCancel={() => setShowModal(false)}
        onConfirm={() => {
          setShowModal(false);
          handleDelete();
        }}
      />
    </div>
  );
};

export default Profile;
