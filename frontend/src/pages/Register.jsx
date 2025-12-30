import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { registerUser } from "../services/authService";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { confirmPassword, ...userData } = form;
      await registerUser(userData);
      toast.success("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
      if (err.response?.data?.field) {
        setErrors({ [err.response.data.field]: err.response.data.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Create your account</h1>
          <p className="text-text-secondary">Join us to start booking amazing events</p>
        </div>

        {/* Register Form */}
        <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  className={`block w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-bg-secondary focus:ring-primary/20 transition-colors ${
                    errors.name ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                  }`}
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  className={`block w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-bg-secondary focus:ring-primary/20 transition-colors ${
                    errors.email ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                  }`}
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  className={`block w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-bg-secondary focus:ring-primary/20 transition-colors ${
                    errors.phone ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                  }`}
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-error">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a password"
                    className={`block w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-bg-secondary focus:ring-primary/20 transition-colors ${
                      errors.password ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                    }`}
                    value={form.password}
                    onChange={handleChange}
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
                {errors.password && (
                  <p className="mt-1 text-sm text-error">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    className={`block w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 bg-bg-secondary focus:ring-primary/20 transition-colors ${
                      errors.confirmPassword ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                    }`}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5 text-text-secondary hover:text-text-primary" />
                    ) : (
                      <Eye className="w-5 h-5 text-text-secondary hover:text-text-primary" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="px-8 py-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-bg-primary text-text-secondary font-medium">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Login */}
          <div className="px-8 pb-8">
            <GoogleLoginButton />
          </div>

          {/* Footer */}
          <div className="px-6 py-6 bg-bg-secondary border-t border-border">
            <p className="text-center text-text-secondary text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary/90 font-semibold transition-colors cursor-pointer">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
