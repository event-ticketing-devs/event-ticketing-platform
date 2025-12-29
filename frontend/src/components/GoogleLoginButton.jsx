import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient";

const GoogleLoginButton = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const { credential } = credentialResponse;
      if (!credential) throw new Error("No credential returned from Google");
      // Optionally decode for profile info (not required for backend)
      // const profile = jwt_decode(credential);
      // Send credential (JWT) to backend for verification/login
      const { data } = await apiClient.post("/auth/google", { credential });
      // data should include token and user profile
      login({ ...data.user, token: data.token });
      toast.success("Welcome back! Login successful");
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
      toast.error(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    setError("Google login failed");
    toast.error("Google login failed");
  };

  return (
    <div className="w-full space-y-4">
      <div className="google-login-container">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
          width="100%"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin"></div>
          <span className="text-text-primary text-sm font-medium">
            Signing in...
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-error/20 border border-error rounded-md flex items-center justify-center flex-shrink-0">
              <X className="w-3 h-3 text-error" />
            </div>
            <p className="text-error text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .google-login-container :global(div[role="button"]) {
          width: 100% !important;
          height: 48px !important;
          border: 1px solid #E8E4DF !important;
          border-radius: 8px !important;
          font-family: "Inter", "system-ui", sans-serif !important;
          font-weight: 600 !important;
          font-size: 16px !important;
          transition: border-color 0.2s ease, background-color 0.2s ease !important;
          box-shadow: none !important;
        }

        .google-login-container :global(div[role="button"]:hover) {
          border-color: #C75B39 !important;
          background-color: #F5F3F0 !important;
          box-shadow: none !important;
          transform: none !important;
          cursor: pointer !important;
        }

        .google-login-container :global(div[role="button"]:focus) {
          outline: none !important;
          border: 1px solid #C75B39 !important;
        }

        .google-login-container :global(.ns01__text) {
          font-size: 16px !important;
          font-weight: 600 !important;
          color: #2B2826 !important;
        }

        .google-login-container :global(.ns01__text)::after {
          content: "Google" !important;
        }

        .google-login-container :global(.ns01__text) {
          font-size: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default GoogleLoginButton;
