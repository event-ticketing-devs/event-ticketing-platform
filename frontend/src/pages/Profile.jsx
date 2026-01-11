import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../services/authService";
import ConfirmModal from "../common/components/ConfirmModal";
import apiClient from "../api/apiClient";
import { User, Mail, Phone, Edit, Trash2, Calendar, Ticket, CheckCircle2, Check, MailCheck, AlertCircle } from 'lucide-react';

const Profile = () => {
  const [showModal, setShowModal] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [userStats, setUserStats] = useState({
    totalBookings: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const { currentUser, logout, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Refresh user data on mount to ensure isVerified is up-to-date
  useEffect(() => {
    const refreshUserData = async () => {
      if (refreshUser) {
        await refreshUser();
      }
    };
    refreshUserData();
  }, [refreshUser]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await apiClient.get("/bookings/user?limit=100");
        
        // Handle both old and new API response formats
        const bookings = response.data.bookings || response.data;

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
        // If 401, user session expired - logout
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          logout();
          navigate("/login");
          return;
        }
        // Set default values on other errors
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
  }, [logout, navigate]);

  const handleDelete = async () => {
    try {
      await deleteAccount();
      toast.success("Sorry to see you go! Your account has been deleted successfully.", {
        duration: 4000,
        icon: "👋",
      });
      logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  const handleResendVerification = async () => {
    if (!currentUser?.email) {
      toast.error("Please add an email address to your profile to get verified");
      navigate("/profile/update");
      return;
    }

    try {
      setSendingVerification(true);
      await apiClient.post("/auth/resend-verification", {
        email: currentUser.email,
      });
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send verification email"
      );
    } finally {
      setSendingVerification(false);
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
        return "bg-warning/10 text-warning border-warning/20";
      case "organizer":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="bg-bg-primary border border-border rounded-lg p-4 sm:p-6 md:p-8 mb-8 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center">
                <span className="text-bg-primary font-bold text-xl sm:text-2xl">
                  {getInitials(currentUser?.name)}
                </span>
              </div>
              {currentUser?.isVerified && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success border-4 border-bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-bg-primary stroke-[5]" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary break-words">
                  {currentUser?.name}
                </h1>
                <span
                  className={`px-2.5 sm:px-3 py-1 text-xs sm:text-sm rounded-md font-medium border self-center md:self-auto ${getRoleColor(
                    currentUser?.role
                  )}`}
                >
                  {currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "User"}
                </span>
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-text-secondary text-sm sm:text-base">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="break-all">{currentUser?.email}</span>
                </div>
                {currentUser?.phone && (
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{currentUser.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 sm:gap-3 w-full md:w-auto">
              {!currentUser?.isVerified && (
                <button
                  onClick={handleResendVerification}
                  disabled={sendingVerification}
                  className="flex items-center justify-center gap-2 bg-warning text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-warning/90 transition-colors cursor-pointer text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MailCheck className="w-4 h-4" />
                  {sendingVerification ? "Sending..." : "Verify Email"}
                </button>
              )}
              <Link
                to="/profile/update"
                className="flex items-center justify-center gap-2 bg-primary text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer text-sm sm:text-base"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 bg-bg-primary text-text-primary px-4 sm:px-6 py-2 rounded-lg font-semibold border border-border hover:bg-bg-secondary hover:border-border transition-colors cursor-pointer text-sm sm:text-base"
              >
                <Calendar className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Verification Status Section */}
        {!currentUser?.isVerified && (
          <div className="bg-warning/10 border border-warning rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-warning" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Email Verification Required
                </h3>
                {currentUser?.email ? (
                  <>
                    <p className="text-text-secondary mb-4">
                      Your email address <strong>{currentUser.email}</strong> needs to be verified. 
                      You won't be able to create or edit events and venues until you verify your email.
                    </p>
                    <button
                      onClick={handleResendVerification}
                      disabled={sendingVerification}
                      className="inline-flex items-center gap-2 bg-warning text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-warning/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MailCheck className="w-4 h-4" />
                      {sendingVerification ? "Sending..." : "Send Verification Email"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-text-secondary mb-4">
                      You need to add an email address to your profile to get verified and access all features.
                    </p>
                    <Link
                      to="/profile/update"
                      className="inline-flex items-center gap-2 bg-warning text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-warning/90 transition-colors cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      Add Email Address
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Total Bookings",
              value: loading ? "..." : userStats.totalBookings,
              icon: <Ticket className="w-6 h-6 text-white" />,
              color: "bg-primary",
            },
            {
              title: "Upcoming Events",
              value: loading ? "..." : userStats.upcomingEvents,
              icon: <Calendar className="w-6 h-6 text-white" />,
              color: "bg-primary",
            },
            {
              title: "Completed Events",
              value: loading ? "..." : userStats.completedEvents,
              icon: <CheckCircle2 className="w-6 h-6 text-white" />,
              color: "bg-success",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-bg-primary border border-border rounded-lg p-6 hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-medium mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-text-primary">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-bg-primary border border-border rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/events"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-bg-secondary transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 bg-bg-secondary group-hover:bg-bg-primary border border-border rounded-lg flex items-center justify-center transition-colors">
                <Calendar className="w-5 h-5 text-text-primary" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">Browse Events</p>
                <p className="text-sm text-text-secondary">Discover new events</p>
              </div>
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-bg-secondary transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 bg-bg-secondary group-hover:bg-bg-primary border border-border rounded-lg flex items-center justify-center transition-colors">
                <Ticket className="w-5 h-5 text-text-primary" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">My Tickets</p>
                <p className="text-sm text-text-secondary">View your bookings</p>
              </div>
            </Link>

            {["organizer", "admin"].includes(
              currentUser?.role?.toLowerCase()
            ) && (
              <Link
                to="/organizer"
                className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-bg-secondary transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 bg-bg-secondary group-hover:bg-bg-primary border border-border rounded-lg flex items-center justify-center transition-colors">
                  <User className="w-5 h-5 text-text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    Organizer Panel
                  </p>
                  <p className="text-sm text-text-secondary">Manage your events</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-bg-primary border border-border rounded-lg p-8">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Account Settings
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-error/10 border border-error rounded-lg">
              <h3 className="font-semibold text-error mb-2">Danger Zone</h3>
              <p className="text-error text-sm mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-error text-white px-6 py-2 rounded-lg font-semibold hover:bg-error/90 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
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
