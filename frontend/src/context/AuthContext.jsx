import { createContext, useContext, useState, useEffect } from "react";

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
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
