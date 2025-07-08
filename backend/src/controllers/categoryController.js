import Category from "../models/Category.js";
import Event from "../models/Event.js";

// @desc    Create a new category
// @route   POST /api/categories
// @access  Admin Only
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    // Validate name is a non-empty string
    if (typeof name !== "string" || name.trim().length === 0) {
      return res
        .status(400)
        .json({ message: "Category name must be a non-empty string" });
    }
    // Allow description to be optional or empty string
    if (description != null && typeof description !== "string") {
      return res
        .status(400)
        .json({ message: "Category description must be a string if provided" });
    }
    const existing = await Category.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PATCH /api/categories/:id
// @access  Admin Only
export const updateCategory = async (req, res) => {
  try {
    // Find the existing category first
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory)
      return res.status(404).json({ message: "Category not found" });

    // Check for duplicate category name (case-insensitive) if name is being updated
    if (
      Object.prototype.hasOwnProperty.call(req.body, "name") &&
      req.body.name &&
      req.body.name !== existingCategory.name
    ) {
      const duplicate = await Category.findOne({
        name: { $regex: `^${req.body.name}$`, $options: "i" },
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        return res
          .status(400)
          .json({ message: "Category with the same name already exists" });
      }
    }

    // Validate fields if present in update
    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      if (
        typeof req.body.name !== "string" ||
        req.body.name.trim().length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Category name must be a non-empty string" });
      }
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      if (
        req.body.description != null &&
        typeof req.body.description !== "string"
      ) {
        return res
          .status(400)
          .json({
            message: "Category description must be a string if provided",
          });
      }
    }
    // Check if the update data is actually different
    const updatableFields = ["name", "description"];
    let isDifferent = false;
    for (const field of updatableFields) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, field) &&
        String(existingCategory[field]) !== String(req.body[field])
      ) {
        isDifferent = true;
        break;
      }
    }
    if (!isDifferent) {
      return res
        .status(400)
        .json({ message: "No changes detected. Category not updated." });
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin Only
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // Check if any events exist with this category
    const hasEvents = await Event.exists({ categoryId: category._id });
    if (hasEvents) {
      return res
        .status(400)
        .json({ message: "Cannot delete category with existing events" });
    }

    await category.deleteOne();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
