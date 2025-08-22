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
import contactRateLimiter from '../middleware/contactRateLimiter.js';

const router = express.Router();

// Public routes with contact-specific rate limiting
router.post('/general', contactRateLimiter, createGeneralContact);
router.post('/event/:eventId', contactRateLimiter, createEventContact);

// Admin routes
router.get('/general', protect, adminOnly, getGeneralContacts);
router.patch('/:contactId/status', protect, updateContactStatus);

// Organizer routes
router.get('/organizer', protect, roleMiddleware(['organizer', 'admin']), getEventContacts);

export default router;
