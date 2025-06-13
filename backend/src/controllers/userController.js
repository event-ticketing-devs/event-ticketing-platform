import User from "../models/User.js";

// @desc   Get current user profile
// @route  GET /api/users/profile
// @access Protected
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name email phone");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Update user profile
// @route  PATCH /api/users/update
// @access Protected
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate phone format
    if (phone && !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits" });
    }

    // Validate password length (minimum 6 characters)
    if (password && !/^.{6,}$/.test(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if values are the same
    const isSameName = name === undefined || name === user.name;
    const isSameEmail = email === undefined || email === user.email;
    const isSamePhone = phone === undefined || phone === user.phone;
    const isSamePassword =
      password === undefined || (await user.comparePassword(password));

    if (isSameName && isSameEmail && isSamePhone && isSamePassword) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    // Check for email/phone uniqueness only if being changed
    if (email && email !== user.email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser)
        return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    if (phone && phone !== user.phone) {
      const existingPhoneUser = await User.findOne({ phone });
      if (existingPhoneUser)
        return res.status(400).json({ message: "Phone number already in use" });
      user.phone = phone;
    }

    if (!isSameName) user.name = name;
    if (!isSamePassword) user.password = password; // Will be hashed by pre-save

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Delete own account
// @route  DELETE /api/users/delete
// @access Protected
export const deleteSelf = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Your account has been deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc   Admin deletes a user by ID (except other admins)
// @route  DELETE /api/users/:id
// @access Protected/Admin
export const adminDeleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToDelete.role === "admin") {
      return res.status(403).json({ message: "Cannot delete an admin user" });
    }

    await userToDelete.deleteOne();
    res.status(200).json({ message: "User deleted by admin" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
