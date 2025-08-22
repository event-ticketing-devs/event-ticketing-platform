import mongoose from 'mongoose';
import Contact from './src/models/Contact.js';
import Event from './src/models/Event.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const testOrganizerContacts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check all users
    const allUsers = await User.find({});
    console.log('All users in database:');
    allUsers.forEach(user => {
      console.log('- User:', user.email, '| Role:', user.role);
    });

    // Find an organizer
    const organizer = await User.findOne({ role: 'organizer' });
    if (!organizer) {
      console.log('No organizer found in database');
      
      // Check if there are any users we can promote to organizer
      const anyUser = await User.findOne({});
      if (anyUser) {
        console.log('Promoting user to organizer:', anyUser.email);
        anyUser.role = 'organizer';
        await anyUser.save();
        console.log('User promoted to organizer');
      }
      return;
    }
    console.log('Found organizer:', organizer.email);

    // Find an event by this organizer
    const event = await Event.findOne({ organizerId: organizer._id });
    if (!event) {
      console.log('No events found for this organizer');
      return;
    }
    console.log('Found event:', event.title);

    // Check existing contacts for this organizer
    const existingContacts = await Contact.find({ 
      type: 'event', 
      organizerId: organizer._id 
    });
    console.log('Existing contacts for organizer:', existingContacts.length);

    // Create a test contact if none exist
    if (existingContacts.length === 0) {
      const testContact = await Contact.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+91 9876543210',
        subject: 'Test Inquiry',
        message: 'This is a test message to the organizer.',
        type: 'event',
        eventId: event._id,
        organizerId: organizer._id,
        status: 'pending'
      });
      console.log('Created test contact:', testContact._id);
    }

    // Query contacts as the API would
    const contacts = await Contact.find({ 
      type: 'event', 
      organizerId: organizer._id 
    }).populate('eventId', 'title date');
    
    console.log('Total contacts found:', contacts.length);
    contacts.forEach(contact => {
      console.log('- Contact:', contact.name, '|', contact.subject, '|', contact.eventId?.title);
    });

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testOrganizerContacts();
