import { createContext, useContext, useState } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed?.token) {
        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${parsed.token}`;
      }
      return parsed;
    } catch (err) {
      return null;
    }
  });

  const login = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem("user");
    delete apiClient.defaults.headers.common["Authorization"];
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
