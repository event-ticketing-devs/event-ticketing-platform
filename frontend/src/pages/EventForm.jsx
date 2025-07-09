import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    categoryId: "",
    venue: "",
    price: "",
    totalSeats: 0,
    photo: "",
  });

  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/categories");
      setCategories(res.data);
    } catch {
      toast.error("Failed to fetch categories");
    }
  };

  const fetchEvent = async () => {
    try {
      const res = await apiClient.get(`/events/${id}`);
      const {
        title,
        description,
        date,
        categoryId,
        venue,
        price,
        totalSeats,
        photo,
      } = res.data;
      setForm({
        title,
        description,
        date: date.slice(0, 16),
        categoryId:
          typeof categoryId === "object" && categoryId !== null
            ? categoryId._id
            : categoryId,
        venue,
        price,
        totalSeats,
        photo,
      });
    } catch {
      toast.error("Failed to fetch event");
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate totalSeats is a positive integer
    const totalSeats = Number(form.totalSeats);
    if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
      toast.error("Total seats must be a positive integer");
      return;
    }
    try {
      const submitForm = { ...form, totalSeats };
      if (isEditing) {
        await apiClient.patch(`/events/${id}`, submitForm);
        toast.success("Event updated");
      } else {
        await apiClient.post("/events", submitForm);
        toast.success("Event created");
      }
      navigate("/organizer");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  useEffect(() => {
    fetchCategories();
    if (isEditing) fetchEvent();
  }, [id]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isEditing ? "Edit Event" : "Create Event"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="datetime-local"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="venue"
          value={form.venue}
          onChange={handleChange}
          placeholder="Venue"
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          name="totalSeats"
          value={form.totalSeats}
          onChange={handleChange}
          placeholder="Total Seats"
          className="w-full p-2 border rounded"
          min={1}
          step={1}
          required
        />
        <input
          type="text"
          name="photo"
          value={form.photo}
          onChange={handleChange}
          placeholder="Photo URL"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {isEditing ? "Update" : "Create"} Event
        </button>
      </form>
    </div>
  );
}
