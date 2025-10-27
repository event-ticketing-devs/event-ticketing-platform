import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { toast } from 'react-hot-toast';

const VerifierModal = ({ isOpen, onClose, eventId, eventTitle }) => {
  const [verifiers, setVerifiers] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    if (!window.confirm(`Are you sure you want to remove ${userName} as a verifier?`)) {
      return;
    }

    try {
      await apiClient.delete(`/events/${eventId}/verifiers/${userId}`);
      toast.success('Verifier removed successfully');
      setVerifiers(verifiers.filter(v => v.id !== userId));
    } catch (err) {
      console.error('Error removing verifier:', err);
      toast.error(err.response?.data?.message || 'Failed to remove verifier');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Verifiers</h2>
              <p className="text-gray-600 mt-1">{eventTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Add Verifier Form */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Verifier</h3>
                <form onSubmit={handleAddVerifier} className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter user email"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Adding...' : 'Add'}
                  </button>
                </form>
                <p className="text-sm text-gray-500 mt-2">
                  Note: Only existing users can be added as verifiers
                </p>
              </div>

              {/* Verifiers List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Verifiers ({verifiers.length})
                </h3>
                {verifiers.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="mt-2 text-gray-600">No verifiers yet</p>
                    <p className="text-sm text-gray-500">Add verifiers to help check tickets at the venue</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verifiers.map((verifier) => (
                      <div
                        key={verifier.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{verifier.name}</p>
                          <p className="text-sm text-gray-600">{verifier.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveVerifier(verifier.id, verifier.name)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-blue-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      Verifier Permissions
                    </h4>
                    <div className="mt-2 text-sm text-blue-700">
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
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifierModal;
