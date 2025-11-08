import { useState } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../api/apiClient';

const ContactOrganizer = ({ event, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post(`/contacts/event/${event._id}`, formData);
      
      if (response.data.status === 'success') {
        toast.success('Message sent to the organizer successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Contact Organizer</h2>
            <p className="text-slate-300 text-sm">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Event Info */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-slate-100 border border-slate-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{event.title}</h3>
              <p className="text-sm text-slate-600">
                {new Date(event.date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-slate-600">
                {typeof event.venue === 'string' ? event.venue : event.venue?.name || 'Venue TBA'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-slate-900 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-slate-900">Direct Contact with Organizer</p>
                <p className="text-xs text-slate-600 mt-1">
                  Your message will be sent directly to the event organizer. They will respond to you via email or phone.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              placeholder="+91 9876543210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject *
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            >
              <option value="">Select a subject</option>
              <option value="Event Details Inquiry">Event Details Inquiry</option>
              <option value="Accessibility Requirements">Accessibility Requirements</option>
              <option value="Group Booking">Group Booking</option>
              <option value="Venue Information">Venue Information</option>
              <option value="Parking Information">Parking Information</option>
              <option value="Special Requirements">Special Requirements</option>
              <option value="Media/Press Inquiry">Media/Press Inquiry</option>
              <option value="Sponsorship Opportunity">Sponsorship Opportunity</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-3 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors resize-none"
              placeholder="Please describe your inquiry or question..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 font-semibold text-white transition-colors flex items-center justify-center space-x-2 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 rounded-full border-t-white animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactOrganizer;
