import Review from "../models/Review.js";
import Venue from "../models/Venue.js";
import VenueRequest from "../models/VenueRequest.js";
import { containsProfanity } from "../utils/profanityFilter.js";

// Helper function to update venue rating statistics
const updateVenueRating = async (venueId) => {
  const reviews = await Review.find({ venueId });
  
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;
  
  const reviewsWithResponses = reviews.filter(review => review.ownerResponse).length;
  const responseRate = totalReviews > 0 
    ? (reviewsWithResponses / totalReviews) * 100 
    : 0;
  
  await Venue.findByIdAndUpdate(venueId, {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews,
    responseRate: Math.round(responseRate),
  });
};

// Helper function to check review eligibility
const checkReviewEligibility = async (userId, venueId) => {
  // Check if user already reviewed this venue
  const existingReview = await Review.findOne({ userId, venueId });
  if (existingReview) {
    return { eligible: false, reason: "You have already reviewed this venue" };
  }
  
  // Check if venue exists
  const venue = await Venue.findById(venueId);
  if (!venue) {
    return { eligible: false, reason: "Venue not found" };
  }
  
  // Find all venue requests for this user at this venue
  const venueRequests = await VenueRequest.find({ 
    organizer: userId, 
    venue: venueId 
  });
  
  if (venueRequests.length === 0) {
    return { eligible: false, reason: "You must have an enquiry for this venue to leave a review" };
  }
  
  // Check if any request has a status that indicates engagement
  // (quoted, externally_booked, or closed - meaning the venue owner engaged with the request)
  const engagedRequests = venueRequests.filter(r => 
    ['quoted', 'externally_booked', 'closed'].includes(r.status)
  );
  
  if (engagedRequests.length === 0) {
    return { eligible: false, reason: "You can only review after the venue has responded to your enquiry" };
  }
  
  // Check if review is within 90 days of the most recent engaged request
  const now = new Date();
  const mostRecentRequest = engagedRequests.reduce((latest, r) => {
    const requestDate = new Date(r.updatedAt);
    return requestDate > latest ? requestDate : latest;
  }, new Date(0));
  
  const daysSinceRequest = (now - mostRecentRequest) / (1000 * 60 * 60 * 24);
  if (daysSinceRequest > 90) {
    return { eligible: false, reason: "Reviews must be submitted within 90 days of your enquiry" };
  }
  
  // Return the most recent engaged request
  const eligibleRequest = engagedRequests.reduce((latest, r) => {
    const requestDate = new Date(r.updatedAt);
    const latestDate = new Date(latest.updatedAt);
    return requestDate > latestDate ? r : latest;
  });
  
  return { eligible: true, venueRequest: eligibleRequest };
};

// Check review rate limit (5 reviews per day)
const checkRateLimit = async (userId) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentReviews = await Review.countDocuments({
    userId,
    createdAt: { $gte: oneDayAgo }
  });
  
  return recentReviews < 5;
};

// @desc    Create a new review
// @route   POST /api/reviews/venue/:venueId
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user._id;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    
    // Validate review text length
    if (reviewText && reviewText.length > 500) {
      return res.status(400).json({ message: "Review text cannot exceed 500 characters" });
    }
    
    // Check profanity
    if (reviewText && containsProfanity(reviewText)) {
      return res.status(400).json({ message: "Review contains inappropriate language. Please keep it professional." });
    }
    
    // Check rate limit
    const withinRateLimit = await checkRateLimit(userId);
    if (!withinRateLimit) {
      return res.status(429).json({ message: "You can only submit 5 reviews per day. Please try again later." });
    }
    
    // Check eligibility
    const eligibility = await checkReviewEligibility(userId, venueId);
    if (!eligibility.eligible) {
      return res.status(403).json({ message: eligibility.reason });
    }
    
    // Create review
    const review = await Review.create({
      userId,
      venueId,
      venueRequestId: eligibility.venueRequest._id,
      rating: parseInt(rating),
      reviewText: reviewText?.trim() || "",
    });
    
    // Update venue rating
    await updateVenueRating(venueId);
    
    // Populate user info for response
    await review.populate('userId', 'name');
    
    res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    
    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this venue" });
    }
    
    res.status(500).json({ message: "Failed to submit review", error: error.message });
  }
};

// @desc    Get all reviews for a venue
// @route   GET /api/reviews/venue/:venueId
// @access  Public
export const getVenueReviews = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { page = 1, limit = 10, sortBy = 'recent' } = req.query;
    
    // Determine sort order
    let sort = {};
    switch (sortBy) {
      case 'highest':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sort = { rating: 1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sort = { createdAt: -1 };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find({ venueId })
      .populate('userId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ venueId });
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
};

// @desc    Get review eligibility for a venue
// @route   GET /api/reviews/venue/:venueId/eligibility
// @access  Private
export const getReviewEligibility = async (req, res) => {
  try {
    const { venueId } = req.params;
    const userId = req.user._id;
    
    const eligibility = await checkReviewEligibility(userId, venueId);
    
    res.json({
      eligible: eligibility.eligible,
      reason: eligibility.reason || null,
    });
  } catch (error) {
    console.error("Error checking eligibility:", error);
    res.status(500).json({ message: "Failed to check eligibility", error: error.message });
  }
};

// @desc    Delete own review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if user owns this review
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own reviews" });
    }
    
    const venueId = review.venueId;
    
    await Review.findByIdAndDelete(id);
    
    // Update venue rating
    await updateVenueRating(venueId);
    
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review", error: error.message });
  }
};

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
export const reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Report reason is required" });
    }
    
    if (reason.length > 500) {
      return res.status(400).json({ message: "Report reason cannot exceed 500 characters" });
    }
    
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Don't allow users to report their own reviews
    if (review.userId.toString() === userId.toString()) {
      return res.status(400).json({ message: "You cannot report your own review" });
    }
    
    // Check if already reported
    if (review.isReported) {
      return res.status(400).json({ message: "This review has already been reported" });
    }
    
    review.isReported = true;
    review.reportReason = reason.trim();
    review.reportedBy = userId;
    review.reportedAt = new Date();
    
    await review.save();
    
    res.json({ message: "Review reported successfully. Our team will review it." });
  } catch (error) {
    console.error("Error reporting review:", error);
    res.status(500).json({ message: "Failed to report review", error: error.message });
  }
};

// @desc    Add owner response to review
// @route   POST /api/reviews/:id/response
// @access  Private (Venue Owner)
export const addOwnerResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const userId = req.user._id;
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({ message: "Response text is required" });
    }
    
    if (response.length > 300) {
      return res.status(400).json({ message: "Response cannot exceed 300 characters" });
    }
    
    // Check profanity
    if (containsProfanity(response)) {
      return res.status(400).json({ message: "Response contains inappropriate language. Please keep it professional." });
    }
    
    const review = await Review.findById(id).populate('venueId');
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if user is the venue owner
    if (review.venueId.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the venue owner can respond to reviews" });
    }
    
    // Check if response already exists
    if (review.ownerResponse) {
      return res.status(400).json({ message: "You have already responded to this review. Use PATCH to edit your response." });
    }
    
    review.ownerResponse = response.trim();
    review.ownerRespondedAt = new Date();
    
    await review.save();
    
    // Update venue response rate
    await updateVenueRating(review.venueId._id);
    
    await review.populate('userId', 'name');
    
    res.json({
      message: "Response added successfully",
      review,
    });
  } catch (error) {
    console.error("Error adding response:", error);
    res.status(500).json({ message: "Failed to add response", error: error.message });
  }
};

// @desc    Update owner response
// @route   PATCH /api/reviews/:id/response
// @access  Private (Venue Owner)
export const updateOwnerResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const userId = req.user._id;
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({ message: "Response text is required" });
    }
    
    if (response.length > 300) {
      return res.status(400).json({ message: "Response cannot exceed 300 characters" });
    }
    
    // Check profanity
    if (containsProfanity(response)) {
      return res.status(400).json({ message: "Response contains inappropriate language. Please keep it professional." });
    }
    
    const review = await Review.findById(id).populate('venueId');
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if user is the venue owner
    if (review.venueId.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the venue owner can update responses" });
    }
    
    if (!review.ownerResponse) {
      return res.status(400).json({ message: "No response exists to update. Use POST to add a new response." });
    }
    
    review.ownerResponse = response.trim();
    await review.save();
    
    await review.populate('userId', 'name');
    
    res.json({
      message: "Response updated successfully",
      review,
    });
  } catch (error) {
    console.error("Error updating response:", error);
    res.status(500).json({ message: "Failed to update response", error: error.message });
  }
};

// @desc    Delete owner response
// @route   DELETE /api/reviews/:id/response
// @access  Private (Venue Owner)
export const deleteOwnerResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(id).populate('venueId');
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if user is the venue owner
    if (review.venueId.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the venue owner can delete responses" });
    }
    
    if (!review.ownerResponse) {
      return res.status(400).json({ message: "No response exists to delete" });
    }
    
    review.ownerResponse = undefined;
    review.ownerRespondedAt = undefined;
    await review.save();
    
    // Update venue response rate
    await updateVenueRating(review.venueId._id);
    
    res.json({ message: "Response deleted successfully" });
  } catch (error) {
    console.error("Error deleting response:", error);
    res.status(500).json({ message: "Failed to delete response", error: error.message });
  }
};

// @desc    Get all reviews by current user
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getMyReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find({ userId })
      .populate('venueId', 'name city photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ userId });
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
};

// @desc    Get all reviews for venues owned by current user
// @route   GET /api/reviews/owner-reviews
// @access  Private (Venue Owner)
export const getOwnerReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, venueId, hasResponse } = req.query;
    
    // Find all venues owned by user
    const venues = await Venue.find({ owner: userId }).select('_id');
    const venueIds = venues.map(v => v._id);
    
    if (venueIds.length === 0) {
      return res.json({
        reviews: [],
        pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 },
      });
    }
    
    // Build query
    const query = { venueId: { $in: venueIds } };
    
    if (venueId) {
      query.venueId = venueId;
    }
    
    if (hasResponse !== undefined) {
      query.ownerResponse = hasResponse === 'true' ? { $exists: true, $ne: null } : { $exists: false };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find(query)
      .populate('userId', 'name')
      .populate('venueId', 'name city photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(query);
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching owner reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
};

// @desc    Get reported reviews (Admin only)
// @route   GET /api/admin/reviews/reported
// @access  Private (Admin)
export const getReportedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find({ isReported: true })
      .populate('userId', 'name email')
      .populate('venueId', 'name city')
      .populate('reportedBy', 'name email')
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ isReported: true });
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching reported reviews:", error);
    res.status(500).json({ message: "Failed to fetch reported reviews", error: error.message });
  }
};

// @desc    Delete review (Admin only)
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin)
export const adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    const venueId = review.venueId;
    
    await Review.findByIdAndDelete(id);
    
    // Update venue rating
    await updateVenueRating(venueId);
    
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review (admin):", error);
    res.status(500).json({ message: "Failed to delete review", error: error.message });
  }
};

// @desc    Dismiss report on review (Admin only)
// @route   PATCH /api/admin/reviews/:id/dismiss-report
// @access  Private (Admin)
export const dismissReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    review.isReported = false;
    review.reportReason = undefined;
    review.reportedBy = undefined;
    review.reportedAt = undefined;
    
    await review.save();
    
    res.json({ message: "Report dismissed successfully" });
  } catch (error) {
    console.error("Error dismissing report:", error);
    res.status(500).json({ message: "Failed to dismiss report", error: error.message });
  }
};
