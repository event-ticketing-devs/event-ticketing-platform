import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../api/apiClient";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const response = await apiClient.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully!");
        
        // Refresh currentUser if logged in to get updated isVerified status
        if (currentUser && refreshUser) {
          await refreshUser();
          // Redirect to profile after 2 seconds
          setTimeout(() => {
            navigate("/profile");
          }, 2000);
        } else {
          // Redirect to login after 3 seconds if not logged in
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message || 
          "Failed to verify email. The link may be invalid or expired."
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Email Verification
          </h2>
        </div>

        <div className="bg-bg-primary border border-border shadow-md rounded-lg p-8">
          {status === "verifying" && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-text-secondary">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success/10 mb-4">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Success!
              </h3>
              <p className="text-text-secondary mb-4">{message}</p>
              <p className="text-sm text-text-secondary">
                Redirecting to login page...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error/10 mb-4">
                <XCircle className="h-6 w-6 text-error" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Verification Failed
              </h3>
              <p className="text-text-secondary mb-4">{message}</p>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
