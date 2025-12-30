import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import VerificationNotice from "../components/VerificationNotice";
import { useVenueOptions } from "../utils/venueOptions";
import ConfirmModal from "../components/ConfirmModal";
import { ArrowLeft, Plus, Building2, Users, X, Image, Maximize } from 'lucide-react';

const SpaceManagement = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fetch dynamic options from API
  const { options: amenityOptions, loading: amenitiesLoading } = useVenueOptions('amenity');
  const { options: eventTypeOptions, loading: eventTypesLoading } = useVenueOptions('eventType');
  const { options: policyItemOptions, loading: policyItemsLoading } = useVenueOptions('policyItem');
  
  const [venue, setVenue] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [customEventType, setCustomEventType] = useState("");
  const [customAmenity, setCustomAmenity] = useState("");
  const [customAllowedItem, setCustomAllowedItem] = useState("");
  const [customBannedItem, setCustomBannedItem] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, spaceId: null });

  const [form, setForm] = useState({
    name: "",
    type: "hall",
    indoorOutdoor: "indoor",
    description: "",
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

  const spaceTypes = ["hall", "lawn", "auditorium", "open-area"];

  useEffect(() => {
    fetchData();
  }, [venueId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [venueRes, spacesRes] = await Promise.all([
        apiClient.get(`/venues/${venueId}`),
        apiClient.get(`/spaces/my-spaces`),
      ]);
      
      setVenue(venueRes.data);
      const venueSpaces = spacesRes.data.filter(s => 
        (s.venue._id === venueId || s.venue === venueId)
      );
      setSpaces(venueSpaces);
      
      if (location.state?.isNewVenue && venueSpaces.length === 0) {
        setShowForm(true);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load venue data");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      name: "",
      type: "hall",
      indoorOutdoor: "indoor",
      description: "",
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
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(previews);
  };

  const removePhoto = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPhotoPreviews(newPreviews);
  };

  const handleEdit = (space) => {
    setEditingSpace(space);
    setForm({
      name: space.name || "",
      type: space.type || "hall",
      indoorOutdoor: space.indoorOutdoor || "indoor",
      description: space.description || "",
      maxPax: space.maxPax || "",
      areaSqFt: space.areaSqFt || "",
      supportedEventTypes: space.supportedEventTypes || [],
      bookingUnit: space.bookingUnit || "full-day",
      amenities: space.amenities || { standard: [], custom: [] },
      policies: space.policies || {
        allowedItems: { standard: [], custom: [] },
        bannedItems: { standard: [], custom: [] },
        additionalPolicy: ""
      }
    });
    
    // Set existing photos as previews
    if (space.photos && space.photos.length > 0) {
      setPhotoPreviews(space.photos);
    }
    
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.maxPax) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      
      // Append form fields
      Object.keys(form).forEach(key => {
        if (key === 'amenities' || key === 'policies' || key === 'supportedEventTypes') {
          formData.append(key, JSON.stringify(form[key]));
        } else {
          formData.append(key, form[key]);
        }
      });
      
      formData.append('venue', venueId);
      
      // Append photos if new files selected
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('photos', file);
        });
      }
      
      if (editingSpace) {
        await apiClient.patch(`/spaces/${editingSpace._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Space updated successfully!");
      } else {
        await apiClient.post("/spaces", formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Space created successfully!");
      }
      
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error saving space:", err);
      toast.error(err.response?.data?.message || "Failed to save space");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (spaceId) => {
    setDeleteConfirm({ open: true, spaceId });
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/spaces/${deleteConfirm.spaceId}`);
      toast.success("Space deleted successfully");
      setDeleteConfirm({ open: false, spaceId: null });
      fetchData();
    } catch (err) {
      console.error("Error deleting space:", err);
      toast.error("Failed to delete space");
    }
  };

  const toggleArrayItem = (array, item) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Verification Notice */}
        <VerificationNotice />
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/venue-partner")}
            className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                {showForm ? (editingSpace ? "Edit Space" : "Add New Space") : "Manage Spaces"}
              </h1>
              {!showForm && <p className="text-text-secondary mt-1">{venue?.name}</p>}
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium"
              >
                <Plus className="w-5 h-5" />
                Add New Space
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-bg-primary border border-border rounded-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Space Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Space Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {spaceTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Indoor/Outdoor
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="indoor"
                        checked={form.indoorOutdoor === "indoor"}
                        onChange={(e) => setForm({ ...form, indoorOutdoor: e.target.value })}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-text-primary">Indoor</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="outdoor"
                        checked={form.indoorOutdoor === "outdoor"}
                        onChange={(e) => setForm({ ...form, indoorOutdoor: e.target.value })}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-text-primary">Outdoor</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Maximum Capacity <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.maxPax}
                    onChange={(e) => setForm({ ...form, maxPax: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Area (sq ft)
                  </label>
                  <input
                    type="number"
                    value={form.areaSqFt}
                    onChange={(e) => setForm({ ...form, areaSqFt: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Space Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Space Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    maxLength={2000}
                    placeholder="Describe this space, its features, ideal use cases, and what makes it unique..."
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-text-secondary">
                      Help clients understand what makes this space special
                    </p>
                    <p className="text-xs text-text-secondary">
                      {form.description.length}/2000
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Space Photos
                </label>
                
                {/* Photo Previews */}
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-error text-bg-primary p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="space-photos"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="space-photos"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <Image className="w-12 h-12 text-text-secondary mb-3" />
                    <span className="text-sm text-text-primary font-medium mb-1">
                      Click to upload space photos
                    </span>
                    <span className="text-xs text-text-secondary">
                      PNG, JPG up to 5MB each
                    </span>
                  </label>
                </div>
              </div>

              {/* Event Types */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Supported Event Types
                </label>
                {eventTypesLoading ? (
                  <p className="text-sm text-text-secondary">Loading event types...</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {eventTypeOptions.map(option => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary/30 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={form.supportedEventTypes.some(t => t === option.value || t.startsWith(option.value))}
                          onChange={() => 
                            setForm({
                              ...form,
                              supportedEventTypes: toggleArrayItem(form.supportedEventTypes.filter(t => !t.startsWith('other:')), option.value)
                            })
                          }
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-text-primary capitalize">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Custom Event Types */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Add Custom Event Type <span className="text-xs font-normal">(add one by one)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customEventType}
                      onChange={(e) => setCustomEventType(e.target.value)}
                      placeholder="Enter custom event type"
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customEventType.trim()) {
                            const customValue = `other:${customEventType.trim()}`;
                            if (!form.supportedEventTypes.includes(customValue)) {
                              setForm({
                                ...form,
                                supportedEventTypes: [...form.supportedEventTypes, customValue]
                              });
                              setCustomEventType("");
                            }
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customEventType.trim()) {
                          const customValue = `other:${customEventType.trim()}`;
                          if (!form.supportedEventTypes.includes(customValue)) {
                            setForm({
                              ...form,
                              supportedEventTypes: [...form.supportedEventTypes, customValue]
                            });
                            setCustomEventType("");
                          } else {
                            toast.error("This event type already exists");
                          }
                        }
                      }}
                      className="px-4 py-2 bg-primary text-bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {form.supportedEventTypes.filter(t => t.startsWith('other:')).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.supportedEventTypes.filter(t => t.startsWith('other:')).map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20"
                        >
                          <span className="text-sm">{type.substring(6)}</span>
                          <button
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              supportedEventTypes: form.supportedEventTypes.filter(t => t !== type)
                            })}
                            className="text-primary hover:text-primary/80"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Amenities
                </label>
                {amenitiesLoading ? (
                  <p className="text-sm text-text-secondary">Loading amenities...</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenityOptions.map(option => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary/30 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={form.amenities.standard.includes(option.value)}
                          onChange={() =>
                            setForm({
                              ...form,
                              amenities: {
                                ...form.amenities,
                                standard: toggleArrayItem(form.amenities.standard, option.value)
                              }
                            })
                          }
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-text-primary">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Custom Amenities */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Add Custom Amenity <span className="text-xs font-normal">(add one by one)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      placeholder="Enter custom amenity"
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customAmenity.trim() && !form.amenities.custom.includes(customAmenity.trim())) {
                            setForm({
                              ...form,
                              amenities: {
                                ...form.amenities,
                                custom: [...form.amenities.custom, customAmenity.trim()]
                              }
                            });
                            setCustomAmenity("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customAmenity.trim()) {
                          if (!form.amenities.custom.includes(customAmenity.trim())) {
                            setForm({
                              ...form,
                              amenities: {
                                ...form.amenities,
                                custom: [...form.amenities.custom, customAmenity.trim()]
                              }
                            });
                            setCustomAmenity("");
                          } else {
                            toast.error("This amenity already exists");
                          }
                        }
                      }}
                      className="px-4 py-2 bg-primary text-bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {form.amenities.custom.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.amenities.custom.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20"
                        >
                          <span className="text-sm">{amenity}</span>
                          <button
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              amenities: {
                                ...form.amenities,
                                custom: form.amenities.custom.filter((_, i) => i !== index)
                              }
                            })}
                            className="text-primary hover:text-primary/80"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Policies */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Policies
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Allowed Items */}
                  <div>
                    <h4 className="text-sm font-medium text-success mb-3">Allowed</h4>
                    {policyItemsLoading ? (
                      <p className="text-sm text-text-secondary">Loading policy items...</p>
                    ) : (
                      <div className="space-y-2">
                        {policyItemOptions.map(option => (
                          <label
                            key={option.value}
                            className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-success/30 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={form.policies.allowedItems.standard.includes(option.value)}
                              onChange={() =>
                                setForm({
                                  ...form,
                                  policies: {
                                    ...form.policies,
                                    allowedItems: {
                                      ...form.policies.allowedItems,
                                      standard: toggleArrayItem(form.policies.allowedItems.standard, option.value)
                                    }
                                  }
                                })
                              }
                              className="w-4 h-4 text-success focus:ring-success"
                            />
                            <span className="text-text-primary">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Custom Allowed Items */}
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-text-secondary mb-2">
                        Add Custom Allowed Item <span className="text-xs font-normal">(add one by one)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customAllowedItem}
                          onChange={(e) => setCustomAllowedItem(e.target.value)}
                          placeholder="Enter custom allowed item"
                          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-success/20 focus:border-success"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customAllowedItem.trim() && !form.policies.allowedItems.custom.includes(customAllowedItem.trim())) {
                                setForm({
                                  ...form,
                                  policies: {
                                    ...form.policies,
                                    allowedItems: {
                                      ...form.policies.allowedItems,
                                      custom: [...form.policies.allowedItems.custom, customAllowedItem.trim()]
                                    }
                                  }
                                });
                                setCustomAllowedItem("");
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customAllowedItem.trim()) {
                              if (!form.policies.allowedItems.custom.includes(customAllowedItem.trim())) {
                                setForm({
                                  ...form,
                                  policies: {
                                    ...form.policies,
                                    allowedItems: {
                                      ...form.policies.allowedItems,
                                      custom: [...form.policies.allowedItems.custom, customAllowedItem.trim()]
                                    }
                                  }
                                });
                                setCustomAllowedItem("");
                              } else {
                                toast.error("This item already exists");
                              }
                            }
                          }}
                          className="px-3 py-2 bg-success text-bg-primary rounded-lg hover:bg-success/90 transition-colors cursor-pointer font-medium text-sm"
                        >
                          Add
                        </button>
                      </div>
                      {form.policies.allowedItems.custom.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {form.policies.allowedItems.custom.map((item, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-2 px-2 py-1 bg-success/10 text-success rounded-md border border-success/20 text-sm"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => setForm({
                                  ...form,
                                  policies: {
                                    ...form.policies,
                                    allowedItems: {
                                      ...form.policies.allowedItems,
                                      custom: form.policies.allowedItems.custom.filter((_, i) => i !== index)
                                    }
                                  }
                                })}
                                className="text-success hover:text-success/80"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banned Items */}
                  <div>
                    <h4 className="text-sm font-medium text-error mb-3">Banned</h4>
                    {policyItemsLoading ? (
                      <p className="text-sm text-text-secondary">Loading policy items...</p>
                    ) : (
                      <div className="space-y-2">
                        {policyItemOptions.map(option => (
                          <label
                            key={option.value}
                            className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-error/30 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={form.policies.bannedItems.standard.includes(option.value)}
                              onChange={() =>
                                setForm({
                                  ...form,
                                  policies: {
                                    ...form.policies,
                                    bannedItems: {
                                      ...form.policies.bannedItems,
                                      standard: toggleArrayItem(form.policies.bannedItems.standard, option.value)
                                    }
                                  }
                                })
                              }
                              className="w-4 h-4 text-error focus:ring-error"
                            />
                            <span className="text-text-primary">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Custom Banned Items */}
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-text-secondary mb-2">
                        Add Custom Banned Item <span className="text-xs font-normal">(add one by one)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customBannedItem}
                          onChange={(e) => setCustomBannedItem(e.target.value)}
                          placeholder="Enter custom banned item"
                          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-error/20 focus:border-error"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customBannedItem.trim() && !form.policies.bannedItems.custom.includes(customBannedItem.trim())) {
                                setForm({
                                  ...form,
                                  policies: {
                                    ...form.policies,
                                    bannedItems: {
                                      ...form.policies.bannedItems,
                                      custom: [...form.policies.bannedItems.custom, customBannedItem.trim()]
                                    }
                                  }
                                });
                                setCustomBannedItem("");
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customBannedItem.trim()) {
                              if (!form.policies.bannedItems.custom.includes(customBannedItem.trim())) {
                                setForm({
                                  ...form,
                                  policies: {
                                    ...form.policies,
                                    bannedItems: {
                                      ...form.policies.bannedItems,
                                      custom: [...form.policies.bannedItems.custom, customBannedItem.trim()]
                                    }
                                  }
                                });
                                setCustomBannedItem("");
                              } else {
                                toast.error("This item already exists");
                              }
                            }
                          }}
                          className="px-3 py-2 bg-error text-bg-primary rounded-lg hover:bg-error/90 transition-colors cursor-pointer font-medium text-sm"
                        >
                          Add
                        </button>
                      </div>
                      {form.policies.bannedItems.custom.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {form.policies.bannedItems.custom.map((item, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-2 px-2 py-1 bg-error/10 text-error rounded-md border border-error/20 text-sm"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => setForm({
                                  ...form,
                                  policies: {
                                    ...form.policies,
                                    bannedItems: {
                                      ...form.policies.bannedItems,
                                      custom: form.policies.bannedItems.custom.filter((_, i) => i !== index)
                                    }
                                  }
                                })}
                                className="text-error hover:text-error/80"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Policy */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Additional Policy Notes
                  </label>
                  <textarea
                    value={form.policies.additionalPolicy}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        policies: {
                          ...form.policies,
                          additionalPolicy: e.target.value
                        }
                      })
                    }
                    rows={3}
                    placeholder="Add any additional policy information or special requirements..."
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingSpace ? "Update Space" : "Create Space"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-border rounded-lg text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Spaces Grid */}
        {spaces.length === 0 && !showForm ? (
          <div className="text-center py-16 bg-bg-primary border border-border rounded-lg">
            <Building2 className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No Spaces Yet</h3>
            <p className="text-text-secondary mb-6">Add your first space to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium"
            >
              <Plus className="w-5 h-5" />
              Add First Space
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <div
                key={space._id}
                className="bg-bg-primary border border-border rounded-lg overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col"
              >
                {space.photos && space.photos.length > 0 && (
                  <img
                    src={space.photos[0]}
                    alt={space.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-1">
                        {space.name}
                      </h3>
                      <div className="flex gap-2">
                        <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-md">
                          {space.type.charAt(0).toUpperCase() + space.type.slice(1)}
                        </span>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md">
                          {space.indoorOutdoor.charAt(0).toUpperCase() + space.indoorOutdoor.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Users className="w-4 h-4" />
                      <span>Max Capacity: {space.maxPax} guests</span>
                    </div>
                    {space.areaSqFt && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Maximize className="w-4 h-4" />
                        <span>{space.areaSqFt} sq ft</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-auto pt-4">
                    <button
                      onClick={() => navigate(`/venue-partner/spaces/${space._id}/availability`)}
                      className="px-3 py-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer text-xs font-medium"
                    >
                      Availability
                    </button>
                    <button
                      onClick={() => handleEdit(space)}
                      className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors cursor-pointer text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(space._id)}
                      className="px-3 py-2 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors cursor-pointer text-xs font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.open}
        title="Delete Space"
        description="Are you sure you want to delete this space? This action cannot be undone."
        onClose={() => setDeleteConfirm({ open: false, spaceId: null })}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default SpaceManagement;
