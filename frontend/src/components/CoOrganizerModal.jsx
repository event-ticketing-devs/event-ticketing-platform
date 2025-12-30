import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import { Users, AlertTriangle } from 'lucide-react';

const CoOrganizerModal = ({ isOpen, onClose, eventId, eventTitle }) => {
  const [coOrganizers, setCoOrganizers] = useState([]);
  const [mainOrganizer, setMainOrganizer] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, userId: null, userName: '' });

  useEffect(() => {
    if (isOpen && eventId) {
      fetchCoOrganizers();
    }
  }, [isOpen, eventId]);

  const fetchCoOrganizers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/events/${eventId}/co-organizers`);
      setMainOrganizer(res.data.mainOrganizer);
      setCoOrganizers(res.data.coOrganizers);
    } catch (err) {
      console.error('Error fetching co-organizers:', err);
      toast.error(err.response?.data?.message || 'Failed to load co-organizers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoOrganizer = async (e) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/events/${eventId}/co-organizers`, {
        userEmail: newEmail.trim(),
      });
      
      toast.success(res.data.message);
      setCoOrganizers([...coOrganizers, res.data.coOrganizer]);
      setNewEmail('');
    } catch (err) {
      console.error('Error adding co-organizer:', err);
      toast.error(err.response?.data?.message || 'Failed to add co-organizer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCoOrganizer = async (userId, userName) => {
    setRemoveConfirm({ open: true, userId, userName });
  };

  const confirmRemove = async () => {
    try {
      await apiClient.delete(`/events/${eventId}/co-organizers/${removeConfirm.userId}`);
      toast.success('Co-organizer removed successfully');
      setCoOrganizers(coOrganizers.filter(co => co.id !== removeConfirm.userId));
      setRemoveConfirm({ open: false, userId: null, userName: '' });
    } catch (err) {
      console.error('Error removing co-organizer:', err);
      toast.error(err.response?.data?.message || 'Failed to remove co-organizer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-bg-primary border-0 sm:border border-border sm:rounded-lg max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Manage Co-Organizers</h2>
              <p className="text-text-secondary mt-1">{eventTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary text-2xl cursor-pointer"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block rounded-full animate-spin h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-text-secondary">Loading...</p>
            </div>
          ) : (
            <>
              {/* Main Organizer */}
              {mainOrganizer && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Main Organizer</h3>
                  <div className="bg-bg-secondary border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">{mainOrganizer.name}</p>
                        <p className="text-sm text-text-secondary">{mainOrganizer.email}</p>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-md border border-primary/20 font-medium">
                        Owner
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Co-Organizer Form */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Add Co-Organizer</h3>
                <form onSubmit={handleAddCoOrganizer} className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter user email"
                    className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary text-bg-primary rounded-lg hover:bg-primary/90 disabled:bg-primary/40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {submitting ? 'Adding...' : 'Add'}
                  </button>
                </form>
                <p className="text-sm text-text-secondary mt-2">
                  Note: Only existing users can be added as co-organizers
                </p>
              </div>

              {/* Co-Organizers List */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  Co-Organizers ({coOrganizers.length})
                </h3>
                {coOrganizers.length === 0 ? (
                  <div className="text-center py-8 bg-bg-secondary border border-border rounded-lg">
                    <Users className="mx-auto h-12 w-12 text-text-secondary" />
                    <p className="mt-2 text-text-primary">No co-organizers yet</p>
                    <p className="text-sm text-text-secondary">Add co-organizers to help manage this event</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coOrganizers.map((coOrg) => (
                      <div
                        key={coOrg.id}
                        className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-text-primary">{coOrg.name}</p>
                          <p className="text-sm text-text-secondary">{coOrg.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveCoOrganizer(coOrg.id, coOrg.name)}
                          className="px-4 py-2 bg-error text-bg-primary rounded-lg hover:bg-error/90 transition-colors text-sm cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-warning/10 border border-warning/30 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-text-primary">
                      Co-Organizer Permissions
                    </h4>
                    <div className="mt-2 text-sm text-text-secondary">
                      <p>Co-organizers can:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>View and manage event bookings</li>
                        <li>Verify tickets at the venue</li>
                        <li>View event statistics</li>
                        <li>Update event details</li>
                      </ul>
                      <p className="mt-2">
                        Only the main organizer can add or remove co-organizers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-bg-secondary/80 transition-colors cursor-pointer border border-border"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Remove Co-Organizer Confirmation Modal */}
      <ConfirmModal
        open={removeConfirm.open}
        title="Remove Co-Organizer"
        description={`Are you sure you want to remove ${removeConfirm.userName} as a co-organizer? They will no longer have access to manage this event.`}
        onClose={() => setRemoveConfirm({ open: false, userId: null, userName: '' })}
        onConfirm={confirmRemove}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default CoOrganizerModal;
