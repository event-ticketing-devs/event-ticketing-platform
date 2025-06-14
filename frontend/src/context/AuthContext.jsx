// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { getProfile } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // prevent flicker

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      getProfile()
        .then((user) => {
          setCurrentUser({ ...user, token });
        })
        .catch((err) => {
          console.error("Invalid token or failed to fetch profile:", err);
          localStorage.removeItem("token");
          delete apiClient.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (user) => {
    const { token, ...userInfo } = user;
    localStorage.setItem("token", token);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setCurrentUser({ ...userInfo, token });
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete apiClient.defaults.headers.common["Authorization"];
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
