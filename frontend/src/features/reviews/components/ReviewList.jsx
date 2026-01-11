import { useState } from "react";
import { toast } from "react-hot-toast";
import { Flag, Trash2, MessageSquare, Edit2, CheckCircle2 } from "lucide-react";
import StarRating from "./StarRating";
import OwnerResponseForm from "./OwnerResponseForm";
import { deleteReview, reportReview } from "../../../services/reviewService";
import { useAuth } from "../../../context/AuthContext";

const ReviewItem = ({ review, onDelete, onReport, onResponseAdded, isOwner }) => {
  const { user } = useAuth();
  const [showReportForm, setShowReportForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnReview = user && review.userId._id === user._id;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteReview(review._id);
      toast.success("Review deleted successfully");
      if (onDelete) {
        onDelete(review._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();

    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    setReporting(true);
    try {
      await reportReview(review._id, reportReason);
      toast.success("Review reported successfully. Our team will review it.");
      setShowReportForm(false);
      setReportReason("");
      if (onReport) {
        onReport(review._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to report review");
    } finally {
      setReporting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border-b border-border pb-6 mb-6 last:border-b-0">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-medium text-text-primary">
              {review.userId.name.split(" ")[0]}
            </h4>
            <span className="inline-flex items-center gap-1 bg-success/10 text-success px-2 py-0.5 rounded-md text-xs font-medium border border-success/20">
              <CheckCircle2 className="w-3 h-3" />
              Verified Booking
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-sm text-text-secondary">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isOwnReview && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
              title="Delete review"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!isOwnReview && user && (
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="p-2 text-text-secondary hover:bg-bg-secondary rounded-lg transition-colors"
              title="Report review"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Review Text */}
      {review.reviewText && (
        <p className="text-text-primary mb-4 leading-relaxed">
          {review.reviewText}
        </p>
      )}

      {/* Report Form */}
      {showReportForm && (
        <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-4">
          <h5 className="text-sm font-medium text-text-primary mb-2">
            Report this review
          </h5>
          <form onSubmit={handleReport}>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Why are you reporting this review?"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none mb-2"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={reporting}
                className="px-4 py-2 bg-error text-bg-primary rounded-lg hover:bg-error/90 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {reporting ? "Reporting..." : "Submit Report"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReportForm(false);
                  setReportReason("");
                }}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-bg-secondary transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Owner Response */}
      {review.ownerResponse && (
        <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 ml-8">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-secondary" />
            <h5 className="text-sm font-semibold text-secondary">
              Response from Venue
            </h5>
            {isOwner && (
              <button
                onClick={() => setShowResponseForm(!showResponseForm)}
                className="ml-auto p-1 text-secondary hover:bg-secondary/10 rounded transition-colors"
                title="Edit response"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-text-primary text-sm leading-relaxed mb-2">
            {review.ownerResponse}
          </p>
          <p className="text-xs text-text-secondary">
            Responded on {formatDate(review.ownerRespondedAt)}
          </p>
        </div>
      )}

      {/* Owner Response Form */}
      {isOwner && !review.ownerResponse && !showResponseForm && (
        <button
          onClick={() => setShowResponseForm(true)}
          className="ml-8 mt-3 inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors text-sm font-medium"
        >
          <MessageSquare className="w-4 h-4" />
          Respond to Review
        </button>
      )}

      {showResponseForm && isOwner && (
        <div className="ml-8 mt-3">
          <OwnerResponseForm
            reviewId={review._id}
            existingResponse={review.ownerResponse}
            onSuccess={() => {
              setShowResponseForm(false);
              if (onResponseAdded) {
                onResponseAdded();
              }
            }}
            onCancel={() => setShowResponseForm(false)}
          />
        </div>
      )}
    </div>
  );
};

const ReviewList = ({ reviews, loading, onDelete, onReport, onResponseAdded, isOwner }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-bg-secondary rounded-lg">
        <MessageSquare className="w-12 h-12 text-text-secondary mx-auto mb-3" />
        <p className="text-text-secondary">No reviews yet</p>
        <p className="text-sm text-text-secondary mt-1">
          Be the first to review this venue
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {reviews.map((review) => (
        <ReviewItem
          key={review._id}
          review={review}
          onDelete={onDelete}
          onReport={onReport}
          onResponseAdded={onResponseAdded}
          isOwner={isOwner}
        />
      ))}
    </div>
  );
};

export default ReviewList;
