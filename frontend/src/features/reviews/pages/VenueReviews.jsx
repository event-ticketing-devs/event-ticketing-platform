import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { ArrowUpDown, AlertCircle } from "lucide-react";
import ReviewsSummary from "../components/ReviewsSummary";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import {
  getVenueReviews,
  checkReviewEligibility,
} from "../../../services/reviewService";
import { useAuth } from "../../../context/AuthContext";

const VenueReviews = ({ venue, isOwner = false }) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState("");
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getVenueReviews(venue._id, {
        page,
        limit: 10,
        sortBy,
      });
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!currentUser || isOwner) return;

    setCheckingEligibility(true);
    try {
      const data = await checkReviewEligibility(venue._id);
      setEligible(data.eligible);
      setEligibilityReason(data.reason);
    } catch (error) {
      console.error("Error checking eligibility:", error);
      // Set a default message if the API call fails
      setEligible(false);
      setEligibilityReason(error.response?.data?.message || "Unable to check review eligibility");
    } finally {
      setCheckingEligibility(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [venue._id, page, sortBy]);

  useEffect(() => {
    if (currentUser && !isOwner) {
      checkEligibility();
    }
  }, [currentUser, venue._id, isOwner]);

  const handleReviewSuccess = () => {
    setEligible(false);
    fetchReviews();
  };

  const handleReviewDelete = (reviewId) => {
    setReviews(reviews.filter((r) => r._id !== reviewId));
    // If user deleted their own review, they might be eligible again
    if (currentUser && !isOwner) {
      checkEligibility();
    }
  };

  const handleResponseAdded = () => {
    fetchReviews();
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <ReviewsSummary venue={venue} />

      {/* Not logged in message */}
      {!currentUser && (
        <div className="bg-info/5 border border-info/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-info mb-1">
              Sign in to Leave a Review
            </p>
            <p className="text-sm text-text-primary">
              Please log in to share your experience with this venue
            </p>
          </div>
        </div>
      )}

      {/* Review Form (if eligible) */}
      {currentUser && !isOwner && eligible && (
        <ReviewForm venueId={venue._id} onSuccess={handleReviewSuccess} />
      )}

      {/* Eligibility Message */}
      {currentUser && !isOwner && !eligible && eligibilityReason && !checkingEligibility && (
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning mb-1">
              Unable to Submit Review
            </p>
            <p className="text-sm text-text-primary">{eligibilityReason}</p>
          </div>
        </div>
      )}

      {/* Reviews List - Only show if there are reviews */}
      {pagination && pagination.total > 0 && (
        <div className="bg-bg-primary border border-border rounded-lg p-6">
          {/* Header with Sort */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text-primary">
              All Reviews ({pagination.total})
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>
          </div>

          {/* Reviews */}
          <ReviewList
            reviews={reviews}
            loading={loading}
            onDelete={handleReviewDelete}
            onResponseAdded={handleResponseAdded}
            isOwner={isOwner}
          />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-text-secondary">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VenueReviews;
