import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, X, HelpCircle } from "lucide-react";

const VenueVerificationNotice = ({ venue }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Only show for venues that are not verified
  if (!venue || venue.verificationStatus === "verified" || !isVisible) {
    return null;
  }

  const getStatusConfig = () => {
    switch (venue.verificationStatus) {
      case "unverified":
        return {
          message: "Your venue is pending verification.",
          description: "Your venue will be visible to customers once it's verified by our team. You can contact support if you have any questions.",
          bgColor: "bg-warning/10",
          borderColor: "border-warning",
          textColor: "text-warning",
        };
      case "suspended":
        return {
          message: "Your venue has been suspended.",
          description: venue.suspensionReason 
            ? `Reason: ${venue.suspensionReason}. Please contact support for more information.`
            : "Please contact support for more information.",
          bgColor: "bg-error/10",
          borderColor: "border-error",
          textColor: "text-error",
        };
      default:
        return {
          message: "Your venue status is under review.",
          description: "Please contact support if you have any questions.",
          bgColor: "bg-warning/10",
          borderColor: "border-warning",
          textColor: "text-warning",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className={`h-5 w-5 ${config.textColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-text-primary">
            <strong>{config.message}</strong> {config.description}
          </p>
          <div className="mt-2 flex gap-3">
            <Link
              to="/contact"
              className={`inline-flex items-center gap-1 text-sm font-medium ${config.textColor} hover:opacity-80 underline cursor-pointer`}
            >
              <HelpCircle className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setIsVisible(false)}
            className={`inline-flex ${config.textColor} hover:opacity-80 cursor-pointer`}
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueVerificationNotice;
