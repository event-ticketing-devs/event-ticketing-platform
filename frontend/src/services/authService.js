import apiClient from "../api/apiClient";

export const loginUser = async (identifier, password) => {
  try {
    const response = await apiClient.post("/auth/login", {
      identifier,
      password,
    });

    const token = response.data.token;

    // Set token globally
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Fetch user profile after setting global header
    const userProfile = await getProfile();

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

export const getProfile = async () => {
  try {
    const response = await apiClient.get("/users/profile");
    return response.data.user;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch user profile."
    );
  }
};

export const updateProfile = async (formData) => {
  const response = await apiClient.patch("/users/update", formData);
  return response.data.user; // updated user object
};

export const deleteAccount = async () => {
  try {
    const response = await apiClient.delete("/users/delete", {
      headers: {
        Authorization: `Bearer ${
          JSON.parse(localStorage.getItem("user")).token
        }`,
      },
    });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Account deletion failed");
  }
};
