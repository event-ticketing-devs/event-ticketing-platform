import { useState } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../api/apiClient';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const ContactUs = () => {
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
      const response = await apiClient.post('/contacts/general', formData);
      
      if (response.data.status === 'success') {
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Contact Us</h1>
            <p className="mt-1 text-text-secondary">
              Have a question, suggestion, or need help? We're here to assist you. 
              Send us a message and we'll get back to you within 24-48 hours.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-bg-primary border-2 border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-bg-secondary border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Email</h3>
                    <p className="text-text-secondary">hello@eventify.com</p>
                    <p className="text-sm text-text-secondary">We reply within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-bg-secondary border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Phone</h3>
                    <p className="text-text-secondary">+91 1234567890</p>
                    <p className="text-sm text-text-secondary">Mon-Fri, 9 AM - 6 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-bg-secondary border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Address</h3>
                    <p className="text-text-secondary">123 Event Street</p>
                    <p className="text-text-secondary">Mumbai, Maharashtra 400001</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-bg-primary border-2 border-border rounded-lg p-8">
              <h3 className="text-xl font-bold text-text-primary mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-text-primary">How do I cancel my booking?</p>
                  <p className="text-text-secondary">Visit your ticket page and click the cancel button. Refunds depend on the event's refund policy.</p>
                </div>
                <div>
                  <p className="font-medium text-text-primary">Can I transfer my ticket?</p>
                  <p className="text-text-secondary">Currently, tickets are non-transferable for security reasons.</p>
                </div>
                <div>
                  <p className="font-medium text-text-primary">What payment methods do you accept?</p>
                  <p className="text-text-secondary">We accept all major credit/debit cards via Stripe.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-bg-primary border-2 border-border rounded-lg overflow-hidden">
            <div className="bg-primary px-8 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-bg-primary">Send us a Message</h2>
              <p className="text-bg-primary/80 mt-2">Fill out the form below and we'll get back to you</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">Select a subject</option>
                  <option value="Booking Issue">Booking Issue</option>
                  <option value="Payment Problem">Payment Problem</option>
                  <option value="Event Inquiry">Event Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Refund Request">Refund Request</option>
                  <option value="Account Issue">Account Issue</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 border border-border rounded-lg font-semibold text-bg-primary transition-colors flex items-center justify-center space-x-2 ${
                  loading
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 hover:transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin"></div>
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
