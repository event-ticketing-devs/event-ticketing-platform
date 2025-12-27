import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../api/apiClient';

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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Contact Management</h1>
          <p className="text-slate-600">Manage general contact inquiries and support requests</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="text-sm font-medium text-slate-700">Filter by status:</label>
            <div className="flex gap-2">
              {['all', 'pending', 'in-progress', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                    filter === status
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white border border-slate-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full w-12 h-12 border-slate-900 border-b-2"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No contacts found</h3>
              <p className="text-slate-500">No contact inquiries match your current filter.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">Contact</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">Subject</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {contacts.map((contact) => (
                      <tr key={contact._id} className="hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-slate-900">{contact.name}</p>
                            <p className="text-sm text-slate-500">{contact.email}</p>
                            {contact.phone && (
                              <p className="text-sm text-slate-500">{contact.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-slate-900">{contact.subject}</p>
                          <p className="text-sm text-slate-500 truncate max-w-xs">
                            {contact.message}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border ${getStatusColor(contact.status)}`}>
                            {getStatusIcon(contact.status)}
                            {contact.status.charAt(0).toUpperCase() + contact.status.slice(1).replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-slate-900">
                            {new Date(contact.createdAt).toLocaleDateString('en-IN')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(contact.createdAt).toLocaleTimeString('en-IN')}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowContactModal(true);
                            }}
                            className="text-slate-900 hover:text-slate-700 font-medium text-sm cursor-pointer"
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
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-sm text-slate-700">
                    Showing {contacts.length} of {pagination.total} contacts
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchContacts(pagination.current - 1, filter === 'all' ? '' : filter)}
                      disabled={pagination.current === 1}
                      className="px-3 py-1 border border-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-slate-900 text-white text-sm">
                      {pagination.current}
                    </span>
                    <button
                      onClick={() => fetchContacts(pagination.current + 1, filter === 'all' ? '' : filter)}
                      disabled={pagination.current === pagination.pages}
                      className="px-3 py-1 border border-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
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
      <div className="bg-white border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Contact Details</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Contact Information</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`mailto:${contact.email}?subject=Re: ${contact.subject}&body=Hi ${contact.name},%0D%0A%0D%0AThank you for contacting us regarding "${contact.subject}".%0D%0A%0D%0A`, '_blank')}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
                {contact.phone && (
                  <button
                    onClick={() => window.open(`tel:${contact.phone}`, '_self')}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-700 text-slate-900 hover:bg-slate-100 transition-colors text-sm cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.27 10.98a11.042 11.042 0 006.02 6.02l1.592-1.956a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </button>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-slate-700">Name</p>
                <p className="text-slate-900">{contact.name}</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Email</p>
                <p className="text-slate-900">{contact.email}</p>
              </div>
              {contact.phone && (
                <div>
                  <p className="font-medium text-slate-700">Phone</p>
                  <p className="text-slate-900">{contact.phone}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-slate-700">Date Submitted</p>
                <p className="text-slate-900">
                  {new Date(contact.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Subject</h3>
            <p className="text-slate-700 mb-4">{contact.subject}</p>
            
            <h3 className="font-semibold text-slate-900 mb-2">Message</h3>
            <div className="bg-slate-50 p-4">
              <p className="text-slate-700 whitespace-pre-wrap">{contact.message}</p>
            </div>
          </div>

          {/* Admin Actions */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Method
                </label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="">Not specified</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Admin Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 resize-none"
                placeholder="Add internal notes about this contact..."
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-700 text-slate-900 font-semibold hover:bg-slate-100 transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-6 font-semibold text-white transition-all duration-200 cursor-pointer ${
                  loading
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800'
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
