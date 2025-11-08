import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import GoogleLoginButton from "../components/GoogleLoginButton";

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
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in to your account</h1>
          <p className="text-slate-600">Welcome back! Please enter your details</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-slate-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Email/Phone Input */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Email or Phone
                </label>
                <input
                  type="text"
                  placeholder="Enter your email or phone number"
                  className="block w-full px-3 py-2.5 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="block w-full px-3 py-2.5 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-2.5 px-4 font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="px-6 py-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-600">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Login */}
          <div className="px-6 pb-6">
            <GoogleLoginButton />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-center text-slate-600 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-slate-900 font-semibold hover:text-slate-700 transition-colors">
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
