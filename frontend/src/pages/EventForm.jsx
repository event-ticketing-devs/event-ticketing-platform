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
  const [loading, setLoading] = useState(isEditing);

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

  if (loading)
    return (
      <div className="text-center py-10 text-blue-600 font-semibold">
        Loading event form...
      </div>
    );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border p-8 mt-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">
          {isEditing ? "Edit Event" : "Create Event"}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="title"
            placeholder="Title"
            className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={form.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={form.description}
            onChange={handleChange}
            required
          />
          <input
            type="datetime-local"
            name="date"
            className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={form.date}
            onChange={handleChange}
            required
          />
          <select
            name="categoryId"
            className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={form.categoryId}
            onChange={handleChange}
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
            placeholder="Venue"
            className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={form.venue}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={form.price}
            onChange={handleChange}
            min={0}
            required
          />
          <input
            type="number"
            name="totalSeats"
            placeholder="Total Seats"
            className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={form.totalSeats}
            onChange={handleChange}
            min={1}
            required
          />
          <input
            type="text"
            name="photo"
            placeholder="Image URL"
            className="block w-full border p-3 rounded focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={form.photo}
            onChange={handleChange}
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-6 py-2 rounded-lg shadow hover:from-blue-700 hover:to-teal-500 transition-all font-semibold cursor-pointer"
          >
            {isEditing ? "Update Event" : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
}
