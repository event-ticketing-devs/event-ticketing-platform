import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

// Icon components
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EmailIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CalendarIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LocationIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FlagIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2h7a2 2 0 012 2v6a2 2 0 01-2 2H12l-1-2H6v4m0 0H3m3 0l3-3" />
  </svg>
);

const BanIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const WarningIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EyeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const OrganizerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organizerData, setOrganizerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [showBanForm, setShowBanForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchOrganizerDetails();
  }, [id]);

  const fetchOrganizerDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/users/${id}/full-details`);
      setOrganizerData(response.data);
    } catch (error) {
      console.error('Error fetching organizer details:', error);
      setError(error.response?.data?.message || 'Failed to fetch organizer details');
    } finally {
      setLoading(false);
    }
  };

  const handleContactOrganizer = () => {
    if (!organizerData?.organizer) return;
    
    const subject = encodeURIComponent(`Regarding your account on Event Platform`);
    const body = encodeURIComponent(`Dear ${organizerData.organizer.name},\n\nWe are contacting you regarding your account and events on our platform.\n\nBest regards,\nEvent Platform Admin Team`);
    
    if (organizerData.organizer.email) {
      window.open(`mailto:${organizerData.organizer.email}?subject=${subject}&body=${body}`, '_blank');
    } else {
      alert('No email address available for this organizer');
    }
  };

  const handleCallOrganizer = () => {
    if (!organizerData?.organizer) return;
    
    if (organizerData.organizer.phone) {
      window.open(`tel:${organizerData.organizer.phone}`, '_blank');
    } else {
      alert('No phone number available for this organizer');
    }
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      alert('Please provide a reason for banning this user');
      return;
    }

    if (organizerData.organizer.role === 'admin') {
      alert('Cannot ban an admin user');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.patch(`/users/${id}/ban`, {
        reason: banReason
      });
      alert('User banned successfully');
      setShowBanForm(false);
      setBanReason('');
      fetchOrganizerDetails(); // Refresh data
    } catch (error) {
      console.error('Error banning user:', error);
      alert(error.response?.data?.message || 'Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/users/${id}/unban`);
      alert('User unbanned successfully');
      fetchOrganizerDetails(); // Refresh data
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert(error.response?.data?.message || 'Failed to unban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (organizerData.organizer.role === 'admin') {
      alert('Cannot delete an admin user');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.delete(`/users/${id}`);
      alert('User deleted successfully');
      navigate('/admin/dashboard'); // Navigate back to admin dashboard
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
      reviewed: 'bg-blue-100 text-blue-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (event) => {
    if (!event) return '₹0';
    
    if (event.hasTicketCategories && event.ticketCategories && event.ticketCategories.length > 0) {
      const minPrice = Math.min(...event.ticketCategories.map(c => c.price));
      return `₹${minPrice.toLocaleString()} onwards`;
    }
    
    return `₹${(event.price || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto border border-red-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WarningIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Data</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { organizer, statistics, events, allReports } = organizerData;

  // Modal for ban confirmation
  if (showBanForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Ban Organizer</h2>
            <button
              onClick={() => setShowBanForm(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
          
          <p className="text-slate-600 mb-4">
            Please provide a reason for banning <strong>{organizer.name}</strong>:
          </p>
          
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Enter ban reason..."
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            rows="3"
          />
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowBanForm(false)}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBanUser}
              disabled={actionLoading || !banReason.trim()}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Banning...' : 'Ban User'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal for delete confirmation
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-red-600">
              <WarningIcon />
              <h2 className="text-xl font-bold ml-2">Confirm Deletion</h2>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
          
          <p className="text-slate-600 mb-6">
            Are you sure you want to delete <strong>{organizer.name}</strong>? 
            This action cannot be undone and will permanently remove the organizer and all their events.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon />
            <span className="ml-2 font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-blue-900">Organizer Details</h1>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleContactOrganizer}
            className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <EmailIcon />
            <span className="ml-2">Contact</span>
          </button>
          
          {organizer.phone ? (
            <button
              onClick={handleCallOrganizer}
              className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <PhoneIcon />
              <span className="ml-2">Call</span>
            </button>
          ) : (
            <div className="relative group">
              <button
                disabled
                className="flex items-center px-4 py-2 bg-slate-300 text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                <PhoneIcon />
                <span className="ml-2">Call</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                No phone number available
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
              </div>
            </div>
          )}

          {organizer.isBanned ? (
            <button
              onClick={handleUnbanUser}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon />
              <span className="ml-2">{actionLoading ? 'Unbanning...' : 'Unban User'}</span>
            </button>
          ) : organizer.role === 'admin' ? (
            <div className="relative group">
              <button
                disabled
                className="flex items-center px-4 py-2 bg-slate-300 text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                <BanIcon />
                <span className="ml-2">Ban User</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Cannot ban admin users
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowBanForm(true)}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BanIcon />
              <span className="ml-2">Ban User</span>
            </button>
          )}

          {organizer.role === 'admin' ? (
            <div className="relative group">
              <button
                disabled
                className="flex items-center px-4 py-2 bg-slate-300 text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                <TrashIcon />
                <span className="ml-2">Delete</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Cannot delete admin users
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon />
              <span className="ml-2">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Organizer Profile Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
              <UserIcon className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <h2 className="text-3xl font-bold text-white">{organizer.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  organizer.role === 'admin' 
                    ? 'bg-purple-200 text-purple-900' 
                    : 'bg-blue-200 text-blue-900'
                }`}>
                  {organizer.role.toUpperCase()}
                </span>
              </div>
              <p className="text-blue-100 text-lg">{organizer.email}</p>
              <div className="flex items-center space-x-4 mt-3">
                {organizer.isVerified && (
                  <span className="flex items-center px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                    <CheckIcon className="w-4 h-4 mr-1" />
                    Verified
                  </span>
                )}
                {organizer.isBanned && (
                  <span className="flex items-center px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
                    <BanIcon className="w-4 h-4 mr-1" />
                    Banned
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-slate-700">
                  <EmailIcon />
                  <span className="ml-3 font-medium">{organizer.email}</span>
                </div>
                {organizer.phone ? (
                  <div className="flex items-center text-slate-700">
                    <PhoneIcon />
                    <span className="ml-3 font-medium">{organizer.phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-slate-400">
                    <PhoneIcon />
                    <span className="ml-3 italic">No phone number</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Account Details</h3>
              <div className="space-y-3">
                <div className="flex items-center text-slate-700">
                  <CalendarIcon />
                  <div className="ml-3">
                    <span className="text-sm text-slate-500">Joined</span>
                    <p className="font-medium">{formatDate(organizer.createdAt)}</p>
                  </div>
                </div>
                {organizer.lastLogin && (
                  <div className="flex items-center text-slate-700">
                    <UserIcon />
                    <div className="ml-3">
                      <span className="text-sm text-slate-500">Last Login</span>
                      <p className="font-medium">{formatDate(organizer.lastLogin)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Account Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    organizer.isBanned 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {organizer.isBanned ? 'Banned' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Verification</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    organizer.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {organizer.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                {organizer.isBanned && organizer.banReason && (
                  <div>
                    <span className="text-sm text-slate-500">Ban Reason</span>
                    <p className="text-red-600 font-medium mt-1">{organizer.banReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-slate-900">{statistics.totalEvents}</div>
              <div className="text-sm text-slate-600">Total Events</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-slate-900">{statistics.activeEvents}</div>
              <div className="text-sm text-slate-600">Active Events</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <UserIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-slate-900">{statistics.totalAttendees}</div>
              <div className="text-sm text-slate-600">Total Attendees</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-lg p-3">
              <FlagIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-slate-900">{statistics.totalReports}</div>
              <div className="text-sm text-slate-600">Reports</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Reports ({allReports.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-600">
                    {organizer.name} has organized {statistics.totalEvents} events with a total of {statistics.totalAttendees} attendees.
                    {statistics.totalReports > 0 && ` There are ${statistics.totalReports} reports filed against their events.`}
                  </p>
                </div>
              </div>
              
              {organizer.isBanned && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-red-800 font-semibold mb-2">Account Banned</h4>
                  <p className="text-red-700">
                    <strong>Reason:</strong> {organizer.banReason}
                  </p>
                  <p className="text-red-600 text-sm mt-2">
                    <strong>Banned on:</strong> {formatDate(organizer.bannedAt)}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              {events.length > 0 ? (
                events.map(event => (
                  <div key={event._id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-900">{event.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          new Date(event.date) > new Date() 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                        </span>
                        <button
                          onClick={() => navigate(`/events/${event._id}`)}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          View Event
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div className="flex items-center">
                        <CalendarIcon />
                        <span className="ml-2">{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <LocationIcon />
                        <span className="ml-2">{event.city || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon />
                        <span className="ml-2">{event.attendeeCount || 0} attendees</span>
                      </div>
                    </div>
                    <p className="text-slate-700 mt-2">{event.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-lg font-semibold text-slate-900">{formatCurrency(event)}</span>
                      {event.reportCount > 0 && (
                        <span className="text-red-600 text-sm font-medium">{event.reportCount} reports</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No events found</p>
                </div>
              )}
            </div>
            )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              {allReports.length > 0 ? (
                allReports.map(report => (
                  <div key={report._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-900">{report.eventId?.title || 'Event Not Found'}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-slate-700 mb-2">{report.reason}</p>
                    <div className="text-sm text-slate-600">
                      <p><strong>Reported by:</strong> {report.reportedBy?.name || 'Unknown'}</p>
                      <p><strong>Date:</strong> {formatDate(report.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FlagIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No reports found</p>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
  );
};

export default OrganizerDetailsPage;
