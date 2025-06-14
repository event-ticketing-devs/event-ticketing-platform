// src/services/authService.js
import apiClient from "../api/apiClient";

export const loginUser = async (identifier, password) => {
  try {
    const response = await apiClient.post("/auth/login", {
      identifier,
      password,
    });
    const token = response.data.token;

    // Decode token to get user data (or call profile route)
    const userProfile = await getProfile(token);

    return {
      ...userProfile,
      token,
    };
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Login failed. Please try again."
    );
  }
};

export const getProfile = async (token) => {
  try {
    const response = await apiClient.get("/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      ...response.data.user,
      token,
    };
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch user profile."
    );
  }
};
