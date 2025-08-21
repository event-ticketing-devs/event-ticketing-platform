import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import VenueSelector from "../components/VenueSelector";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full animate-spin">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Loading event form...
              </h2>
              <p className="text-slate-600">
                Please wait while we fetch the event data
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/organizer")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-6"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Organizer Dashboard
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                {isEditing ? "Edit Event" : "Create New Event"}
              </h1>
              <p className="text-slate-600">
                {isEditing
                  ? "Update your event details and venue information"
                  : "Fill in the details to create your event"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Form Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Event Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Event Title
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="title"
                        placeholder="Enter event title"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 transition-all duration-200"
                        value={form.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Event Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Description
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <textarea
                        name="description"
                        placeholder="Describe your event..."
                        rows={4}
                        className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 transition-all duration-200 resize-none"
                        value={form.description}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Event Date & Time
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <input
                        type="datetime-local"
                        name="date"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 transition-all duration-200"
                        value={form.date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                      <select
                        name="categoryId"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 transition-all duration-200 appearance-none"
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
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
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
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="city"
                        placeholder="Enter city name"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 transition-all duration-200"
                        value={form.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Pricing Type Toggle */}
                  <div className="col-span-2">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
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
                            className="mr-2 text-blue-600"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            Simple Pricing (One price for all tickets)
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            checked={form.hasTicketCategories}
                            onChange={toggleTicketCategories}
                            className="mr-2 text-blue-600"
                          />
                          <span className="text-sm font-medium text-slate-700">
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
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Ticket Price (₹)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400 font-bold">₹</span>
                          </div>
                          <input
                            type="number"
                            name="price"
                            placeholder="0.00"
                            className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 transition-all duration-200"
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
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Total Seats
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                              className="w-5 h-5 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                          <input
                            type="number"
                            name="totalSeats"
                            placeholder="Enter number of seats"
                            className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 transition-all duration-200"
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
                          <label className="block text-sm font-semibold text-slate-800">
                            Ticket Categories
                          </label>
                          <button
                            type="button"
                            onClick={addTicketCategory}
                            disabled={form.ticketCategories.length >= 5}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Add Category
                          </button>
                        </div>

                        <div className="space-y-4">
                          {form.ticketCategories.map((category, index) => (
                            <div
                              key={index}
                              className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-slate-700">
                                  Category {index + 1}
                                </h4>
                                {form.ticketCategories.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTicketCategory(index)}
                                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
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
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    min={0}
                                    step="0.01"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    min={1}
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-slate-500 mt-2">
                          You can create up to 5 different ticket categories
                          with different prices and seat allocations.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
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
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors duration-200 bg-slate-50 hover:bg-blue-50"
                      >
                        <div className="text-center">
                          <svg
                            className="w-8 h-8 text-slate-400 mx-auto mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm text-slate-600">
                            Click to upload an image
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            PNG, JPG, JPEG up to 5MB
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-4 relative">
                        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100">
                          <img
                            src={imagePreview}
                            alt="Event preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
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
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                          {selectedFile
                            ? `Selected: ${selectedFile.name}`
                            : "Current event image"}
                        </p>
                      </div>
                    )}

                    <p className="text-sm text-slate-500 mt-2">
                      Optional: Add an image for your event
                    </p>
                  </div>
                </div>
              </div>

              {/* Venue Selector - Full Width */}
              <div className="mt-8">
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Venue Location
                </label>
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-4">
                  <VenueSelector
                    onVenueSelect={handleVenueSelect}
                    selectedVenue={form.venue}
                    city={form.city}
                  />
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  Click on the map to select your event venue location
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/organizer")}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-teal-600 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
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
                          d={
                            isEditing
                              ? "M5 13l4 4L19 7"
                              : "M12 6v6m0 0v6m0-6h6m-6 0H6"
                          }
                        />
                      </svg>
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
