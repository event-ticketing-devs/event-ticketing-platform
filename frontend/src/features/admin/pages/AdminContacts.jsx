import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../../../api/apiClient';
import { Mail, Phone, X, CheckCircle2, Clock, AlertCircle, Inbox } from 'lucide-react';

const AdminContacts = () => {
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
      
      const response = await apiClient.get(`/contacts/general?${params}`);
      setContacts(response.data.contacts);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch contacts');
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId, status, notes = '', contactMethod = '') => {
    try {
      const updateData = { status };
      if (notes) updateData.adminNotes = notes;
      if (contactMethod) updateData.contactMethod = contactMethod;

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
  }, [filter]);

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
        return <Clock className="w-4 h-4" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'closed':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Contact Management</h1>
            <p className="mt-1 text-text-secondary">Manage all contact inquiries including general inquiries and event-specific messages</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-bg-primary border border-border rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-start sm:items-center">
            <label className="text-sm font-medium text-text-primary">Filter by status:</label>
            <div className="flex flex-wrap gap-2">general platform inquiries and support request
              {['all', 'pending', 'in-progress', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer rounded-lg ${
                    filter === status
                      ? 'bg-primary text-bg-primary'
                      : 'border border-border text-text-primary hover:bg-bg-secondary'
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
              <div className="animate-spin rounded-full w-12 h-12 border-primary border-b-2"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No contacts found</h3>
              <p className="text-text-secondary">No contact inquiries match your current filter.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-primary border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">Contact</th>
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
                            className="text-primary hover:text-primary/80 font-medium text-sm cursor-pointer"
                          >
                            View Details
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
                  <p className="text-sm text-text-primary">
                    Showing {contacts.length} of {pagination.total} contacts
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchContacts(pagination.current - 1, filter === 'all' ? '' : filter)}
                      disabled={pagination.current === 1}
                      className="px-3 py-1 border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-secondary cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-primary text-bg-primary text-sm rounded-lg">
                      {pagination.current}
                    </span>
                    <button
                      onClick={() => fetchContacts(pagination.current + 1, filter === 'all' ? '' : filter)}
                      disabled={pagination.current === pagination.pages}
                      className="px-3 py-1 border border-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-secondary cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Contact Detail Modal */}
        {showContactModal && selectedContact && (
          <ContactDetailModal
            contact={selectedContact}
            onClose={() => setShowContactModal(false)}
            onUpdateStatus={updateContactStatus}
          />
        )}
      </div>
    </div>
  );
};

// Contact Detail Modal Component
const ContactDetailModal = ({ contact, onClose, onUpdateStatus }) => {
  const [status, setStatus] = useState(contact.status);
  const [notes, setNotes] = useState(contact.adminNotes || '');
  const [contactMethod, setContactMethod] = useState(contact.contactMethod || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onUpdateStatus(contact._id, status, notes, contactMethod);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold text-bg-primary">Contact Details</h2>
          <button
            onClick={onClose}
            className="text-bg-primary/80 hover:text-bg-primary transition-colors p-2 cursor-pointer rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="bg-bg-secondary p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">Contact Information</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`mailto:${contact.email}?subject=Re: ${contact.subject}&body=Hi ${contact.name},%0D%0A%0D%0AThank you for contacting us regarding "${contact.subject}".%0D%0A%0D%0A`, '_blank')}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-bg-primary hover:bg-primary/90 transition-colors text-sm cursor-pointer rounded-lg"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                {contact.phone && (
                  <button
                    onClick={() => window.open(`tel:${contact.phone}`, '_self')}
                    className="flex items-center gap-2 px-3 py-2 border border-border text-text-primary hover:bg-bg-secondary transition-colors text-sm cursor-pointer rounded-lg"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-text-secondary">Name</p>
                <p className="text-text-primary">{contact.name}</p>
              </div>
              <div>
                <p className="font-medium text-text-secondary">Email</p>
                <p className="text-text-primary">{contact.email}</p>
              </div>
              {contact.phone && (
                <div>
                  <p className="font-medium text-text-secondary">Phone</p>
                  <p className="text-text-primary">{contact.phone}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-text-secondary">Date Submitted</p>
                <p className="text-text-primary">
                  {new Date(contact.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="font-semibold text-text-primary mb-2">Subject</h3>
            <p className="text-text-secondary mb-4">{contact.subject}</p>
            
            <h3 className="font-semibold text-text-primary mb-2">Message</h3>
            <div className="bg-bg-secondary p-4 rounded-lg">
              <p className="text-text-secondary whitespace-pre-wrap">{contact.message}</p>
            </div>
          </div>

          {/* Admin Actions */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
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
                  Contact Method
                </label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="">Not specified</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Admin Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Add internal notes about this contact..."
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-border text-text-primary font-semibold hover:bg-bg-secondary transition-all duration-200 cursor-pointer rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-6 font-semibold text-bg-primary transition-all duration-200 cursor-pointer rounded-lg ${
                  loading
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {loading ? 'Updating...' : 'Update Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminContacts;
