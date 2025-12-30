import express from "express";
import {
  createVenue,
  updateVenue,
  getVenues,
  getVenueById,
  getMyVenues,
  getVenueRequestById,
  getMyEnquiries,
  getVenueEnquiries,
  createSpace,
  updateSpace,
  deleteSpace,
  getMySpaces,
  getSpaceById,
  getSpaceBlocks,
  getPublicSpaces,
  createVenueRequest,
  createVenueQuote,
  declineVenueRequest,
  markVenueRequestAsBooked,
  blockSpaceAvailability,
  unblockSpaceAvailability,
  verifyVenue,
  suspendVenue,
  unsuspendVenue,
  getVenueActivity,
  getAllVenuesAdmin,
  getChatMessages,
  sendChatMessage,
} from "../controllers/venueController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import { requireVerification } from "../middleware/verificationMiddleware.js";
import { venueUpload, spaceUpload } from "../utils/cloudinary.js";

const router = express.Router();

// Venue routes
router.post("/venues", protect, requireVerification, venueUpload.single("photo"), createVenue);
router.get("/venues/my-venues", protect, getMyVenues);
router.get("/venues", getVenues);
router.get("/venues/:id", getVenueById);
router.patch("/venues/:id", protect, requireVerification, venueUpload.single("photo"), updateVenue);

// Venue request routes
router.get("/venue-requests/my-enquiries", protect, getMyEnquiries);
router.get("/venue-requests/venue-enquiries", protect, getVenueEnquiries);
router.get("/venue-requests/:id", protect, getVenueRequestById);
router.post("/venue-requests", protect, createVenueRequest);
router.post("/venue-requests/:id/decline", protect, declineVenueRequest);
router.post("/venue-requests/:id/mark-booked", protect, markVenueRequestAsBooked);

// Chat routes
router.get("/venue-requests/:requestId/messages", protect, getChatMessages);
router.post("/venue-requests/:requestId/messages", protect, sendChatMessage);

// Venue quote routes
router.post("/venue-quotes", protect, createVenueQuote);

// Space routes
router.post("/spaces", protect, requireVerification, spaceUpload.array("photos", 5), createSpace);
router.get("/spaces/search", getPublicSpaces);
router.get("/spaces/my-spaces", protect, getMySpaces);
router.get("/spaces/:id", protect, getSpaceById);
router.get("/spaces/:id/blocks", protect, getSpaceBlocks);
router.patch("/spaces/:id", protect, requireVerification, spaceUpload.array("photos", 5), updateSpace);
router.delete("/spaces/:id", protect, deleteSpace);
router.post("/spaces/:id/block", protect, blockSpaceAvailability);
router.delete("/spaces/:id/unblock/:blockId", protect, unblockSpaceAvailability);

// Admin routes
router.get("/admin/venues", protect, adminOnly, getAllVenuesAdmin);
router.get("/admin/venues/:id/activity", protect, adminOnly, getVenueActivity);
router.patch("/admin/venues/:id/verify", protect, adminOnly, verifyVenue);
router.patch("/admin/venues/:id/suspend", protect, adminOnly, suspendVenue);
router.patch("/admin/venues/:id/unsuspend", protect, adminOnly, unsuspendVenue);

export default router;
