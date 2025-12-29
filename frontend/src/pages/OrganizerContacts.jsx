import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../api/apiClient';
import TeamChat from '../components/TeamChat';
import { useAuth } from '../context/AuthContext';

const OrganizerContacts = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' or 'team-chat'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const fetchContacts = async (page = 1, status = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (status && status !== 'all') params.append('status', status);
      
      const response = await apiClient.get(`/contacts/organizer?${params}`);
      
      setContacts(response.data.contacts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId, status, notes = '') => {
    try {
      const updateData = { status };
      if (notes) updateData.adminNotes = notes;

      await apiClient.patch(`/contacts/${contactId}/status`, updateData);
      toast.success('Contact status updated successfully');
      fetchContacts(pagination.current, filter === 'all' ? '' : filter);
      setShowContactModal(false);
    } catch (error) {
      toast.error('Failed to update contact status');
      console.error('Error updating contact:', error);
    }
  };

  useEffect(() => {
    fetchContacts(1, filter === 'all' ? '' : filter);
    if (activeTab === 'team-chat') {
      fetchMyEvents();
    }
  }, [filter, activeTab]);

  const fetchMyEvents = async () => {
    try {
      const response = await apiClient.get('/events?sortBy=date&sortOrder=asc&limit=100');
      const allEvents = response.data.events || response.data;
      
      // Filter events where user is organizer, co-organizer, or verifier
      const myEvents = allEvents.filter((event) => {
        const organizerId = event.organizerId?._id || event.organizerId;
        const isMainOrganizer = organizerId === currentUser?._id;
        
        // Check if user is a co-organizer
        const isCoOrganizer = event.coOrganizers?.some(
          coOrgId => {
            const id = coOrgId._id || coOrgId;
            return id === currentUser?._id;
          }
        );
        
        // Check if user is a verifier
        const isVerifier = event.verifiers?.some(
          verifierId => {
            const id = verifierId._id || verifierId;
            return id === currentUser?._id;
          }
        );
        
        return isMainOrganizer || isCoOrganizer || isVerifier;
      });
      
      setMyEvents(myEvents);
      if (myEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(myEvents[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error('Error fetching events:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'in-progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'resolved': return 'bg-success/10 text-success border-success/20';
      case 'closed': return 'bg-bg-secondary text-text-secondary border-border';
      default: return 'bg-bg-secondary text-text-secondary border-border';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'in-progress':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'resolved':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'closed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-4">Messages</h1>
          <p className="text-text-secondary">Manage contact inquiries and team communication</p>
        </div>

        {/* Tabs */}
        <div className="bg-bg-primary border border-border rounded-lg mb-6 overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'inquiries'
                  ? 'text-text-primary border-b-2 border-primary bg-bg-secondary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Event Inquiries
              </div>
            </button>
            <button
              onClick={() => setActiveTab('team-chat')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'team-chat'
                  ? 'text-text-primary border-b-2 border-primary bg-bg-secondary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                Team Chat
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'inquiries' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Messages', value: pagination.total, color: 'bg-bg-secondary', iconColor: 'text-primary' },
                { 
                  label: 'Pending', 
                  value: contacts.filter(c => c.status === 'pending').length, 
                  color: 'bg-bg-secondary', 
                  iconColor: 'text-primary' 
                },
                { 
                  label: 'In Progress', 
                  value: contacts.filter(c => c.status === 'in-progress').length, 
                  color: 'bg-bg-secondary',
                  iconColor: 'text-primary'
                },
                { 
                  label: 'Resolved', 
                  value: contacts.filter(c => c.status === 'resolved').length, 
                  color: 'bg-bg-secondary',
                  iconColor: 'text-primary'
                },
              ].map((stat, index) => (
                <div key={index} className="bg-bg-primary border border-border rounded-lg p-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${stat.color} border border-border rounded-lg flex items-center justify-center mr-4`}>
                      <svg className={`w-6 h-6 ${stat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                      <p className="text-sm text-text-secondary">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

        {/* Filters */}
        <div className="bg-bg-primary border border-border rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="text-sm font-medium text-text-primary">Filter by status:</label>
            <div className="flex gap-2">
              {['all', 'pending', 'in-progress', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-2 border border-border rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    filter === status
                      ? 'bg-primary text-bg-primary'
                      : 'bg-bg-secondary text-text-primary hover:bg-bg-secondary/80'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-b-2 rounded-full border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-text-primary mb-2">No messages found</h3>
              <p className="text-text-secondary">No contact messages match your current filter.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-secondary border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">Contact</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">Event</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">Subject</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {contacts.map((contact) => (
                      <tr key={contact._id} className="hover:bg-bg-secondary transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-text-primary">{contact.name}</p>
                            <p className="text-sm text-text-secondary">{contact.email}</p>
                            {contact.phone && (
                              <p className="text-sm text-text-secondary">{contact.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-text-primary">{contact.eventId?.title}</p>
                            <p className="text-sm text-text-secondary">
                              {contact.eventId?.date && new Date(contact.eventId.date).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-text-primary">{contact.subject}</p>
                          <p className="text-sm text-text-secondary truncate max-w-xs">
                            {contact.message}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-md ${getStatusColor(contact.status)}`}>
                            {getStatusIcon(contact.status)}
                            {contact.status.charAt(0).toUpperCase() + contact.status.slice(1).replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-text-primary">
                            {new Date(contact.createdAt).toLocaleDateString('en-IN')}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {new Date(contact.createdAt).toLocaleTimeString('en-IN')}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowContactModal(true);
                            }}
                            className="text-text-primary border border-border hover:border-primary rounded-lg p-2 font-medium text-sm cursor-pointer transition-colors"
                          >
                            View & Respond
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    Showing {contacts.length} of {pagination.total} messages
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchContacts(pagination.current - 1, filter === 'all' ? '' : filter)}
                      disabled={pagination.current === 1}
                      className="px-3 py-1 border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-primary text-bg-primary rounded-lg text-sm">
                      {pagination.current}
                    </span>
                    <button
                      onClick={() => fetchContacts(pagination.current + 1, filter === 'all' ? '' : filter)}
                      disabled={pagination.current === pagination.pages}
                      className="px-3 py-1 border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </> 
        ) : (
          /* Team Chat Tab */
          <div className="space-y-6">
            {/* Event Selector */}
            {myEvents.length > 0 && (
              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Select Event
                </label>
                <select
                  value={selectedEvent?._id || ''}
                  onChange={(e) => {
                    const event = myEvents.find(ev => ev._id === e.target.value);
                    setSelectedEvent(event);
                  }}
                  className="w-full md:w-1/2 px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  {myEvents.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Team Chat Component */}
            {selectedEvent ? (
              <TeamChat eventId={selectedEvent._id} eventTitle={selectedEvent.title} />
            ) : (
              <div className="bg-bg-primary border border-border rounded-lg p-12 text-center">
                <svg
                  className="w-16 h-16 text-text-secondary mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-text-primary mb-2">No Events Available</h3>
                <p className="text-text-secondary">You don't have any events to chat about yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Contact Detail Modal */}
        {showContactModal && selectedContact && (
          <OrganizerContactModal
            contact={selectedContact}
            onClose={() => setShowContactModal(false)}
            onUpdateStatus={updateContactStatus}
          />
        )}
      </div>
    </div>
  );
};

// Organizer Contact Modal Component
const OrganizerContactModal = ({ contact, onClose, onUpdateStatus }) => {
  const [status, setStatus] = useState(contact.status);
  const [notes, setNotes] = useState(contact.adminNotes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onUpdateStatus(contact._id, status, notes);
    setLoading(false);
  };

  const handleEmailContact = () => {
    const subject = encodeURIComponent(`Re: ${contact.subject} - ${contact.eventId?.title}`);
    const body = encodeURIComponent(`Hi ${contact.name},\n\nThank you for your inquiry about ${contact.eventId?.title}.\n\n`);
    window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`);
  };

  const handlePhoneContact = () => {
    if (contact.phone) {
      window.open(`tel:${contact.phone}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary border-2 border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-bg-primary">Event Inquiry</h2>
            <p className="text-bg-primary/80 text-sm">{contact.eventId?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-bg-primary/80 hover:text-bg-primary transition-colors p-2 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="bg-bg-secondary border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">Contact Information</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleEmailContact}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-bg-primary border border-border rounded-lg hover:bg-primary/90 transition-colors text-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
                {contact.phone && (
                  <button
                    onClick={handlePhoneContact}
                    className="flex items-center gap-2 px-3 py-2 bg-success text-bg-primary border border-border rounded-lg hover:bg-success/90 transition-colors text-sm cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </button>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-text-primary">Name</p>
                <p className="text-text-primary">{contact.name}</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Email</p>
                <p className="text-text-primary">{contact.email}</p>
              </div>
              {contact.phone && (
                <div>
                  <p className="font-medium text-text-primary">Phone</p>
                  <p className="text-text-primary">{contact.phone}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-text-primary">Date Submitted</p>
                <p className="text-text-primary">
                  {new Date(contact.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="bg-bg-secondary border border-border rounded-lg p-4">
            <h3 className="font-semibold text-text-primary mb-3">Event Details</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-text-primary">Event Name</p>
                <p className="text-text-primary">{contact.eventId?.title}</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Event Date</p>
                <p className="text-text-primary">
                  {contact.eventId?.date && new Date(contact.eventId.date).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="font-semibold text-text-primary mb-2">Subject</h3>
            <p className="text-text-primary mb-4">{contact.subject}</p>
            
            <h3 className="font-semibold text-text-primary mb-2">Message</h3>
            <div className="bg-bg-secondary border border-border rounded-lg p-4">
              <p className="text-text-primary whitespace-pre-wrap">{contact.message}</p>
            </div>
          </div>

          {/* Status Update */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Internal Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Add notes about this inquiry and your response..."
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-border rounded-lg text-text-primary font-medium hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-6 border border-border rounded-lg font-semibold text-bg-primary transition-colors cursor-pointer ${
                  loading
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrganizerContacts;
