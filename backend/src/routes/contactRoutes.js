import express from 'express';
import {
  createGeneralContact,
  createEventContact,
  getGeneralContacts,
  getEventContacts,
  updateContactStatus
} from '../controllers/contactController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly, roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.post('/general', createGeneralContact);
router.post('/event/:eventId', createEventContact);

// Admin routes
router.get('/general', protect, adminOnly, getGeneralContacts);
router.patch('/:contactId/status', protect, updateContactStatus);

// Organizer routes
router.get('/organizer', protect, roleMiddleware(['organizer', 'admin']), getEventContacts);

export default router;
