import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const user = await loginUser(identifier, password);
      login(user);
      toast.success("Welcome back! Login successful");
      
      // Redirect to the original page or default to profile
      const from = location.state?.from?.pathname || "/profile";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Sign in to your account</h1>
          <p className="text-text-secondary">Welcome back! Please enter your details</p>
        </div>

        {/* Login Form */}
        <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Email/Phone Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email or Phone
                </label>
                <input
                  type="text"
                  placeholder="Enter your email or phone number"
                  className="block w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary transition-colors"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="block w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-text-secondary hover:text-text-primary" />
                    ) : (
                      <Eye className="w-5 h-5 text-text-secondary hover:text-text-primary" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-error/10 border border-error rounded-lg p-3">
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white rounded-lg py-2.5 px-4 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="px-6 py-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-bg-primary text-text-secondary">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Login */}
          <div className="px-6 pb-6">
            <GoogleLoginButton />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-bg-secondary border-t border-border">
            <p className="text-center text-text-secondary text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-semibold hover:text-primary/90 transition-colors cursor-pointer">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
