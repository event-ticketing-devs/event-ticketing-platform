import axios from "axios";

// Simulate login
export const loginUser = async (email, password) => {
  const res = await axios.get("/mock/users.json");
  const user = res.data.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) throw new Error("Invalid credentials");
  if (!user.isVerified) throw new Error("Account not verified");

  // Simulate updating lastLogin
  user.lastLogin = new Date().toISOString();
  return user;
};
