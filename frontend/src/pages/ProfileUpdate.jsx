import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { ArrowLeft, Save, User, Mail, Phone, RotateCcw, Lock, Info } from 'lucide-react';

const ProfileUpdate = () => {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    phone: currentUser.phone || "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/profile")}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Update Profile
            </h1>
            <p className="text-text-secondary">
              Update your personal information and preferences
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
          {/* Current User Info */}
          <div className="bg-bg-secondary p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-bg-secondary border border-border rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-text-primary">
                  {currentUser.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {currentUser.name || "User"}
                </h3>
                <p className="text-text-secondary">{currentUser.email}</p>
                {currentUser.googleId && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-success/10 border border-success rounded-md text-success text-xs">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google Account
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-text-secondary" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    className="block w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary transition-colors"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-text-secondary" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    className="block w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary transition-colors"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-text-secondary" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    className="block w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary transition-colors"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password Field - Only for non-OAuth users */}
              {!currentUser.googleId && (
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-text-secondary" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      placeholder="Leave blank to keep current password"
                      className="block w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary transition-colors"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    Leave this field empty if you don't want to change your
                    password
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex-1 bg-bg-secondary text-text-primary py-3 px-6 rounded-lg font-semibold hover:bg-bg-secondary/80 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Information Notice */}
          {currentUser.googleId && (
            <div className="p-6 pt-0">
              <div className="bg-success/10 border border-success rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-success/10 border border-success rounded-md flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-success mb-1">
                      Google Account Notice
                    </h4>
                    <p className="text-sm text-success">
                      Since you're signed in with Google, password changes are
                      managed through your Google account settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileUpdate;
