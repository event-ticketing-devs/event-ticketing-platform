import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
    }
    setLoading(false);

    // Listen for banned user events
    const handleUserBanned = (event) => {
      const { message, banReason, bannedAt } = event.detail;
      logout();
      // You could show a toast or modal here to inform the user
      console.log('User has been banned:', { message, banReason, bannedAt });
    };

    window.addEventListener('userBanned', handleUserBanned);

    return () => {
      window.removeEventListener('userBanned', handleUserBanned);
    };
  }, []);

  const login = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    setCurrentUser(user);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get("/users/profile");
      const freshUser = response.data.user;
      if (freshUser) {
        localStorage.setItem("user", JSON.stringify(freshUser));
        setCurrentUser(freshUser);
        return freshUser;
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // If profile fetch fails and we get 401, user might be logged out
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
