import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../services/authService";
import ConfirmModal from "../components/ConfirmModal";
import apiClient from "../api/apiClient";

const Profile = () => {
  const [showModal, setShowModal] = useState(false);
  const [userStats, setUserStats] = useState({
    totalBookings: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await apiClient.get("/bookings/user");
        const bookings = response.data;

        const now = new Date();
        const upcoming = bookings.filter(
          (booking) => booking.eventId && new Date(booking.eventId.date) > now
        );
        const completed = bookings.filter(
          (booking) => booking.eventId && new Date(booking.eventId.date) <= now
        );
        const totalSpent = bookings.reduce((sum, booking) => {
          const bookingTotal =
            (booking.noOfSeats || 0) * (booking.priceAtBooking || 0);
          return sum + bookingTotal;
        }, 0);

        setUserStats({
          totalBookings: bookings.length,
          upcomingEvents: upcoming.length,
          completedEvents: completed.length,
          totalSpent,
        });
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
        // Set default values on error
        setUserStats({
          totalBookings: 0,
          upcomingEvents: 0,
          completedEvents: 0,
          totalSpent: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "organizer":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">
                  {getInitials(currentUser?.name)}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-800">
                  {currentUser?.name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(
                    currentUser?.role
                  )}`}
                >
                  {currentUser?.role || "User"}
                </span>
              </div>
              <div className="space-y-2 text-slate-600">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                  <span>{currentUser?.email}</span>
                </div>
                {currentUser?.phone && (
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{currentUser.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Link
                to="/profile/update"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-teal-600 hover:shadow-xl transition-all duration-300"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Profile
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 bg-white text-slate-700 px-6 py-2 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Bookings",
              value: loading ? "..." : userStats.totalBookings,
              icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
              color: "from-blue-500 to-blue-600",
            },
            {
              title: "Upcoming Events",
              value: loading ? "..." : userStats.upcomingEvents,
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
              color: "from-green-500 to-green-600",
            },
            {
              title: "Completed Events",
              value: loading ? "..." : userStats.completedEvents,
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              color: "from-purple-500 to-purple-600",
            },
            {
              title: "Total Spent",
              value: loading ? "..." : formatCurrency(userStats.totalSpent),
              icon: "M15 8H9v8h6v-2h-2V8zm-3 6h2v2h-2v-2zm0-4h2v2h-2v-2zM7 6h10v2H7V6zm0 10h10v2H7v-2z",
              color: "from-teal-500 to-teal-600",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  {stat.title === "Total Spent" ? (
                    <span className="text-white font-bold text-xl">₹</span>
                  ) : (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={stat.icon}
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/events"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group"
            >
              <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Browse Events</p>
                <p className="text-sm text-slate-600">Discover new events</p>
              </div>
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 group"
            >
              <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800">My Tickets</p>
                <p className="text-sm text-slate-600">View your bookings</p>
              </div>
            </Link>

            {["organizer", "admin"].includes(
              currentUser?.role?.toLowerCase()
            ) && (
              <Link
                to="/organizer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center transition-colors">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    Organizer Panel
                  </p>
                  <p className="text-sm text-slate-600">Manage your events</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Account Settings
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
              <p className="text-red-600 text-sm mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:from-red-600 hover:to-pink-600 hover:shadow-xl transition-all duration-300"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <ConfirmModal
          open={showModal}
          title="Delete Account"
          description="Are you sure you want to delete your account? This action cannot be undone. All your bookings and data will be permanently removed."
          onClose={() => setShowModal(false)}
          onConfirm={handleDelete}
          confirmText="Delete"
          confirmColor="red"
        />
      </div>
    </div>
  );
};

export default Profile;
