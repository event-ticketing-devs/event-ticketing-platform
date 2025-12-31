import { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../../common/components/ConfirmModal';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const VerifierModal = ({ isOpen, onClose, eventId, eventTitle }) => {
  const [verifiers, setVerifiers] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, userId: null, userName: '' });

  useEffect(() => {
    if (isOpen && eventId) {
      fetchVerifiers();
    }
  }, [isOpen, eventId]);

  const fetchVerifiers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/events/${eventId}/verifiers`);
      setVerifiers(res.data.verifiers);
    } catch (err) {
      console.error('Error fetching verifiers:', err);
      toast.error(err.response?.data?.message || 'Failed to load verifiers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVerifier = async (e) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/events/${eventId}/verifiers`, {
        userEmail: newEmail.trim(),
      });
      
      toast.success(res.data.message);
      setVerifiers([...verifiers, res.data.verifier]);
      setNewEmail('');
    } catch (err) {
      console.error('Error adding verifier:', err);
      toast.error(err.response?.data?.message || 'Failed to add verifier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveVerifier = async (userId, userName) => {
    setRemoveConfirm({ open: true, userId, userName });
  };

  const confirmRemove = async () => {
    try {
      await apiClient.delete(`/events/${eventId}/verifiers/${removeConfirm.userId}`);
      toast.success('Verifier removed successfully');
      setVerifiers(verifiers.filter(v => v.id !== removeConfirm.userId));
      setRemoveConfirm({ open: false, userId: null, userName: '' });
    } catch (err) {
      console.error('Error removing verifier:', err);
      toast.error(err.response?.data?.message || 'Failed to remove verifier');
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
              <h2 className="text-2xl font-bold text-text-primary">Manage Verifiers</h2>
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
              {/* Add Verifier Form */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Add Verifier</h3>
                <form onSubmit={handleAddVerifier} className="flex gap-2">
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
                  Note: Only existing users can be added as verifiers
                </p>
              </div>

              {/* Verifiers List */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  Verifiers ({verifiers.length})
                </h3>
                {verifiers.length === 0 ? (
                  <div className="text-center py-8 bg-bg-secondary border border-border rounded-lg">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-text-secondary" />
                    <p className="mt-2 text-text-primary">No verifiers yet</p>
                    <p className="text-sm text-text-secondary">Add verifiers to help check tickets at the venue</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verifiers.map((verifier) => (
                      <div
                        key={verifier.id}
                        className="bg-bg-secondary border border-border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-text-primary">{verifier.name}</p>
                          <p className="text-sm text-text-secondary">{verifier.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveVerifier(verifier.id, verifier.name)}
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
              <div className="mt-6 bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 text-secondary mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-text-primary">
                      Verifier Permissions
                    </h4>
                    <div className="mt-2 text-sm text-text-secondary">
                      <p>Verifiers have limited access and can:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Verify tickets at the venue using QR codes</li>
                        <li>View event statistics and attendance data</li>
                      </ul>
                      <p className="mt-2">
                        Verifiers <strong>cannot</strong> modify event details, manage bookings, or access financial information.
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
              className="px-6 py-2 bg-slate-200 text-slate-800 border border-slate-200 hover:bg-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Remove Verifier Confirmation Modal */}
      <ConfirmModal
        open={removeConfirm.open}
        title="Remove Verifier"
        description={`Are you sure you want to remove ${removeConfirm.userName} as a verifier? They will no longer be able to scan tickets for this event.`}
        onClose={() => setRemoveConfirm({ open: false, userId: null, userName: '' })}
        onConfirm={confirmRemove}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default VerifierModal;
