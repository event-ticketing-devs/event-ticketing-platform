import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader } from "@googlemaps/js-api-loader";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

const VenueEdit = () => {
  const navigate = useNavigate();
  const { venueId } = useParams();
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    city: "",
    fullAddress: "",
    location: {
      coordinates: {
        lat: null,
        lng: null,
      },
      placeId: "",
    },
    parking: {
      available: false,
      notes: ""
    },
    primaryContact: {
      name: "",
      phone: "",
      email: "",
    },
    teamMembers: [],
    isListed: true,
  });

  const [teamMemberEmail, setTeamMemberEmail] = useState("");

  useEffect(() => {
    fetchVenueData();
  }, [venueId]);

  useEffect(() => {
    if (form.location?.coordinates?.lat && form.location?.coordinates?.lng) {
      initializeMap();
    }
  }, [form.location]);

  const fetchVenueData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/venues/${venueId}`);
      const venue = res.data;
      
      setForm({
        name: venue.name || "",
        city: venue.city || "",
        fullAddress: venue.fullAddress || "",
        location: venue.location || {
          coordinates: { lat: null, lng: null },
          placeId: "",
        },
        parking: venue.parking || {
          available: false,
          notes: ""
        },
        primaryContact: venue.primaryContact || {
          name: "",
          phone: "",
          email: "",
        },
        teamMembers: venue.teamMembers || [],
        isListed: venue.isListed !== undefined ? venue.isListed : true,
      });

      // Set photo preview if exists
      if (venue.photo) {
        setImagePreview(venue.photo);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load venue");
      navigate("/venue-partner");
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    if (!form.location?.coordinates?.lat) return;

    try {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"],
      });

      await loader.load();
      const google = window.google;

      const center = {
        lat: form.location.coordinates.lat,
        lng: form.location.coordinates.lng,
      };

      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
      });

      setMap(mapInstance);

      // Add initial marker
      const initialMarker = new google.maps.Marker({
        position: center,
        map: mapInstance,
        title: form.name,
      });
      setMarker(initialMarker);

      // Initialize autocomplete
      const searchBox = new google.maps.places.SearchBox(inputRef.current);
      mapInstance.controls[google.maps.ControlPosition.TOP_LEFT].push(inputRef.current);

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        if (marker) {
          marker.setMap(null);
        }

        const newMarker = new google.maps.Marker({
          position: place.geometry.location,
          map: mapInstance,
          title: place.name,
          animation: google.maps.Animation.DROP,
        });

        setMarker(newMarker);

        const location = place.geometry.location;
        const cityComponent = place.address_components?.find(
          (comp) =>
            comp.types.includes("locality") || comp.types.includes("administrative_area_level_2")
        );

        setForm((prev) => ({
          ...prev,
          fullAddress: place.formatted_address || "",
          city: cityComponent?.long_name || prev.city,
          location: {
            coordinates: {
              lat: location.lat(),
              lng: location.lng(),
            },
            placeId: place.place_id || "",
          },
        }));

        mapInstance.panTo(location);
        mapInstance.setZoom(15);
      });

      mapInstance.addListener("click", async (event) => {
        const clickedLocation = event.latLng;

        if (marker) {
          marker.setMap(null);
        }

        const newMarker = new google.maps.Marker({
          position: clickedLocation,
          map: mapInstance,
          title: "Selected Location",
          animation: google.maps.Animation.DROP,
        });

        setMarker(newMarker);

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: clickedLocation }, (results, status) => {
          if (status === "OK" && results[0]) {
            const cityComponent = results[0].address_components?.find(
              (comp) =>
                comp.types.includes("locality") || comp.types.includes("administrative_area_level_2")
            );

            setForm((prev) => ({
              ...prev,
              fullAddress: results[0].formatted_address,
              city: cityComponent?.long_name || prev.city,
              location: {
                coordinates: {
                  lat: clickedLocation.lat(),
                  lng: clickedLocation.lng(),
                },
                placeId: results[0].place_id || "",
              },
            }));
          }
        });
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to load map");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addTeamMember = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!teamMemberEmail.trim()) {
      return toast.error("Email cannot be empty");
    }
    if (!emailRegex.test(teamMemberEmail)) {
      return toast.error("Invalid email format");
    }
    if (form.teamMembers.includes(teamMemberEmail)) {
      return toast.error("Team member already added");
    }
    
    setForm((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, teamMemberEmail.trim()],
    }));
    setTeamMemberEmail("");
  };

  const removeTeamMember = (index) => {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index),
    }));
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) {
      return toast.error("Venue name is required");
    }
    if (!form.city.trim()) {
      return toast.error("City is required");
    }
    if (!form.fullAddress.trim()) {
      return toast.error("Address is required");
    }
    if (!form.location?.coordinates?.lat || !form.location?.coordinates?.lng) {
      return toast.error("Please select a location on the map");
    }
    if (!form.primaryContact.name.trim()) {
      return toast.error("Primary contact name is required");
    }
    if (!form.primaryContact.phone.trim()) {
      return toast.error("Primary contact phone is required");
    }
    if (!/^\d{10}$/.test(form.primaryContact.phone)) {
      return toast.error("Phone must be 10 digits");
    }
    if (!form.primaryContact.email.trim()) {
      return toast.error("Primary contact email is required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.primaryContact.email)) {
      return toast.error("Invalid email format");
    }

    setSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("city", form.city);
      formData.append("fullAddress", form.fullAddress);
      formData.append("location", JSON.stringify(form.location));
      formData.append("parking", JSON.stringify(form.parking));
      formData.append("primaryContact", JSON.stringify(form.primaryContact));
      formData.append("teamMembers", JSON.stringify(form.teamMembers));
      formData.append("isListed", form.isListed);
      
      // Add photo if selected
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      await apiClient.patch(`/venues/${venueId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Venue updated successfully!");
      navigate("/venue-partner");
    } catch (err) {
      console.error("Error updating venue:", err);
      toast.error(err.response?.data?.message || "Failed to update venue");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-lg text-text-secondary">Loading venue data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/venue-partner")}
            className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-text-primary">Edit Venue</h1>
          <p className="text-text-secondary mt-2">Update your venue information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Venue Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  placeholder="E.g., Grand Palace Banquet Hall"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  placeholder="E.g., Mumbai"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Location</h2>
            <p className="text-sm text-text-secondary mb-4">
              Search for your venue or click on the map to select location
            </p>
            
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type to search for your venue location..."
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              />
            </div>

            <div
              ref={mapRef}
              className="w-full h-96 rounded-lg border border-border mb-4"
            ></div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Full Address *
              </label>
              <input
                type="text"
                name="fullAddress"
                value={form.fullAddress}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                placeholder="Full address will be populated when you select a location"
                readOnly
              />
            </div>
          </div>

          {/* Primary Contact */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Primary Contact</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  name="primaryContact.name"
                  value={form.primaryContact.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="primaryContact.phone"
                  value={form.primaryContact.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  placeholder="10-digit number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="primaryContact.email"
                  value={form.primaryContact.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Team Members</h2>
            <p className="text-sm text-text-secondary mb-4">
              Add team members who can manage spaces and respond to enquiries
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={teamMemberEmail}
                onChange={(e) => setTeamMemberEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTeamMember())}
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                placeholder="team@example.com"
              />
              <button
                type="button"
                onClick={addTeamMember}
                className="bg-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>

            {form.teamMembers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.teamMembers.map((email, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeTeamMember(index)}
                      className="text-primary hover:text-primary"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Parking Information */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Parking Information</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.parking.available}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    parking: { ...prev.parking, available: e.target.checked }
                  }))}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-text-primary">Parking available</span>
              </label>
              
              {form.parking.available && (
                <textarea
                  value={form.parking.notes}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    parking: { ...prev.parking, notes: e.target.value }
                  }))}
                  rows={3}
                  placeholder="Describe parking facilities (e.g., capacity, valet service, charges)..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                />
              )}
            </div>
          </div>

          {/* Venue Photo */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Venue Photo</h2>
            <div className="space-y-4">
              {!imagePreview ? (
                <div>
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-bg-secondary hover:bg-bg-secondary transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-text-secondary/60"
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
                      <p className="mb-2 text-sm text-text-secondary">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-text-secondary">PNG, JPG or WEBP (MAX. 5MB)</p>
                    </div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Venue preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-error text-bg-primary p-2 rounded-full hover:bg-error/90 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
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
              )}
            </div>
          </div>

          {/* Listing Status */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Listing Status</h2>
            <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
              <div>
                <p className="font-medium text-text-primary">Venue Listed</p>
                <p className="text-sm text-text-secondary mt-1">
                  {form.isListed 
                    ? "Your venue is visible to event organizers" 
                    : "Your venue is hidden from search results"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isListed}
                  onChange={(e) => setForm(prev => ({ ...prev, isListed: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-bg-primary py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-border disabled:cursor-not-allowed text-lg font-semibold"
            >
              {submitting ? "Updating..." : "Update Venue"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/venue-partner")}
              className="px-6 py-3 border border-border rounded-lg hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VenueEdit;
