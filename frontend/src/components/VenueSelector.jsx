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
      <div className="bg-white border border-red-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Map Loading Error
        </h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Input Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-900 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Search for Venue
            </h3>
            <p className="text-slate-600 text-sm">
              Find venues, restaurants, halls, or click on the map
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for venues, restaurants, halls..."
            className="w-full pl-12 pr-4 py-4 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-transparent bg-white text-slate-700 font-medium placeholder-slate-400"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
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
        </div>

        <div className="mt-3 bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-slate-800 font-medium text-sm">Pro Tip</p>
              <p className="text-slate-700 text-sm">
                You can also click directly on the map to select any location
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative overflow-hidden border-2 border-slate-200">
        {loading && (
          <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
            <div className="bg-white border border-slate-200 p-6 text-center">
              <div className="w-12 h-12 bg-slate-900 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white animate-spin"
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
              <p className="text-slate-700 font-medium">
                Loading interactive map...
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Setting up venue selection
              </p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-80" />
      </div>

      {/* Selected Venue Card */}
      {selectedVenue && (
        <div className="bg-slate-50 border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-900 flex items-center justify-center flex-shrink-0">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-xl font-bold text-slate-800">
                  {selectedVenue.name}
                </h4>
                <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-xs font-medium">
                  Selected
                </span>
              </div>

              <div className="flex items-start gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0"
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
                <p className="text-slate-700 leading-relaxed">
                  {selectedVenue.address}
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <span className="text-slate-700 font-medium text-sm">
                    Coordinates:
                  </span>
                  <span className="text-slate-600 text-sm font-mono">
                    {selectedVenue.coordinates.lat.toFixed(6)},{" "}
                    {selectedVenue.coordinates.lng.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueSelector;
