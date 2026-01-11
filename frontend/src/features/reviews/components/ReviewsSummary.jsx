import { Star, TrendingUp } from "lucide-react";
import StarRating from "./StarRating";

const ReviewsSummary = ({ venue }) => {
  if (!venue) return null;

  const { averageRating = 0, totalReviews = 0, responseRate = 0 } = venue;

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Customer Reviews
      </h3>

      {totalReviews === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-text-secondary mx-auto mb-3" />
          <p className="text-text-secondary">No reviews yet</p>
          <p className="text-sm text-text-secondary mt-1">
            Be the first to review this venue
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overall Rating */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-1">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={Math.round(averageRating)} size="md" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-secondary">
                Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>

          {/* Response Rate */}
          {responseRate > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {responseRate}% Response Rate
                </p>
                <p className="text-xs text-text-secondary">
                  Owner responds to most reviews
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewsSummary;
