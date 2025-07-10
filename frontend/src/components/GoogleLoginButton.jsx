import React, { useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient";

// Place your Google Client ID in your .env file as VITE_GOOGLE_CLIENT_ID
// Example: VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

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
      toast.success("Login successful");
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
    <div className="flex flex-col items-center gap-2">
      <GoogleLogin onSuccess={handleSuccess} onError={handleError} useOneTap />
      {loading && <p className="text-blue-600">Logging in...</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
};

export default GoogleLoginButton;
