import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Star, MessageSquare, AlertCircle } from "lucide-react";
import StarRating from "../components/StarRating";
import OwnerResponseForm from "../components/OwnerResponseForm";
import { getOwnerReviews } from "../../../services/reviewService";

const OwnerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, responded
  const [respondingTo, setRespondingTo] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      
      if (filter === "pending") {
        params.hasResponse = "false";
      } else if (filter === "responded") {
        params.hasResponse = "true";
      }

      const data = await getOwnerReviews(params);
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, filter]);

  const handleResponseSuccess = () => {
    setRespondingTo(null);
    fetchReviews();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const pendingCount = reviews.filter((r) => !r.ownerResponse).length;

  if (loading && reviews.length === 0) {
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
            Venue Reviews
          </h1>
          <p className="text-text-secondary">
            Respond to customer reviews and build trust
          </p>
        </div>

        {/* Pending Alert */}
        {pendingCount > 0 && filter === "all" && (
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning mb-1">
                {pendingCount} {pendingCount === 1 ? "review needs" : "reviews need"} your response
              </p>
              <p className="text-sm text-text-primary">
                Responding to reviews increases your response rate and builds customer trust
              </p>
            </div>
            <button
              onClick={() => setFilter("pending")}
              className="px-4 py-2 bg-warning text-bg-primary rounded-lg hover:bg-warning/90 transition-colors text-sm font-medium whitespace-nowrap"
            >
              View Pending
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setFilter("all"); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-bg-primary"
                : "bg-bg-primary border border-border text-text-primary hover:bg-bg-secondary"
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => { setFilter("pending"); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "pending"
                ? "bg-primary text-bg-primary"
                : "bg-bg-primary border border-border text-text-primary hover:bg-bg-secondary"
            }`}
          >
            Pending Response
          </button>
          <button
            onClick={() => { setFilter("responded"); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "responded"
                ? "bg-primary text-bg-primary"
                : "bg-bg-primary border border-border text-text-primary hover:bg-bg-secondary"
            }`}
          >
            Responded
          </button>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-bg-primary border border-border rounded-lg p-12 text-center">
            <Star className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {filter === "pending" ? "No Pending Reviews" : "No Reviews Yet"}
            </h3>
            <p className="text-text-secondary">
              {filter === "pending" 
                ? "You've responded to all reviews. Great job!"
                : "Your venue hasn't received any reviews yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className={`bg-bg-primary border rounded-lg p-6 ${
                  !review.ownerResponse
                    ? "border-warning/30 bg-warning/5"
                    : "border-border"
                }`}
              >
                {/* Venue and Customer Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-text-primary">
                        {review.userId.name}
                      </h4>
                      {!review.ownerResponse && (
                        <span className="bg-warning/20 text-warning px-2 py-0.5 rounded-md text-xs font-medium">
                          Needs Response
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mb-2">
                      Review for <span className="font-medium">{review.venueId.name}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-sm text-text-secondary">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                {review.reviewText && (
                  <p className="text-text-primary mb-4 leading-relaxed bg-bg-secondary p-4 rounded-lg">
                    {review.reviewText}
                  </p>
                )}

                {/* Owner Response Section */}
                {review.ownerResponse ? (
                  <div className="mt-4">
                    {respondingTo === review._id ? (
                      <OwnerResponseForm
                        reviewId={review._id}
                        existingResponse={review.ownerResponse}
                        onSuccess={handleResponseSuccess}
                        onCancel={() => setRespondingTo(null)}
                      />
                    ) : (
                      <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-secondary" />
                            <h5 className="text-sm font-semibold text-secondary">
                              Your Response
                            </h5>
                          </div>
                          <button
                            onClick={() => setRespondingTo(review._id)}
                            className="text-sm text-secondary hover:text-secondary/80 font-medium"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-text-primary text-sm leading-relaxed mb-2">
                          {review.ownerResponse}
                        </p>
                        <p className="text-xs text-text-secondary">
                          Responded on {formatDate(review.ownerRespondedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    {respondingTo === review._id ? (
                      <OwnerResponseForm
                        reviewId={review._id}
                        onSuccess={handleResponseSuccess}
                        onCancel={() => setRespondingTo(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setRespondingTo(review._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-bg-primary rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Respond to Review
                      </button>
                    )}
                  </div>
                )}
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

export default OwnerReviews;
