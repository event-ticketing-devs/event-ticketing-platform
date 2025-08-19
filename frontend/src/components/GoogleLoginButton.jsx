import React, { useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
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
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-600 text-sm font-medium">
            Signing in...
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3 h-3 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .google-login-container :global(div[role="button"]) {
          width: 100% !important;
          height: 48px !important;
          border-radius: 12px !important;
          border: 1px solid rgb(203 213 225) !important;
          font-family: "Inter", "system-ui", sans-serif !important;
          font-weight: 600 !important;
          font-size: 16px !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
        }

        .google-login-container :global(div[role="button"]:hover) {
          border-color: rgb(148 163 184) !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          transform: translateY(-1px) !important;
        }

        .google-login-container :global(div[role="button"]:focus) {
          outline: none !important;
          ring: 2px solid rgb(59 130 246) !important;
          border-color: rgb(59 130 246) !important;
        }

        .google-login-container :global(.ns01__text) {
          font-size: 16px !important;
          font-weight: 600 !important;
          color: rgb(51 65 85) !important;
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
