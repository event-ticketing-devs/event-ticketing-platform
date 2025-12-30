import { useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, X } from "lucide-react";

const VerificationNotice = () => {
  const { currentUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  // Only show for authenticated users who are not verified
  if (!currentUser || currentUser.isVerified || !isVisible) {
    return null;
  }

  const handleResendEmail = async () => {
    try {
      setSending(true);
      setMessage("");
      
      const response = await apiClient.post("/auth/resend-verification", {
        email: currentUser.email,
      });
      
      setMessage(response.data.message || "Verification email sent!");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to send verification email. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-warning/10 border-l-4 border-warning p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-text-primary">
            <strong>Email verification required.</strong> Please verify your email address to create events and venues.
            Check your inbox for a verification email.
          </p>
          {message && (
            <p className={`text-sm mt-2 ${
              message.includes("Failed") || message.includes("error") 
                ? "text-error" 
                : "text-success"
            }`}>
              {message}
            </p>
          )}
          <div className="mt-2">
            <button
              onClick={handleResendEmail}
              disabled={sending}
              className="text-sm font-medium text-warning hover:text-warning/80 underline disabled:opacity-50 cursor-pointer"
            >
              {sending ? "Sending..." : "Resend verification email"}
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setIsVisible(false)}
            className="inline-flex text-warning hover:text-warning/80 cursor-pointer"
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationNotice;
