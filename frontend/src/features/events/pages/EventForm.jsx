import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import toast from "react-hot-toast";
import VenueSelector from "../../venues/components/VenueSelector";
import VerificationNotice from "../../../common/components/VerificationNotice";
import { ArrowLeft, Upload, X, Calendar, MapPin, Users, Tag, Plus, Trash2, ChevronDown, Check } from 'lucide-react';

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    categoryId: "",
    city: "",
    venue: null, // Now an object with name, address, coordinates
    price: "",
    totalSeats: 0,
    photo: "",
    hasTicketCategories: false,
    ticketCategories: [
      { name: "", price: "", totalSeats: "", description: "" },
    ],
    useDefaultRefundPolicy: true,
    customRefundPolicy: {
      sevenDaysOrMore: 100,
      oneToDays: 50,
      lessThanDay: 0,
      description: "",
    },
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/categories");
      setCategories(res.data);
    } catch {
      toast.error("Failed to fetch categories");
    }
    setLoading(false);
  };

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/events/${id}`);
      const {
        title,
        description,
        date,
        categoryId,
        city,
        venue,
        price,
        totalSeats,
        photo,
        hasTicketCategories,
        ticketCategories,
        useDefaultRefundPolicy,
        customRefundPolicy,
      } = res.data;

      const formatDateForInput = (dateString) => {
        const eventDate = new Date(dateString);
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, "0");
        const day = String(eventDate.getDate()).padStart(2, "0");
        const hours = String(eventDate.getHours()).padStart(2, "0");
        const minutes = String(eventDate.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setForm({
        title,
        description,
        date: formatDateForInput(date),
        categoryId:
          typeof categoryId === "object" && categoryId !== null
            ? categoryId._id
            : categoryId,
        city: city || "",
        venue: venue || null,
        price: price || "",
        totalSeats: totalSeats || 0,
        photo: photo || "",
        hasTicketCategories: hasTicketCategories || false,
        ticketCategories:
          hasTicketCategories && ticketCategories && ticketCategories.length > 0
            ? ticketCategories.map((cat) => ({
                name: cat.name || "",
                price: cat.price || "",
                totalSeats: cat.totalSeats || "",
                description: cat.description || "",
              }))
            : [{ name: "", price: "", totalSeats: "", description: "" }],
        useDefaultRefundPolicy: useDefaultRefundPolicy !== undefined ? useDefaultRefundPolicy : true,
        customRefundPolicy: customRefundPolicy || {
          sevenDaysOrMore: 100,
          oneToDays: 50,
          lessThanDay: 0,
          description: "",
        },
      });

      // Set image preview for existing event
      if (photo) {
        setImagePreview(photo);
      }
    } catch {
      toast.error("Failed to fetch event");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "totalSeats") {
      // Only allow positive integers
      const intValue =
        value === "" ? "" : Math.max(1, parseInt(value, 10) || 1);
      setForm((prev) => ({ ...prev, [name]: intValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVenueSelect = (venueData) => {
    setForm((prev) => ({ ...prev, venue: venueData }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setForm((prev) => ({ ...prev, photo: "" }));
  };

  const toggleTicketCategories = () => {
    setForm((prev) => ({
      ...prev,
      hasTicketCategories: !prev.hasTicketCategories,
      ticketCategories: !prev.hasTicketCategories
        ? [{ name: "", price: "", totalSeats: "", description: "" }]
        : prev.ticketCategories,
    }));
  };

  const addTicketCategory = () => {
    if (form.ticketCategories.length < 5) {
      setForm((prev) => ({
        ...prev,
        ticketCategories: [
          ...prev.ticketCategories,
          { name: "", price: "", totalSeats: "", description: "" },
        ],
      }));
    } else {
      toast.error("Maximum 5 ticket categories allowed");
    }
  };

  const removeTicketCategory = (index) => {
    if (form.ticketCategories.length > 1) {
      setForm((prev) => ({
        ...prev,
        ticketCategories: prev.ticketCategories.filter((_, i) => i !== index),
      }));
    } else {
      toast.error("At least one ticket category is required");
    }
  };

  const handleTicketCategoryChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      ticketCategories: prev.ticketCategories.map((category, i) =>
        i === index ? { ...category, [field]: value } : category
      ),
    }));
  };

  const toggleRefundPolicy = () => {
    setForm((prev) => ({
      ...prev,
      useDefaultRefundPolicy: !prev.useDefaultRefundPolicy,
    }));
  };

  const handleCustomRefundPolicyChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      customRefundPolicy: {
        ...prev.customRefundPolicy,
        [field]: field === 'description' ? value : Math.min(100, Math.max(0, parseInt(value) || 0)),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate required fields
    if (!form.venue) {
      toast.error("Please select a venue using the map");
      setSubmitting(false);
      return;
    }

    if (!form.city.trim()) {
      toast.error("Please enter a city");
      setSubmitting(false);
      return;
    }

    // Validate refund policy if custom is selected
    if (!form.useDefaultRefundPolicy) {
      const { sevenDaysOrMore, oneToDays, lessThanDay } = form.customRefundPolicy;
      
      if (sevenDaysOrMore < 0 || sevenDaysOrMore > 100 ||
          oneToDays < 0 || oneToDays > 100 ||
          lessThanDay < 0 || lessThanDay > 100) {
        toast.error("Refund percentages must be between 0 and 100");
        setSubmitting(false);
        return;
      }
    }

    // Validate pricing structure
    if (form.hasTicketCategories) {
      // Validate ticket categories
      const validCategories = form.ticketCategories.filter(
        (cat) => cat.name.trim() && cat.price && cat.totalSeats
      );

      if (validCategories.length === 0) {
        toast.error("At least one complete ticket category is required");
        setSubmitting(false);
        return;
      }

      // Check for duplicate category names
      const categoryNames = validCategories.map((cat) =>
        cat.name.trim().toLowerCase()
      );
      const uniqueNames = new Set(categoryNames);
      if (categoryNames.length !== uniqueNames.size) {
        toast.error("Ticket category names must be unique");
        setSubmitting(false);
        return;
      }

      // Validate each category
      for (const category of validCategories) {
        const price = Number(category.price);
        const totalSeats = Number(category.totalSeats);

        if (isNaN(price) || price < 0) {
          toast.error(
            `Price for "${category.name}" must be a non-negative number`
          );
          setSubmitting(false);
          return;
        }

        if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
          toast.error(
            `Total seats for "${category.name}" must be a positive integer`
          );
          setSubmitting(false);
          return;
        }
      }
    } else {
      // Validate legacy pricing
      const totalSeats = Number(form.totalSeats);
      const price = Number(form.price);

      if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
        toast.error("Total seats must be a positive integer");
        setSubmitting(false);
        return;
      }

      if (isNaN(price) || price < 0) {
        toast.error("Price must be a non-negative number");
        setSubmitting(false);
        return;
      }
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add all form fields
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("date", form.date);
      formData.append("categoryId", form.categoryId);
      formData.append("city", form.city);
      formData.append("venue", JSON.stringify(form.venue));
      formData.append("hasTicketCategories", form.hasTicketCategories);
      
      // Add refund policy data
      formData.append("useDefaultRefundPolicy", form.useDefaultRefundPolicy);
      if (!form.useDefaultRefundPolicy && form.customRefundPolicy) {
        formData.append("customRefundPolicy", JSON.stringify(form.customRefundPolicy));
      }

      if (form.hasTicketCategories) {
        const validCategories = form.ticketCategories.filter(
          (cat) => cat.name.trim() && cat.price && cat.totalSeats
        );
        formData.append("ticketCategories", JSON.stringify(validCategories));
      } else {
        formData.append("price", form.price);
        formData.append("totalSeats", form.totalSeats);
      }

      // Add file if selected
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      if (isEditing) {
        const res = await apiClient.patch(`/events/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        if (res.data?.message) {
          toast.success(res.data.message);
        } else {
          toast.success("Event updated successfully");
        }
      } else {
        await apiClient.post("/events", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Event created successfully");
      }
      navigate("/organizer");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (isEditing) fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="bg-bg-primary border border-border p-8 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-b-2 border-primary rounded-full border-t-transparent animate-spin"></div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Loading event form...
              </h2>
              <p className="text-text-secondary">
                Please wait while we fetch the event data
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Verification Notice */}
        <VerificationNotice />
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/organizer")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Organizer Dashboard
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-lg">
              <Calendar className="w-6 h-6 text-bg-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                {isEditing ? "Edit Event" : "Create New Event"}
              </h1>
              <p className="mt-1 text-text-secondary">
                {isEditing
                  ? "Update your event details and venue information"
                  : "Fill in the details to create your event"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-bg-primary border-2 border-border overflow-hidden rounded-lg">
          <form onSubmit={handleSubmit}>
            {/* Form Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Event Title */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Event Title
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="w-5 h-5 text-text-secondary" />
                      </div>
                      <input
                        type="text"
                        name="title"
                        placeholder="Enter event title"
                        className="block w-full pl-10 pr-4 py-3 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary transition-colors rounded-lg cursor-pointer"
                        value={form.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Event Description */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Description
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <Tag className="w-5 h-5 text-text-secondary" />
                      </div>
                      <textarea
                        name="description"
                        placeholder="Describe your event..."
                        rows={4}
                        className="block w-full pl-10 pr-4 py-3 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary transition-colors resize-none rounded-lg cursor-pointer"
                        value={form.description}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Event Date & Time
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="w-5 h-5 text-text-secondary" />
                      </div>
                      <input
                        type="datetime-local"
                        name="date"
                        className="block w-full pl-10 pr-4 py-3 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary transition-colors rounded-lg cursor-pointer"
                        value={form.date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="w-5 h-5 text-text-secondary" />
                      </div>
                      <select
                        name="categoryId"
                        className="block w-full pl-10 pr-4 py-3 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary transition-colors appearance-none rounded-lg cursor-pointer"
                        value={form.categoryId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-text-secondary" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      City
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        name="city"
                        placeholder="Enter city name"
                        className="block w-full pl-10 pr-4 py-3 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary transition-colors rounded-lg cursor-pointer"
                        value={form.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Pricing Type Toggle */}
                  <div className="col-span-2">
                    <div className="bg-bg-secondary p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            checked={!form.hasTicketCategories}
                            onChange={() =>
                              setForm((prev) => ({
                                ...prev,
                                hasTicketCategories: false,
                              }))
                            }
                            className="mr-2 text-primary cursor-pointer"
                          />
                          <span className="text-sm font-medium text-text-primary">
                            Simple Pricing (One price for all tickets)
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            checked={form.hasTicketCategories}
                            onChange={toggleTicketCategories}
                            className="mr-2 text-primary cursor-pointer"
                          />
                          <span className="text-sm font-medium text-text-primary">
                            Multiple Ticket Categories
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {!form.hasTicketCategories ? (
                    <>
                      {/* Price */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          Ticket Price (₹)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-text-secondary font-bold">₹</span>
                          </div>
                          <input
                            type="number"
                            name="price"
                            placeholder="0.00"
                            className="block w-full pl-10 pr-4 py-3 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary transition-colors rounded-lg cursor-pointer"
                            value={form.price}
                            onChange={handleChange}
                            min={0}
                            step="0.01"
                            required={!form.hasTicketCategories}
                          />
                        </div>
                      </div>

                      {/* Total Seats */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          Total Seats
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Users className="w-5 h-5 text-text-secondary" />
                          </div>
                          <input
                            type="number"
                            name="totalSeats"
                            placeholder="Enter number of seats"
                            className="block w-full pl-10 pr-4 py-3 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary transition-colors rounded-lg cursor-pointer"
                            value={form.totalSeats}
                            onChange={handleChange}
                            min={1}
                            required={!form.hasTicketCategories}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Ticket Categories */}
                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-semibold text-text-primary">
                            Ticket Categories
                          </label>
                          <button
                            type="button"
                            onClick={addTicketCategory}
                            disabled={form.ticketCategories.length >= 5}
                            className="inline-flex items-center px-3 py-1 bg-primary text-bg-primary text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 rounded-lg cursor-pointer"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Category
                          </button>
                        </div>

                        <div className="space-y-4">
                          {form.ticketCategories.map((category, index) => (
                            <div
                              key={index}
                              className="bg-bg-secondary p-4 border border-border rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-text-primary">
                                  Category {index + 1}
                                </h4>
                                {form.ticketCategories.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTicketCategory(index)}
                                    className="text-error hover:text-error/80 transition-colors duration-200 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-text-secondary mb-1">
                                    Category Name *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g., VIP, Regular, Student"
                                    value={category.name}
                                    onChange={(e) =>
                                      handleTicketCategoryChange(
                                        index,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-bg-primary rounded-lg cursor-pointer"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-text-secondary mb-1">
                                    Price (₹) *
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="0.00"
                                    value={category.price}
                                    onChange={(e) =>
                                      handleTicketCategoryChange(
                                        index,
                                        "price",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-bg-primary rounded-lg cursor-pointer"
                                    min={0}
                                    step="0.01"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-text-secondary mb-1">
                                    Available Seats *
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={category.totalSeats}
                                    onChange={(e) =>
                                      handleTicketCategoryChange(
                                        index,
                                        "totalSeats",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-bg-primary rounded-lg cursor-pointer"
                                    min={1}
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-text-secondary mb-1">
                                    Description
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Optional description"
                                    value={category.description}
                                    onChange={(e) =>
                                      handleTicketCategoryChange(
                                        index,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-bg-primary rounded-lg cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-text-secondary mt-2">
                          You can create up to 5 different ticket categories
                          with different prices and seat allocations.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Event Image
                    </label>

                    {/* File Input */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors bg-bg-secondary hover:bg-bg-secondary/80 rounded-lg"
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                          <p className="text-sm text-text-secondary">
                            Click to upload an image
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            PNG, JPG, JPEG up to 5MB
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-4 relative">
                        <div className="relative w-full h-48 overflow-hidden bg-bg-secondary border border-border rounded-lg">
                          <img
                            src={imagePreview}
                            alt="Event preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 w-8 h-8 bg-error text-bg-primary rounded-full flex items-center justify-center hover:bg-error/90 transition-colors duration-200 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-text-secondary mt-2">
                          {selectedFile
                            ? `Selected: ${selectedFile.name}`
                            : "Current event image"}
                        </p>
                      </div>
                    )}

                    <p className="text-sm text-text-secondary mt-2">
                      Optional: Add an image for your event
                    </p>
                  </div>
                </div>
              </div>

              {/* Refund Policy Section - Full Width */}
              <div className="mt-8">
                <div className="bg-bg-secondary border border-border p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-bg-secondary border border-border flex items-center justify-center rounded-lg">
                      <span className="text-primary font-bold text-lg">₹</span>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      Refund Policy
                    </h3>
                  </div>

                  {/* Policy Type Toggle */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="refundPolicy"
                        checked={form.useDefaultRefundPolicy}
                        onChange={() => setForm(prev => ({ ...prev, useDefaultRefundPolicy: true }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center ${
                        form.useDefaultRefundPolicy ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {form.useDefaultRefundPolicy && (
                          <div className="w-2 h-2 bg-bg-primary rounded-full"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        Use Default Policy
                      </span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="refundPolicy"
                        checked={!form.useDefaultRefundPolicy}
                        onChange={() => setForm(prev => ({ ...prev, useDefaultRefundPolicy: false }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center ${
                        !form.useDefaultRefundPolicy ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {!form.useDefaultRefundPolicy && (
                          <div className="w-2 h-2 bg-bg-primary rounded-full"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        Custom Policy
                      </span>
                    </label>
                  </div>

                  {/* Default Policy Display */}
                  {form.useDefaultRefundPolicy ? (
                    <div className="bg-bg-primary p-4 border border-border rounded-lg">
                      <h4 className="text-sm font-semibold text-text-primary mb-3">
                        Default Refund Policy:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-text-secondary">
                        <div className="flex justify-between sm:flex-col sm:items-center sm:text-center">
                          <span className="sm:mb-1">7+ days before event:</span>
                          <span className="font-medium text-success">100% refund</span>
                        </div>
                        <div className="flex justify-between sm:flex-col sm:items-center sm:text-center">
                          <span className="sm:mb-1">1-7 days before event:</span>
                          <span className="font-medium text-warning">50% refund</span>
                        </div>
                        <div className="flex justify-between sm:flex-col sm:items-center sm:text-center">
                          <span className="sm:mb-1">Less than 24 hours:</span>
                          <span className="font-medium text-error">No refund</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Custom Policy Form */
                    <div className="bg-bg-primary p-4 border border-border space-y-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-text-primary mb-3">
                        Custom Refund Policy:
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            7+ Days Before Event (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.customRefundPolicy.sevenDaysOrMore}
                            onChange={(e) => handleCustomRefundPolicyChange('sevenDaysOrMore', e.target.value)}
                            className="w-full px-3 py-2 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-bg-primary rounded-lg cursor-pointer"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            1-7 Days Before Event (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.customRefundPolicy.oneToDays}
                            onChange={(e) => handleCustomRefundPolicyChange('oneToDays', e.target.value)}
                            className="w-full px-3 py-2 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-bg-primary rounded-lg cursor-pointer"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Less Than 24 Hours (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.customRefundPolicy.lessThanDay}
                            onChange={(e) => handleCustomRefundPolicyChange('lessThanDay', e.target.value)}
                            className="w-full px-3 py-2 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-bg-primary rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          Policy Description (Optional)
                        </label>
                        <textarea
                          value={form.customRefundPolicy.description}
                          onChange={(e) => handleCustomRefundPolicyChange('description', e.target.value)}
                          placeholder="Describe your refund policy in detail..."
                          className="w-full px-3 py-2 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-bg-primary rounded-lg cursor-pointer"
                          rows="3"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Venue Selector - Full Width */}
              <div className="mt-8">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Venue Location
                </label>
                <div className="bg-bg-secondary border border-border p-4 rounded-lg">
                  <VenueSelector
                    onVenueSelect={handleVenueSelect}
                    selectedVenue={form.venue}
                    city={form.city}
                  />
                </div>
                <p className="text-sm text-text-secondary mt-2">
                  Click on the map to select your event venue location
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-6 bg-bg-secondary border-t border-border">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/organizer")}
                  className="flex-1 bg-bg-primary border border-border text-text-secondary py-3 px-6 font-semibold hover:bg-bg-secondary transition-colors rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-bg-primary py-3 px-6 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-lg cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-b-2 border-bg-primary rounded-full border-t-transparent animate-spin"></div>
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {isEditing ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {isEditing ? "Update Event" : "Create Event"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
