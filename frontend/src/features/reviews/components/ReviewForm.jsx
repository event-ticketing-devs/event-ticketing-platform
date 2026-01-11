import { useState } from "react";
import { toast } from "react-hot-toast";
import StarRating from "./StarRating";
import { createReview } from "../../../services/reviewService";

const ReviewForm = ({ venueId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (reviewText.length > 500) {
      toast.error("Review text cannot exceed 500 characters");
      return;
    }

    setSubmitting(true);

    try {
      await createReview(venueId, { rating, reviewText });
      toast.success("Review submitted successfully!");
      setRating(0);
      setReviewText("");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to submit review";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Rating <span className="text-error">*</span>
          </label>
          <StarRating
            rating={rating}
            interactive
            onChange={setRating}
            size="lg"
          />
          {rating > 0 && (
            <p className="text-sm text-text-secondary mt-1">{rating} out of 5 stars</p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Your Review (Optional)
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience at this venue..."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-text-secondary">
              Share details about your experience, the space, service, etc.
            </p>
            <p className="text-xs text-text-secondary">
              {reviewText.length}/500
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
