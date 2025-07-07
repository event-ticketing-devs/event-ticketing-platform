import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ProfileUpdate = () => {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const filteredData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value.trim() !== "")
      );

      const updatedUser = await updateProfile(filteredData);
      login({ ...currentUser, ...updatedUser });
      toast.success("Profile updated successfully!");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Update Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full p-2 border rounded"
        />
        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full p-2 border rounded"
        />
        <input
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="New Password (optional)"
          type="password"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default ProfileUpdate;
