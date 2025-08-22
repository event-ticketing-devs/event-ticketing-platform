import Contact from '../models/Contact.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import transporter from '../utils/mailer.js';

// Create a general contact
const createGeneralContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'Name, email, subject, and message are required'
      });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      type: 'general'
    });

    // Send confirmation email to user
    try {
      await transporter.sendMail({
        from: '"Event Ticketing Support" <support@eventify.com>',
        to: email,
        subject: 'We received your message - Event Ticketing',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2d7ff9; text-align: center;">Thank you for contacting us!</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Hi ${name},</strong></p>
              <p>We've received your message and will get back to you within 24-48 hours.</p>
              <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Your Message:</strong></p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong> ${message}</p>
              </div>
              <p>Reference ID: <strong>${contact._id}</strong></p>
              <p>Best regards,<br>Event Ticketing Support Team</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Your message has been sent successfully. We will get back to you soon.',
      contactId: contact._id
    });
  } catch (error) {
    console.error('Error creating general contact:', error);
    res.status(500).json({
      message: 'Failed to send message. Please try again.'
    });
  }
};

// Create event-specific contact
const createEventContact = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'Name, email, subject, and message are required'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId).populate('organizerId');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Create the contact
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      type: 'event',
      eventId,
      organizerId: event.organizerId._id
    });

    console.log('Created event contact:', {
      contactId: contact._id,
      eventId,
      organizerId: event.organizerId._id,
      type: contact.type
    });

    // Send notification to organizer
    try {
      await transporter.sendMail({
        from: '"Event Ticketing" <noreply@eventify.com>',
        to: event.organizerId.email,
        subject: `New message about your event: ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2d7ff9;">New Message About Your Event</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>From:</strong> ${name} (${email})</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              <p><strong>Subject:</strong> ${subject}</p>
              <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Message:</strong></p>
                <p>${message}</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                You can respond to this inquiry through your organizer dashboard.
                Reference ID: ${contact._id}
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send organizer notification:', emailError);
    }

    // Send confirmation to user
    try {
      await transporter.sendMail({
        from: '"Event Ticketing" <noreply@eventify.com>',
        to: email,
        subject: `Message sent to ${event.title} organizer`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2d7ff9;">Message Sent Successfully!</h2>
            <p><strong>Hi ${name},</strong></p>
            <p>Your message has been sent to the organizer of <strong>${event.title}</strong>.</p>
            <p>The organizer will get back to you directly within 24-48 hours.</p>
            <p>Reference ID: <strong>${contact._id}</strong></p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send user confirmation:', emailError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Your message has been sent to the event organizer.',
      contactId: contact._id
    });
  } catch (error) {
    console.error('Error creating event contact:', error);
    res.status(500).json({
      message: 'Failed to send message. Please try again.'
    });
  }
};

// Get all general contacts (Admin only)
const getGeneralContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = { type: 'general' };
    if (status) filter.status = status;

    const contacts = await Contact.find(filter)
      .populate('handledBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(filter);

    res.json({
      contacts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching general contacts:', error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
};

// Get event contacts for organizer
const getEventContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    console.log('req.user object:', req.user);
    console.log('req.user._id:', req.user._id);
    console.log('req.user.role:', req.user.role);
    
    const organizerId = req.user._id; // Changed from req.user.userId to req.user._id

    console.log('Organizer contacts request:', { organizerId, status, page, limit });

    const filter = { 
      type: 'event',
      organizerId
    };
    if (status) filter.status = status;

    console.log('Contact filter:', filter);

    const contacts = await Contact.find(filter)
      .populate('eventId', 'title date')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(filter);

    console.log('Found contacts:', contacts.length, 'Total:', total);

    res.json({
      contacts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching event contacts:', error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
};

// Update contact status
const updateContactStatus = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status, adminNotes, contactMethod } = req.body;

    const updateData = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (contactMethod) updateData.contactMethod = contactMethod;
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }
    
    // For admin updates
    if (req.user.role === 'admin') {
      updateData.handledBy = req.user._id; // Changed from req.user.userId to req.user._id
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true }
    ).populate('eventId', 'title').populate('handledBy', 'name email');

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Check permissions for event contacts
    if (contact.type === 'event' && req.user.role !== 'admin') {
      if (contact.organizerId.toString() !== req.user._id.toString()) { // Changed from req.user.userId to req.user._id
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({
      status: 'success',
      contact
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ message: 'Failed to update contact' });
  }
};

export {
  createGeneralContact,
  createEventContact,
  getGeneralContacts,
  getEventContacts,
  updateContactStatus
};
