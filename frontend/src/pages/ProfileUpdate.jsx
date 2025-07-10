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
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow-lg border mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-blue-700">
        Update Profile
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        {/* Only show password field for non-OAuth users */}
        {!currentUser.googleId && (
          <input
            type="password"
            name="password"
            placeholder="New Password (leave blank to keep current)"
            className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={formData.password}
            onChange={handleChange}
          />
        )}
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-6 py-2 rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all font-semibold cursor-pointer"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default ProfileUpdate;
