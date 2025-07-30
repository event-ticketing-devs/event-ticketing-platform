import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const VenueSelector = ({ onVenueSelect, selectedVenue, city }) => {
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places"],
        });

        await loader.load();
        const google = window.google;

        // Default center (India)
        let center = { lat: 28.6139, lng: 77.209 };

        // Try to geocode city if provided
        if (city) {
          try {
            const geocoder = new google.maps.Geocoder();
            const geocodeResult = await new Promise((resolve, reject) => {
              geocoder.geocode({ address: city }, (results, status) => {
                if (status === "OK" && results[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error("City not found"));
                }
              });
            });
            center = geocodeResult.geometry.location.toJSON();
          } catch (err) {
            console.log("Could not geocode city, using default center");
          }
        }

        // Initialize map
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom: city ? 13 : 6,
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "on" }],
            },
          ],
        });

        // Initialize search box
        const searchBoxInstance = new google.maps.places.SearchBox(
          inputRef.current
        );

        // Bias search results to map viewport
        mapInstance.addListener("bounds_changed", () => {
          searchBoxInstance.setBounds(mapInstance.getBounds());
        });

        // Listen for place selection
        searchBoxInstance.addListener("places_changed", () => {
          const places = searchBoxInstance.getPlaces();
          if (places.length === 0) return;

          const place = places[0];

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

          // Update map view
          mapInstance.setCenter(place.geometry.location);
          mapInstance.setZoom(16);

          // Extract venue data
          const venueData = {
            name: place.name || "Selected Venue",
            address:
              place.formatted_address ||
              place.vicinity ||
              "Address not available",
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
            placeId: place.place_id,
          };

          setMarker(newMarker);
          onVenueSelect(venueData);
        });

        // Allow clicking on map to select location
        mapInstance.addListener("click", (event) => {
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

          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: clickedLocation }, (results, status) => {
            if (status === "OK" && results[0]) {
              const venueData = {
                name: results[0].name || "Custom Location",
                address: results[0].formatted_address,
                coordinates: {
                  lat: clickedLocation.lat(),
                  lng: clickedLocation.lng(),
                },
                placeId: results[0].place_id,
              };
              onVenueSelect(venueData);
            }
          });

          setMarker(newMarker);
        });

        setMap(mapInstance);
        setSearchBox(searchBoxInstance);
        setLoading(false);
      } catch (err) {
        setError("Failed to load Google Maps. Please check your API key.");
        setLoading(false);
      }
    };

    initializeMap();
  }, []);

  // Update map when city changes
  useEffect(() => {
    if (map && city) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: city }, (results, status) => {
        if (status === "OK") {
          map.setCenter(results[0].geometry.location);
          map.setZoom(13);
        }
      });
    }
  }, [city, map]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search for Venue *
        </label>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for venues, restaurants, halls, or click on the map..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          You can also click directly on the map to select a location
        </p>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-md z-10">
            <div className="text-blue-600">Loading map...</div>
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full h-80 border border-gray-300 rounded-md"
        />
      </div>

      {selectedVenue && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-md">
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-1">📍</span>
            <div>
              <h4 className="font-semibold text-green-900">
                {selectedVenue.name}
              </h4>
              <p className="text-green-700 text-sm">{selectedVenue.address}</p>
              <p className="text-xs text-green-600 mt-1">
                Coordinates: {selectedVenue.coordinates.lat.toFixed(6)},{" "}
                {selectedVenue.coordinates.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueSelector;
