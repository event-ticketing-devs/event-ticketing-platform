import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerUser } from "../services/authService";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...userData } = form; // exclude confirmPassword
      await registerUser(userData);
      toast.success("Registered successfully! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600"
          }`}
        >
          {loading ? "Registering..." : "Sign Up"}
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
};

export default Register;
