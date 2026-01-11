import apiClient from "../api/apiClient";

// Create a review for a venue
export const createReview = async (venueId, reviewData) => {
  const response = await apiClient.post(`/reviews/venue/${venueId}`, reviewData);
  return response.data;
};

// Get all reviews for a venue
export const getVenueReviews = async (venueId, params = {}) => {
  const response = await apiClient.get(`/reviews/venue/${venueId}`, { params });
  return response.data;
};

// Check if user is eligible to review a venue
export const checkReviewEligibility = async (venueId) => {
  const response = await apiClient.get(`/reviews/venue/${venueId}/eligibility`);
  return response.data;
};

// Delete own review
export const deleteReview = async (reviewId) => {
  const response = await apiClient.delete(`/reviews/${reviewId}`);
  return response.data;
};

// Report a review
export const reportReview = async (reviewId, reason) => {
  const response = await apiClient.post(`/reviews/${reviewId}/report`, { reason });
  return response.data;
};

// Add owner response to review
export const addOwnerResponse = async (reviewId, response) => {
  const res = await apiClient.post(`/reviews/${reviewId}/response`, { response });
  return res.data;
};

// Update owner response
export const updateOwnerResponse = async (reviewId, response) => {
  const res = await apiClient.patch(`/reviews/${reviewId}/response`, { response });
  return res.data;
};

// Delete owner response
export const deleteOwnerResponse = async (reviewId) => {
  const response = await apiClient.delete(`/reviews/${reviewId}/response`);
  return response.data;
};

// Get user's own reviews
export const getMyReviews = async (params = {}) => {
  const response = await apiClient.get('/reviews/my-reviews', { params });
  return response.data;
};

// Get reviews for owner's venues
export const getOwnerReviews = async (params = {}) => {
  const response = await apiClient.get('/reviews/owner-reviews', { params });
  return response.data;
};

// Admin: Get reported reviews
export const getReportedReviews = async (params = {}) => {
  const response = await apiClient.get('/reviews/admin/reported', { params });
  return response.data;
};

// Admin: Delete review
export const adminDeleteReview = async (reviewId) => {
  const response = await apiClient.delete(`/reviews/admin/${reviewId}`);
  return response.data;
};

// Admin: Dismiss report
export const dismissReport = async (reviewId) => {
  const response = await apiClient.patch(`/reviews/admin/${reviewId}/dismiss-report`);
  return response.data;
};
