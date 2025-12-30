import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { ArrowLeft, User, Mail, Calendar, MapPin, CheckCircle2, Users, Phone, Flag, Ban, Check, Trash2, AlertTriangle, X, Eye } from 'lucide-react';

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
      pending: 'bg-warning/10 text-warning border border-warning/20',
      resolved: 'bg-success/10 text-success border border-success/20',
      dismissed: 'bg-bg-secondary text-text-secondary border border-border',
      reviewed: 'bg-primary/10 text-primary border border-primary/20'
    };
    return styles[status] || 'bg-bg-secondary text-text-secondary border border-border';
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
          <div className="animate-spin rounded-full w-12 h-12 border-primary border-b-2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-bg-primary rounded-lg shadow p-8 max-w-md mx-auto border border-error/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Error Loading Data</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-primary text-bg-primary py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium cursor-pointer"
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-bg-primary rounded-lg shadow-lg p-4 sm:p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-text-primary">Ban Organizer</h2>
            <button
              onClick={() => setShowBanForm(false)}
              className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-text-secondary mb-4">
            Please provide a reason for banning <strong>{organizer.name}</strong>:
          </p>
          
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Enter ban reason..."
            className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"
            rows="3"
          />
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowBanForm(false)}
              className="flex-1 px-4 py-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-bg-secondary/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleBanUser}
              disabled={actionLoading || !banReason.trim()}
              className="flex-1 px-4 py-2 bg-error text-bg-primary rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 cursor-pointer"
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-bg-primary rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-error">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-xl font-bold ml-2">Confirm Deletion</h2>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-text-secondary mb-6">
            Are you sure you want to delete <strong>{organizer.name}</strong>? 
            This action cannot be undone and will permanently remove the organizer and all their events.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-bg-secondary/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 bg-error text-bg-primary rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors cursor-pointer self-start"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="ml-2 font-medium text-sm sm:text-base">Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Organizer Details</h1>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleContactOrganizer}
            className="flex items-center px-3 sm:px-4 py-2 bg-success text-bg-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success/20 focus:ring-offset-2 transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span className="ml-1 sm:ml-2">Contact</span>
          </button>
          
          {organizer.phone ? (
            <button
              onClick={handleCallOrganizer}
              className="flex items-center px-3 sm:px-4 py-2 bg-primary text-bg-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span className="ml-1 sm:ml-2">Call</span>
            </button>
          ) : (
            <div className="relative group">
              <button
                disabled
                className="flex items-center px-4 py-2 bg-bg-secondary text-text-secondary text-sm font-medium rounded-lg cursor-not-allowed"
              >
                <Phone className="w-4 h-4" />
                <span className="ml-2">Call</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-text-primary text-bg-primary text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                No phone number available
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-text-primary"></div>
              </div>
            </div>
          )}

          {organizer.isBanned ? (
            <button
              onClick={handleUnbanUser}
              disabled={actionLoading}
              className="flex items-center px-3 sm:px-4 py-2 bg-success text-bg-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success/20 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span className="ml-1 sm:ml-2">{actionLoading ? 'Unbanning...' : 'Unban'}</span>
            </button>
          ) : organizer.role === 'admin' ? (
            <div className="relative group">
              <button
                disabled
                className="flex items-center px-4 py-2 bg-bg-secondary text-text-secondary text-sm font-medium rounded-lg cursor-not-allowed"
              >
                <Ban className="w-4 h-4" />
                <span className="ml-2">Ban User</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-text-primary text-bg-primary text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Cannot ban admin users
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-text-primary"></div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowBanForm(true)}
              disabled={actionLoading}
              className="flex items-center px-3 sm:px-4 py-2 bg-warning text-bg-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-warning/90 focus:outline-none focus:ring-2 focus:ring-warning/20 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Ban className="w-4 h-4" />
              <span className="ml-1 sm:ml-2"><span className="hidden sm:inline">Ban </span>User</span>
            </button>
          )}

          {organizer.role === 'admin' ? (
            <div className="relative group">
              <button
                disabled
                className="flex items-center px-4 py-2 bg-bg-secondary text-text-secondary text-sm font-medium rounded-lg cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span className="ml-2">Delete</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-text-primary text-bg-primary text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Cannot delete admin users
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-text-primary"></div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={actionLoading}
              className="flex items-center px-3 sm:px-4 py-2 bg-error text-bg-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-error/20 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="ml-1 sm:ml-2">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Organizer Profile Section */}
      <div className="bg-bg-primary rounded-lg shadow overflow-hidden mb-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
            <div className="bg-bg-primary/20 backdrop-blur-sm rounded-full p-4 sm:p-6 flex-shrink-0">
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-bg-primary" />
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-bg-primary break-words">{organizer.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold self-center sm:self-auto flex-shrink-0 ${
                  organizer.role === 'admin' 
                    ? 'bg-bg-secondary/20 text-bg-secondary border border-bg-secondary/30' 
                    : 'bg-bg-primary/20 text-bg-primary border border-bg-primary/30'
                }`}>
                  {organizer.role.toUpperCase()}
                </span>
              </div>
              <p className="text-bg-primary/80 text-base sm:text-lg break-all mb-2 sm:mb-0">{organizer.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-3">
                {organizer.isVerified && (
                  <span className="flex items-center px-3 py-1 bg-success text-bg-primary rounded-full text-sm font-medium">
                    <Check className="w-4 h-4 mr-1" />
                    Verified
                  </span>
                )}
                {organizer.isBanned && (
                  <span className="flex items-center px-3 py-1 bg-error text-bg-primary rounded-full text-sm font-medium">
                    <Ban className="w-4 h-4 mr-1" />
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
              <h3 className="text-lg font-semibold text-text-primary border-b border-border pb-2">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-text-primary">
                  <Mail className="w-4 h-4" />
                  <span className="ml-3 font-medium">{organizer.email}</span>
                </div>
                {organizer.phone ? (
                  <div className="flex items-center text-text-primary">
                    <Phone className="w-4 h-4" />
                    <span className="ml-3 font-medium">{organizer.phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-text-secondary">
                    <Phone className="w-4 h-4" />
                    <span className="ml-3 italic">No phone number</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-border pb-2">Account Details</h3>
              <div className="space-y-3">
                <div className="flex items-center text-text-primary">
                  <Calendar className="w-4 h-4" />
                  <div className="ml-3">
                    <span className="text-sm text-text-secondary">Joined</span>
                    <p className="font-medium">{formatDate(organizer.createdAt)}</p>
                  </div>
                </div>
                {organizer.lastLogin && (
                  <div className="flex items-center text-text-primary">
                    <User className="w-4 h-4" />
                    <div className="ml-3">
                      <span className="text-sm text-text-secondary">Last Login</span>
                      <p className="font-medium">{formatDate(organizer.lastLogin)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-border pb-2">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Account Status</span>
                  <span className={`px-3 py-1 rounded-md text-sm font-medium ${
                    organizer.isBanned 
                      ? 'bg-error/10 text-error border border-error/20' 
                      : 'bg-success/10 text-success border border-success/20'
                  }`}>
                    {organizer.isBanned ? 'Banned' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Verification</span>
                  <span className={`px-3 py-1 rounded-md text-sm font-medium ${
                    organizer.isVerified 
                      ? 'bg-success/10 text-success border border-success/20' 
                      : 'bg-warning/10 text-warning border border-warning/20'
                  }`}>
                    {organizer.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                {organizer.isBanned && organizer.banReason && (
                  <div>
                    <span className="text-sm text-text-secondary">Ban Reason</span>
                    <p className="text-error font-medium mt-1">{organizer.banReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-bg-primary rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-primary/10 rounded-lg p-3">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-text-primary">{statistics.totalEvents}</div>
              <div className="text-sm text-text-secondary">Total Events</div>
            </div>
          </div>
        </div>
        
        <div className="bg-bg-primary rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-success/10 rounded-lg p-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-text-primary">{statistics.activeEvents}</div>
              <div className="text-sm text-text-secondary">Active Events</div>
            </div>
          </div>
        </div>
        
        <div className="bg-bg-primary rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-secondary/10 rounded-lg p-3">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-text-primary">{statistics.totalAttendees}</div>
              <div className="text-sm text-text-secondary">Total Attendees</div>
            </div>
          </div>
        </div>
        
        <div className="bg-bg-primary rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-error/10 rounded-lg p-3">
              <Flag className="w-6 h-6 text-error" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-text-primary">{statistics.totalReports}</div>
              <div className="text-sm text-text-secondary">Reports</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="bg-bg-primary rounded-lg shadow overflow-hidden mb-8">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === 'events'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
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
                <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
                <div className="bg-bg-secondary rounded-lg p-4">
                  <p className="text-text-secondary">
                    {organizer.name} has organized {statistics.totalEvents} events with a total of {statistics.totalAttendees} attendees.
                    {statistics.totalReports > 0 && ` There are ${statistics.totalReports} reports filed against their events.`}
                  </p>
                </div>
              </div>
              
              {organizer.isBanned && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                  <h4 className="text-error font-semibold mb-2">Account Banned</h4>
                  <p className="text-error">
                    <strong>Reason:</strong> {organizer.banReason}
                  </p>
                  <p className="text-error text-sm mt-2">
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
                  <div key={event._id} className="border border-border rounded-lg p-4 hover:bg-bg-secondary transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-text-primary">{event.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          new Date(event.date) > new Date() 
                            ? 'bg-success/10 text-success border border-success/20' 
                            : 'bg-bg-secondary text-text-secondary border border-border'
                        }`}>
                          {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                        </span>
                        <button
                          onClick={() => navigate(`/events/${event._id}`)}
                          className="flex items-center px-3 py-1 bg-primary text-bg-primary text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Event
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-text-secondary">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4" />
                        <span className="ml-2">{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4" />
                        <span className="ml-2">{event.city || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4" />
                        <span className="ml-2">{event.attendeeCount || 0} attendees</span>
                      </div>
                    </div>
                    <p className="text-text-primary mt-2">{event.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-lg font-semibold text-text-primary">{formatCurrency(event)}</span>
                      {event.reportCount > 0 && (
                        <span className="text-error text-sm font-medium">{event.reportCount} reports</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-text-secondary" />
                  <p>No events found</p>
                </div>
              )}
            </div>
            )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              {allReports.length > 0 ? (
                allReports.map(report => (
                  <div key={report._id} className="border border-error/20 rounded-lg p-4 bg-error/10">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-text-primary">{report.eventId?.title || 'Event Not Found'}</h4>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-text-primary mb-2">{report.reason}</p>
                    <div className="text-sm text-text-secondary">
                      <p><strong>Reported by:</strong> {report.reportedBy?.name || 'Unknown'}</p>
                      <p><strong>Date:</strong> {formatDate(report.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Flag className="w-12 h-12 mx-auto mb-4 text-text-secondary" />
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
