import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { Star, MapPin, MessageSquare } from "lucide-react";
import StarRating from "../components/StarRating";
import { getMyReviews, deleteReview } from "../../../services/reviewService";

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getMyReviews({ page, limit: 10 });
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load your reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await deleteReview(reviewId);
      toast.success("Review deleted successfully");
      setReviews(reviews.filter((r) => r._id !== reviewId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">My Reviews</h1>
          <p className="text-text-secondary">
            View and manage your venue reviews
          </p>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-bg-primary border border-border rounded-lg p-12 text-center">
            <Star className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No Reviews Yet
            </h3>
            <p className="text-text-secondary mb-6">
              You haven't reviewed any venues yet
            </p>
            <Link
              to="/venues"
              className="inline-block bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Explore Venues
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-bg-primary border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
              >
                {/* Venue Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    {review.venueId.photo && (
                      <img
                        src={review.venueId.photo}
                        alt={review.venueId.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <Link
                        to={`/venues/${review.venueId._id}`}
                        className="text-lg font-semibold text-text-primary hover:text-primary transition-colors"
                      >
                        {review.venueId.name}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                        <MapPin className="w-4 h-4" />
                        {review.venueId.city}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating and Date */}
                <div className="flex items-center gap-4 mb-3">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-sm text-text-secondary">
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                {/* Review Text */}
                {review.reviewText && (
                  <p className="text-text-primary mb-4 leading-relaxed">
                    {review.reviewText}
                  </p>
                )}

                {/* Owner Response */}
                {review.ownerResponse && (
                  <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-secondary" />
                      <h5 className="text-sm font-semibold text-secondary">
                        Response from {review.venueId.name}
                      </h5>
                    </div>
                    <p className="text-text-primary text-sm leading-relaxed mb-2">
                      {review.ownerResponse}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDate(review.ownerRespondedAt)}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Link
                    to={`/venues/${review.venueId._id}`}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                  >
                    View Venue
                  </Link>
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="px-4 py-2 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors text-sm font-medium"
                  >
                    Delete Review
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-text-secondary">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviews;
