import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { STANDARD_AMENITIES, STANDARD_POLICY_ITEMS, getAmenityLabel, getPolicyItemLabel } from "../constants/venueConstants";

const SpaceManagement = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [venue, setVenue] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [isNewVenue, setIsNewVenue] = useState(false);
  const [viewingSpace, setViewingSpace] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "hall",
    indoorOutdoor: "indoor",
    maxPax: "",
    areaSqFt: "",
    supportedEventTypes: [],
    bookingUnit: "full-day",
    amenities: {
      standard: [],
      custom: []
    },
    policies: {
      allowedItems: {
        standard: [],
        custom: []
      },
      bannedItems: {
        standard: [],
        custom: []
      },
      additionalPolicy: ""
    }
  });

  const [eventTypeInput, setEventTypeInput] = useState("");
  const [customEventType, setCustomEventType] = useState("");
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [customAllowedItemInput, setCustomAllowedItemInput] = useState("");
  const [customBannedItemInput, setCustomBannedItemInput] = useState("");

  const eventTypes = ["wedding", "conference", "concert", "birthday", "corporate", "exhibition", "other"];
  const spaceTypes = ["hall", "lawn", "auditorium", "open-area"];
  const bookingUnits = ["full-day"];

  useEffect(() => {
    // Check if this is a newly created venue
    if (location.state?.isNewVenue) {
      setIsNewVenue(true);
    }
    fetchData();
  }, [venueId, location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [venueRes, spacesRes] = await Promise.all([
        apiClient.get(`/venues/${venueId}`),
        apiClient.get(`/spaces/my-spaces`),
      ]);
      
      setVenue(venueRes.data);
      // Filter spaces for this venue
      const venueSpaces = spacesRes.data.filter(s => s.venue._id === venueId || s.venue === venueId);
      setSpaces(venueSpaces);
      
      // Auto-open form if new venue with no spaces
      if (location.state?.isNewVenue && venueSpaces.length === 0) {
        setShowForm(true);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load venue data");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEventType = (type) => {
    if (type === "other") {
      // For 'other', remove all 'other:*' entries
      const filteredTypes = form.supportedEventTypes.filter(t => !t.startsWith("other"));
      setForm((prev) => ({
        ...prev,
        supportedEventTypes: filteredTypes,
      }));
      setCustomEventType("");
    } else {
      setForm((prev) => ({
        ...prev,
        supportedEventTypes: prev.supportedEventTypes.includes(type)
          ? prev.supportedEventTypes.filter((t) => t !== type)
          : [...prev.supportedEventTypes, type],
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 photos
    const totalPhotos = photoPreviews.length + files.length;
    if (totalPhotos > 5) {
      toast.error("Maximum 5 photos allowed per space");
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each image must be less than 5MB");
        return;
      }
    }

    // Add files to selected files
    setSelectedFiles(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomEventType = () => {
    if (!customEventType.trim()) {
      toast.error("Please enter a custom event type");
      return;
    }
    
    const customType = `other:${customEventType.trim()}`;
    
    // Check if this custom type already exists (case-insensitive)
    const existingCustomTypes = form.supportedEventTypes.filter(t => t.startsWith("other:"));
    const isDuplicate = existingCustomTypes.some(
      t => t.toLowerCase() === customType.toLowerCase()
    );
    
    if (isDuplicate) {
      toast.error("This custom event type is already added");
      return;
    }
    
    setForm((prev) => ({
      ...prev,
      supportedEventTypes: [...prev.supportedEventTypes, customType],
    }));
    setCustomEventType("");
    toast.success("Custom event type added");
  };

  const toggleStandardAmenity = (value) => {
    setForm((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        standard: prev.amenities.standard.includes(value)
          ? prev.amenities.standard.filter(a => a !== value)
          : [...prev.amenities.standard, value]
      }
    }));
  };

  const addCustomAmenity = () => {
    if (!customAmenityInput.trim()) {
      toast.error("Please enter a custom amenity");
      return;
    }
    
    if (customAmenityInput.includes(',')) {
      toast.error("Custom amenities cannot contain commas. Add one at a time.");
      return;
    }
    
    const trimmed = customAmenityInput.trim();
    if (form.amenities.custom.includes(trimmed)) {
      toast.error("This amenity is already added");
      return;
    }
    
    setForm((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        custom: [...prev.amenities.custom, trimmed]
      }
    }));
    setCustomAmenityInput("");
  };

  const removeCustomAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        custom: prev.amenities.custom.filter(a => a !== amenity)
      }
    }));
  };

  const toggleAllowedItem = (value) => {
    // Check if trying to add and it's already in banned items
    if (!form.policies.allowedItems.standard.includes(value) && 
        form.policies.bannedItems.standard.includes(value)) {
      toast.error("This item is already in banned items. Remove it from banned items first.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        allowedItems: {
          ...prev.policies.allowedItems,
          standard: prev.policies.allowedItems.standard.includes(value)
            ? prev.policies.allowedItems.standard.filter(a => a !== value)
            : [...prev.policies.allowedItems.standard, value]
        }
      }
    }));
  };

  const addCustomAllowedItem = () => {
    if (!customAllowedItemInput.trim()) {
      toast.error("Please enter a custom allowed item");
      return;
    }
    
    if (customAllowedItemInput.includes(',')) {
      toast.error("Custom items cannot contain commas. Add one at a time.");
      return;
    }
    
    const trimmed = customAllowedItemInput.trim();
    if (form.policies.allowedItems.custom.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This item is already added");
      return;
    }

    // Check if it's already in banned items (case-insensitive)
    if (form.policies.bannedItems.custom.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This item is already in banned items. Remove it from banned items first.");
      return;
    }
    
    setForm((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        allowedItems: {
          ...prev.policies.allowedItems,
          custom: [...prev.policies.allowedItems.custom, trimmed]
        }
      }
    }));
    setCustomAllowedItemInput("");
  };

  const removeCustomAllowedItem = (item) => {
    setForm((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        allowedItems: {
          ...prev.policies.allowedItems,
          custom: prev.policies.allowedItems.custom.filter(a => a !== item)
        }
      }
    }));
  };

  const toggleBannedItem = (value) => {
    // Check if trying to add and it's already in allowed items
    if (!form.policies.bannedItems.standard.includes(value) && 
        form.policies.allowedItems.standard.includes(value)) {
      toast.error("This item is already in allowed items. Remove it from allowed items first.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        bannedItems: {
          ...prev.policies.bannedItems,
          standard: prev.policies.bannedItems.standard.includes(value)
            ? prev.policies.bannedItems.standard.filter(a => a !== value)
            : [...prev.policies.bannedItems.standard, value]
        }
      }
    }));
  };

  const addCustomBannedItem = () => {
    if (!customBannedItemInput.trim()) {
      toast.error("Please enter a custom banned item");
      return;
    }
    
    if (customBannedItemInput.includes(',')) {
      toast.error("Custom items cannot contain commas. Add one at a time.");
      return;
    }
    
    const trimmed = customBannedItemInput.trim();
    if (form.policies.bannedItems.custom.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This item is already added");
      return;
    }

    // Check if it's already in allowed items (case-insensitive)
    if (form.policies.allowedItems.custom.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This item is already in allowed items. Remove it from allowed items first.");
      return;
    }
    
    setForm((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        bannedItems: {
          ...prev.policies.bannedItems,
          custom: [...prev.policies.bannedItems.custom, trimmed]
        }
      }
    }));
    setCustomBannedItemInput("");
  };

  const removeCustomBannedItem = (item) => {
    setForm((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        bannedItems: {
          ...prev.policies.bannedItems,
          custom: prev.policies.bannedItems.custom.filter(a => a !== item)
        }
      }
    }));
  };

  const handleEdit = (space) => {
    setEditingSpace(space);
    
    // Handle backward compatibility for amenities
    let amenitiesData = { standard: [], custom: [] };
    if (space.amenities) {
      if (space.amenities.standard || space.amenities.custom) {
        // New structure
        amenitiesData = {
          standard: space.amenities.standard || [],
          custom: space.amenities.custom || []
        };
      } else if (Array.isArray(space.amenities)) {
        // Old structure - treat as custom
        amenitiesData.custom = space.amenities;
      }
    }

    // Handle policies
    let policiesData = {
      allowedItems: { standard: [], custom: [] },
      bannedItems: { standard: [], custom: [] },
      additionalPolicy: ""
    };
    if (space.policies) {
      policiesData = {
        allowedItems: space.policies.allowedItems || { standard: [], custom: [] },
        bannedItems: space.policies.bannedItems || { standard: [], custom: [] },
        additionalPolicy: space.policies.additionalPolicy || ""
      };
    }
    
    setForm({
      name: space.name,
      type: space.type,
      indoorOutdoor: space.indoorOutdoor,
      maxPax: space.maxPax,
      areaSqFt: space.areaSqFt || "",
      supportedEventTypes: space.supportedEventTypes || [],
      bookingUnit: space.bookingUnit,
      amenities: amenitiesData,
      policies: policiesData
    });
    setShowForm(true);
  };

  const handleDelete = async (spaceId, spaceName) => {
    if (!window.confirm(`Are you sure you want to deactivate "${spaceName}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/spaces/${spaceId}`);
      toast.success("Space deactivated successfully");
      fetchData();
    } catch (err) {
      console.error("Error deleting space:", err);
      toast.error(err.response?.data?.message || "Failed to deactivate space");
    }
  };

  const handleActivate = async (spaceId, spaceName) => {
    if (!window.confirm(`Are you sure you want to reactivate "${spaceName}"?`)) {
      return;
    }

    try {
      await apiClient.patch(`/spaces/${spaceId}`, { isActive: true });
      toast.success("Space reactivated successfully");
      fetchData();
    } catch (err) {
      console.error("Error activating space:", err);
      toast.error(err.response?.data?.message || "Failed to reactivate space");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.name || !form.maxPax || form.supportedEventTypes.length === 0) {
      return toast.error("Please fill in all required fields");
    }

    if (parseInt(form.maxPax) <= 0) {
      return toast.error("Maximum capacity must be greater than 0");
    }

    setSubmitting(true);

    try {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append("venue", venueId);
      formData.append("name", form.name);
      formData.append("type", form.type);
      formData.append("indoorOutdoor", form.indoorOutdoor);
      formData.append("maxPax", parseInt(form.maxPax));
      if (form.areaSqFt) {
        formData.append("areaSqFt", parseInt(form.areaSqFt));
      }
      formData.append("supportedEventTypes", JSON.stringify(form.supportedEventTypes));
      formData.append("bookingUnit", form.bookingUnit);
      formData.append("amenities", JSON.stringify(form.amenities));
      formData.append("policies", JSON.stringify(form.policies));

      // Add photos
      selectedFiles.forEach((file) => {
        formData.append("photos", file);
      });

      if (editingSpace) {
        await apiClient.patch(`/spaces/${editingSpace._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Space updated successfully");
      } else {
        await apiClient.post("/spaces", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Space created successfully");
      }

      // Reset form
      setForm({
        name: "",
        type: "hall",
        indoorOutdoor: "indoor",
        maxPax: "",
        areaSqFt: "",
        supportedEventTypes: [],
        bookingUnit: "full-day",
        amenities: { standard: [], custom: [] },
        policies: {
          allowedItems: { standard: [], custom: [] },
          bannedItems: { standard: [], custom: [] },
          additionalPolicy: ""
        }
      });
      setSelectedFiles([]);
      setPhotoPreviews([]);
      setEditingSpace(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error("Error saving space:", err);
      toast.error(err.response?.data?.message || "Failed to save space");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingSpace(null);
    setSelectedFiles([]);
    setPhotoPreviews([]);
    setForm({
      name: "",
      type: "hall",
      indoorOutdoor: "indoor",
      maxPax: "",
      areaSqFt: "",
      supportedEventTypes: [],
      bookingUnit: "full-day",
      amenities: { standard: [], custom: [] },
      policies: {
        allowedItems: { standard: [], custom: [] },
        bannedItems: { standard: [], custom: [] },
        additionalPolicy: ""
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/venue-partner")}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{venue?.name}</h1>
              <p className="text-gray-600 mt-1">Manage spaces for this venue</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                + Add Space
              </button>
            )}
          </div>
        </div>

        {/* New Venue Alert */}
        {isNewVenue && spaces.length === 0 && !showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  🎉 Venue Created Successfully!
                </h3>
                <p className="text-blue-800 mb-4">
                  To start receiving event enquiries, you need to add at least one space to your venue. 
                  Spaces are the bookable areas within your venue (e.g., halls, lawns, auditoriums).
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Your First Space
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Space Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingSpace ? "Edit Space" : "Add New Space"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Space Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g., Grand Ballroom, Main Lawn"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Space Type *
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {spaceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indoor/Outdoor *
                  </label>
                  <select
                    name="indoorOutdoor"
                    value={form.indoorOutdoor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Capacity * (people)
                  </label>
                  <input
                    type="number"
                    name="maxPax"
                    value={form.maxPax}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area (sq ft)
                  </label>
                  <input
                    type="number"
                    name="areaSqFt"
                    value={form.areaSqFt}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Unit *
                  </label>
                  <select
                    name="bookingUnit"
                    value={form.bookingUnit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {bookingUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit.charAt(0).toUpperCase() + unit.slice(1).replace("-", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supported Event Types */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supported Event Types * (select at least one)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {eventTypes.map((type) => {
                    const isOtherSelected = form.supportedEventTypes.some(t => t.startsWith("other"));
                    const isSelected = type === "other" ? isOtherSelected : form.supportedEventTypes.includes(type);
                    
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleEventType(type)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    );
                  })}
                </div>
                
                {/* Custom Event Type Input for 'Other' */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Custom Event Type (for "Other")
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customEventType}
                      onChange={(e) => setCustomEventType(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomEventType())}
                      placeholder="e.g., Art Exhibition, Product Launch"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomEventType}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Show current custom types */}
                  {form.supportedEventTypes.filter(t => t.startsWith("other:")).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Custom event types:</p>
                      <div className="flex flex-wrap gap-2">
                        {form.supportedEventTypes
                          .filter(t => t.startsWith("other:"))
                          .map((type, index) => {
                            const customName = type.substring(6); // Remove 'other:' prefix
                            return (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {customName}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm({
                                      ...form,
                                      supportedEventTypes: form.supportedEventTypes.filter(t => t !== type),
                                    });
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Amenities
                </label>
                
                {/* Standard Amenities - Checkboxes */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Select standard amenities:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {STANDARD_AMENITIES.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.amenities.standard.includes(value)}
                          onChange={() => toggleStandardAmenity(value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Amenities - Other */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="block text-xs text-gray-600 mb-2">
                    Add custom amenities (one at a time, no commas):
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={customAmenityInput}
                      onChange={(e) => setCustomAmenityInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAmenity())}
                      placeholder="e.g., DJ Console, Smoke Machine"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomAmenity}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Show custom amenities */}
                  {form.amenities.custom.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-2">Custom amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {form.amenities.custom.map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {amenity}
                            <button
                              type="button"
                              onClick={() => removeCustomAmenity(amenity)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Policies - Allowed Items */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Allowed Items
                </label>
                
                {/* Standard Allowed Items - Checkboxes */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Select standard allowed items:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {STANDARD_POLICY_ITEMS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.policies.allowedItems.standard.includes(value)}
                          onChange={() => toggleAllowedItem(value)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Allowed Items */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="block text-xs text-gray-600 mb-2">
                    Add custom allowed items (one at a time, no commas):
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={customAllowedItemInput}
                      onChange={(e) => setCustomAllowedItemInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAllowedItem())}
                      placeholder="e.g., External Caterers, Valet Service"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomAllowedItem}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                  
                  {form.policies.allowedItems.custom.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-2">Custom allowed items:</p>
                      <div className="flex flex-wrap gap-2">
                        {form.policies.allowedItems.custom.map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeCustomAllowedItem(item)}
                              className="text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Policies - Banned Items */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Banned Items
                </label>
                
                {/* Standard Banned Items - Checkboxes */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Select standard banned items:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {STANDARD_POLICY_ITEMS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.policies.bannedItems.standard.includes(value)}
                          onChange={() => toggleBannedItem(value)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Banned Items */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="block text-xs text-gray-600 mb-2">
                    Add custom banned items (one at a time, no commas):
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={customBannedItemInput}
                      onChange={(e) => setCustomBannedItemInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomBannedItem())}
                      placeholder="e.g., Glass Bottles, Live Animals"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomBannedItem}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Add
                    </button>
                  </div>
                  
                  {form.policies.bannedItems.custom.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-2">Custom banned items:</p>
                      <div className="flex flex-wrap gap-2">
                        {form.policies.bannedItems.custom.map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeCustomBannedItem(item)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Policy */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Policy (Optional)
                </label>
                <textarea
                  value={form.policies.additionalPolicy}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    policies: { ...prev.policies, additionalPolicy: e.target.value }
                  }))}
                  rows={3}
                  placeholder="Any additional policies or terms for this space..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Space Photos */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Space Photos (Max 5)
                </label>
                
                {photoPreviews.length < 5 && (
                  <div className="mb-4">
                    <label
                      htmlFor="photos-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="mb-1 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5MB each)</p>
                        <p className="text-xs text-gray-500 mt-1">{photoPreviews.length}/5 photos uploaded</p>
                      </div>
                      <input
                        id="photos-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Space photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          {index + 1}/{photoPreviews.length}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? "Saving..." : editingSpace ? "Update Space" : "Add Space"}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Spaces List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Spaces ({spaces.length})</h2>
          
          {spaces.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="mt-4 text-gray-600">No spaces yet</p>
              <p className="text-sm text-gray-500">Add your first space to start receiving enquiries</p>
            </div>
          ) : (
            <div className="space-y-4">
              {spaces.map((space) => (
                <div
                  key={space._id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Space Photo Thumbnail */}
                  {space.photos && space.photos.length > 0 && (
                    <div className="relative">
                      <img
                        src={space.photos[0]}
                        alt={space.name}
                        className="w-full h-48 object-cover"
                      />
                      {space.photos.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          +{space.photos.length - 1} more
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{space.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {space.type} • {space.indoorOutdoor}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setViewingSpace(space);
                            setShowDetailsModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEdit(space)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        {space.isActive ? (
                          <button
                            onClick={() => handleDelete(space._id, space.name)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(space._id, space.name)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Activate
                          </button>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Capacity:</span>
                      <p className="font-medium">{space.maxPax} people</p>
                    </div>
                    {space.areaSqFt && (
                      <div>
                        <span className="text-gray-600">Area:</span>
                        <p className="font-medium">{space.areaSqFt} sq ft</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Booking Unit:</span>
                      <p className="font-medium capitalize">{space.bookingUnit}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className={`font-medium ${space.isActive ? "text-green-600" : "text-red-600"}`}>
                        {space.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>

                  {space.supportedEventTypes && space.supportedEventTypes.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-600">Event Types: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {space.supportedEventTypes.slice(0, 3).map((type, idx) => {
                          const displayName = type.startsWith("other:") 
                            ? type.substring(6)
                            : type.charAt(0).toUpperCase() + type.slice(1);
                          return (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {displayName}
                            </span>
                          );
                        })}
                        {space.supportedEventTypes.length > 3 && (
                          <span className="px-2 py-1 text-gray-500 text-xs">
                            +{space.supportedEventTypes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Continue Button */}
        {spaces.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => navigate("/venue-partner")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        )}

        {/* Space Details Modal */}
        {showDetailsModal && viewingSpace && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewingSpace.name}</h2>
                  <p className="text-gray-600 mt-1 capitalize">{viewingSpace.type}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Space Photos Gallery */}
                {viewingSpace.photos && viewingSpace.photos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {viewingSpace.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${viewingSpace.name} - Photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="text-lg font-semibold text-gray-900">{viewingSpace.maxPax} people</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="text-lg font-semibold text-gray-900">{viewingSpace.areaSqFt} sq ft</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Setting</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{viewingSpace.indoorOutdoor}</p>
                  </div>
                </div>

                {/* Event Types */}
                {viewingSpace.supportedEventTypes && viewingSpace.supportedEventTypes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Supported Event Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingSpace.supportedEventTypes.map((type, idx) => {
                        const displayName = type.startsWith("other:") 
                          ? type.substring(6)
                          : type.charAt(0).toUpperCase() + type.slice(1);
                        return (
                          <span
                            key={idx}
                            className="inline-block px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                          >
                            {displayName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {((viewingSpace.amenities?.standard && viewingSpace.amenities.standard.length > 0) || 
                  (viewingSpace.amenities?.custom && viewingSpace.amenities.custom.length > 0)) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {viewingSpace.amenities?.standard?.map((amenity, idx) => (
                        <div key={`std-${idx}`} className="flex items-center text-gray-700">
                          <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {getAmenityLabel(amenity)}
                        </div>
                      ))}
                      {viewingSpace.amenities?.custom?.map((amenity, idx) => (
                        <div key={`custom-${idx}`} className="flex items-center text-gray-700">
                          <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {amenity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Policies */}
                {((viewingSpace.policies?.allowedItems?.standard && viewingSpace.policies.allowedItems.standard.length > 0) ||
                  (viewingSpace.policies?.allowedItems?.custom && viewingSpace.policies.allowedItems.custom.length > 0) ||
                  (viewingSpace.policies?.bannedItems?.standard && viewingSpace.policies.bannedItems.standard.length > 0) ||
                  (viewingSpace.policies?.bannedItems?.custom && viewingSpace.policies.bannedItems.custom.length > 0) ||
                  viewingSpace.policies?.additionalPolicy) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Policies</h3>
                    
                    {/* Allowed Items */}
                    {((viewingSpace.policies?.allowedItems?.standard && viewingSpace.policies.allowedItems.standard.length > 0) ||
                      (viewingSpace.policies?.allowedItems?.custom && viewingSpace.policies.allowedItems.custom.length > 0)) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-green-700 mb-2">✓ Allowed</h4>
                        <div className="flex flex-wrap gap-2">
                          {viewingSpace.policies.allowedItems.standard?.map((item, idx) => (
                            <span
                              key={`allowed-std-${idx}`}
                              className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                            >
                              {getPolicyItemLabel(item)}
                            </span>
                          ))}
                          {viewingSpace.policies.allowedItems.custom?.map((item, idx) => (
                            <span
                              key={`allowed-custom-${idx}`}
                              className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Banned Items */}
                    {((viewingSpace.policies?.bannedItems?.standard && viewingSpace.policies.bannedItems.standard.length > 0) ||
                      (viewingSpace.policies?.bannedItems?.custom && viewingSpace.policies.bannedItems.custom.length > 0)) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-red-700 mb-2">✗ Not Allowed</h4>
                        <div className="flex flex-wrap gap-2">
                          {viewingSpace.policies.bannedItems.standard?.map((item, idx) => (
                            <span
                              key={`banned-std-${idx}`}
                              className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                            >
                              {getPolicyItemLabel(item)}
                            </span>
                          ))}
                          {viewingSpace.policies.bannedItems.custom?.map((item, idx) => (
                            <span
                              key={`banned-custom-${idx}`}
                              className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Policy */}
                    {viewingSpace.policies?.additionalPolicy && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Policy</h4>
                        <p className="text-gray-700 text-sm">{viewingSpace.policies.additionalPolicy}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Booking Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Booking Unit:</span>
                      <p className="font-medium text-gray-900 capitalize">{viewingSpace.bookingUnit}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className={`font-medium ${viewingSpace.isActive ? "text-green-600" : "text-red-600"}`}>
                        {viewingSpace.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(viewingSpace);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Space
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceManagement;
