import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import GoogleLoginButton from "../components/GoogleLoginButton";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await loginUser(identifier, password);
      login(user);
      toast.success("Login successful");
      navigate("/profile");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 border rounded-xl shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Email or Phone"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-6 py-2 rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-4 text-center text-slate-600">
        Don’t have an account?{" "}
        <Link to="/register" className="text-blue-600 hover:underline">
          Register
        </Link>
      </div>
      <div className="my-6 flex items-center justify-center">
        <span className="text-slate-400 text-sm">or</span>
      </div>
      <div className="flex justify-center">
        <GoogleLoginButton />
      </div>
    </div>
  );
};

export default Login;
