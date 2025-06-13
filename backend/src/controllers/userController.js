import User from "../models/User.js";

// @desc   Update user profile
// @route  PATCH /api/users/update
// @access Protected
export const updateUser = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password) user.password = password; // will be hashed by pre-save hook

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Logout user
// @route  POST /api/auth/logout
// @access Protected
export const logout = (req, res) => {
  res
    .status(200)
    .json({ message: "Logout successful — delete token on client" });
};
