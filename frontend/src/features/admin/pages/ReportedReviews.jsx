import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Flag, Trash2, X, CheckCircle } from "lucide-react";
import StarRating from "../../reviews/components/StarRating";
import {
  getReportedReviews,
  adminDeleteReview,
  dismissReport,
} from "../../../services/reviewService";

const ReportedReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getReportedReviews({ page, limit: 20 });
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching reported reviews:", error);
      toast.error("Failed to load reported reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    try {
      await adminDeleteReview(reviewId);
      toast.success("Review deleted successfully");
      setReviews(reviews.filter((r) => r._id !== reviewId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  const handleDismiss = async (reviewId) => {
    try {
      await dismissReport(reviewId);
      toast.success("Report dismissed successfully");
      setReviews(reviews.filter((r) => r._id !== reviewId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to dismiss report");
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
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Reported Reviews
          </h1>
          <p className="text-text-secondary">
            Review flagged content and take appropriate action
          </p>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-bg-primary border border-border rounded-lg p-12 text-center">
            <Flag className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No Reported Reviews
            </h3>
            <p className="text-text-secondary">
              There are no reviews flagged for moderation
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-bg-primary border border-error/30 rounded-lg p-6"
              >
                {/* Report Info */}
                <div className="bg-error/5 border border-error/20 rounded-lg p-4 mb-4 flex items-start gap-3">
                  <Flag className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-error mb-1">
                      Reported by {review.reportedBy.name} ({review.reportedBy.email})
                    </p>
                    <p className="text-sm text-text-primary mb-2">
                      <span className="font-medium">Reason:</span> {review.reportReason}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Reported on {formatDate(review.reportedAt)}
                    </p>
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-text-primary mb-1">
                        Review by {review.userId.name}
                      </h4>
                      <p className="text-sm text-text-secondary mb-2">
                        For <span className="font-medium">{review.venueId.name}</span> in {review.venueId.city}
                      </p>
                      <div className="flex items-center gap-3">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm text-text-secondary">
                          Posted on {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {review.reviewText && (
                    <div className="bg-bg-secondary p-4 rounded-lg">
                      <p className="text-text-primary leading-relaxed">
                        {review.reviewText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Owner Response (if exists) */}
                {review.ownerResponse && (
                  <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-semibold text-secondary mb-2">
                      Owner Response
                    </h5>
                    <p className="text-text-primary text-sm leading-relaxed">
                      {review.ownerResponse}
                    </p>
                  </div>
                )}

                {/* User Details */}
                <div className="bg-bg-secondary p-3 rounded-lg mb-4 text-sm">
                  <p className="text-text-secondary">
                    <span className="font-medium text-text-primary">Reviewer Email:</span>{" "}
                    {review.userId.email}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-error text-bg-primary rounded-lg hover:bg-error/90 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Review
                  </button>
                  <button
                    onClick={() => handleDismiss(review._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Dismiss Report
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

export default ReportedReviews;
