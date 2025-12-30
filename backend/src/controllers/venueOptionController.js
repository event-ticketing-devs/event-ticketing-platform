import VenueOption from "../models/VenueOption.js";

// Get all venue options (optionally filtered by type)
export const getVenueOptions = async (req, res) => {
  try {
    const { type, includeInactive } = req.query;
    
    const filter = {};
    if (type) {
      filter.type = type;
    }
    if (!includeInactive || includeInactive === 'false') {
      filter.isActive = true;
    }
    
    const options = await VenueOption.find(filter)
      .populate("createdBy", "name email")
      .sort({ label: 1 });
    
    res.json(options);
  } catch (error) {
    console.error("Error fetching venue options:", error);
    res.status(500).json({ message: "Failed to fetch venue options" });
  }
};

// Get a single venue option by ID
export const getVenueOption = async (req, res) => {
  try {
    const option = await VenueOption.findById(req.params.id)
      .populate("createdBy", "name email");
    
    if (!option) {
      return res.status(404).json({ message: "Venue option not found" });
    }
    
    res.json(option);
  } catch (error) {
    console.error("Error fetching venue option:", error);
    res.status(500).json({ message: "Failed to fetch venue option" });
  }
};

// Create a new venue option
export const createVenueOption = async (req, res) => {
  try {
    const { type, value, label, description } = req.body;
    
    if (!type || !value || !label) {
      return res.status(400).json({ 
        message: "Type, value, and label are required" 
      });
    }
    
    // Check if option with this value already exists
    const existing = await VenueOption.findOne({ value: value.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ 
        message: "An option with this value already exists" 
      });
    }
    
    const option = await VenueOption.create({
      type,
      value: value.toLowerCase().trim().replace(/\s+/g, '_'),
      label: label.trim(),
      description: description?.trim(),
      createdBy: req.user._id,
    });
    
    res.status(201).json(option);
  } catch (error) {
    console.error("Error creating venue option:", error);
    res.status(500).json({ message: "Failed to create venue option" });
  }
};

// Update a venue option
export const updateVenueOption = async (req, res) => {
  try {
    const { label, description, isActive } = req.body;
    
    const option = await VenueOption.findById(req.params.id);
    
    if (!option) {
      return res.status(404).json({ message: "Venue option not found" });
    }
    
    // Update only allowed fields (value cannot be changed)
    if (label !== undefined) option.label = label.trim();
    if (description !== undefined) option.description = description?.trim();
    if (isActive !== undefined) option.isActive = isActive;
    
    await option.save();
    
    res.json(option);
  } catch (error) {
    console.error("Error updating venue option:", error);
    res.status(500).json({ message: "Failed to update venue option" });
  }
};

// Delete a venue option
export const deleteVenueOption = async (req, res) => {
  try {
    const option = await VenueOption.findById(req.params.id);
    
    if (!option) {
      return res.status(404).json({ message: "Venue option not found" });
    }
    
    // Soft delete by setting isActive to false
    option.isActive = false;
    await option.save();
    
    res.json({ message: "Venue option deleted successfully" });
  } catch (error) {
    console.error("Error deleting venue option:", error);
    res.status(500).json({ message: "Failed to delete venue option" });
  }
};
