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
    <div className="max-w-md mx-auto mt-16 p-8 border rounded-xl shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        {loading ? (
          <button
            type="button"
            className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-6 py-2 rounded-lg shadow font-semibold opacity-60 cursor-not-allowed"
          >
            Registering...
          </button>
        ) : (
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-6 py-2 rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all font-semibold cursor-pointer"
          >
            Register
          </button>
        )}
      </form>
      <div className="mt-4 text-center text-slate-600">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login
        </a>
      </div>
    </div>
  );
};

export default Register;
