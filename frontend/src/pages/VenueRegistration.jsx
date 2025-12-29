import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "@googlemaps/js-api-loader";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { Upload, X } from 'lucide-react';

const VenueRegistration = () => {
  const navigate = useNavigate();
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
  });

  useEffect(() => {
    // Small delay to ensure the map container is rendered
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const initializeMap = async () => {
    if (!mapRef.current) {
      console.error("Map container not ready");
      setLoading(false);
      return;
    }

    try {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"],
      });

      await loader.load();
      const google = window.google;

      // Default center (India)
      const center = { lat: 28.6139, lng: 77.209 };

      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
      });

      setMap(mapInstance);

      // Initialize autocomplete
      const searchBox = new google.maps.places.SearchBox(inputRef.current);
      mapInstance.controls[google.maps.ControlPosition.TOP_LEFT].push(inputRef.current);

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        // Clear existing marker
        if (marker) {
          marker.setMap(null);
        }

        // Create new marker
        const newMarker = new google.maps.Marker({
          position: place.geometry.location,
          map: mapInstance,
          title: place.name,
          animation: google.maps.Animation.DROP,
        });

        setMarker(newMarker);

        // Update form with selected location
        const location = place.geometry.location;
        const cityComponent = place.address_components?.find(
          (comp) =>
            comp.types.includes("locality") || comp.types.includes("administrative_area_level_2")
        );

        setForm((prev) => ({
          ...prev,
          name: place.name || prev.name,
          city: cityComponent?.long_name || prev.city,
          fullAddress: place.formatted_address || "",
          location: {
            coordinates: {
              lat: location.lat(),
              lng: location.lng(),
            },
            placeId: place.place_id || "",
          },
        }));

        // Center map
        mapInstance.panTo(location);
        mapInstance.setZoom(15);
      });

      // Allow clicking on map to select location
      mapInstance.addListener("click", async (event) => {
        const clickedLocation = event.latLng;

        // Clear existing marker
        if (marker) {
          marker.setMap(null);
        }

        // Create new marker
        const newMarker = new google.maps.Marker({
          position: clickedLocation,
          map: mapInstance,
          title: "Selected Location",
          animation: google.maps.Animation.DROP,
        });

        setMarker(newMarker);

        // Reverse geocode to get address
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

      setLoading(false);
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to load map");
      setLoading(false);
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
    if (!form.name || !form.city || !form.fullAddress) {
      return toast.error("Please fill in all required venue details");
    }

    if (!form.location.coordinates.lat || !form.location.coordinates.lng) {
      return toast.error("Please select a location on the map");
    }

    if (!form.primaryContact.name || !form.primaryContact.phone || !form.primaryContact.email) {
      return toast.error("Please fill in all primary contact details");
    }

    // Phone validation
    if (!/^\d{10}$/.test(form.primaryContact.phone)) {
      return toast.error("Phone number must be exactly 10 digits");
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primaryContact.email)) {
      return toast.error("Please enter a valid email address");
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
      
      // Add photo if selected
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      const res = await apiClient.post("/venues", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Venue registered successfully! Awaiting admin verification.");
      navigate(`/venue-partner/venues/${res.data._id}/spaces`, { 
        state: { isNewVenue: true } 
      });
    } catch (err) {
      console.error("Error registering venue:", err);
      toast.error(err.response?.data?.message || "Failed to register venue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Register Your Venue</h1>
          <p className="text-text-secondary mt-2">
            Join our platform and start receiving event enquiries
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Location *</h2>
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
            
            <div ref={mapRef} className="w-full h-80 rounded-lg bg-bg-secondary" />

            {form.fullAddress && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium text-text-primary">Selected Address:</p>
                <p className="text-text-primary">{form.fullAddress}</p>
              </div>
            )}
          </div>

          {/* Primary Contact */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Primary Contact *</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  name="primaryContact.name"
                  value={form.primaryContact.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Phone Number * (10 digits)
                </label>
                <input
                  type="tel"
                  name="primaryContact.phone"
                  value={form.primaryContact.phone}
                  onChange={handleChange}
                  pattern="\d{10}"
                  maxLength="10"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="primaryContact.email"
                  value={form.primaryContact.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* Parking Information */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Parking Information</h2>
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
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              )}
            </div>
          </div>

          {/* Venue Photo */}
          <div className="bg-bg-primary border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Venue Photo</h2>
            <div className="space-y-4">
              {!imagePreview ? (
                <div>
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-bg-secondary hover:bg-bg-secondary transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-text-secondary/60" />
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
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-bg-primary py-3 rounded-lg hover:bg-primary/90 disabled:bg-border font-medium"
            >
              {submitting ? "Registering..." : "Register Venue"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/venue-partner")}
              className="px-6 py-3 border border-border rounded-lg hover:bg-bg-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VenueRegistration;
