import { Star } from "lucide-react";

const StarRating = ({ rating, maxRating = 5, size = "md", interactive = false, onChange }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(starValue)}
            className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
            disabled={!interactive}
          >
            <Star
              className={`${sizes[size]} ${
                isFilled
                  ? "fill-warning text-warning"
                  : "fill-transparent text-text-secondary"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
