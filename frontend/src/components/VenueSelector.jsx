import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, Search, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";

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
      <div className="bg-bg-primary border border-error/20 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-error/10 border border-error/20 rounded-lg flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-lg font-semibold text-error mb-2">
          Map Loading Error
        </h3>
        <p className="text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Input Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-bg-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Search for Venue
            </h3>
            <p className="text-text-secondary text-sm">
              Find venues, restaurants, halls, or click on the map
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for venues, restaurants, halls..."
            className="w-full pl-12 pr-4 py-4 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary text-text-primary font-medium placeholder-text-secondary"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <MapPin className="w-5 h-5 text-text-secondary" />
          </div>
        </div>

        <div className="mt-3 bg-secondary/10 border border-secondary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-secondary/20 border border-secondary/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="text-text-primary font-medium text-sm">Pro Tip</p>
              <p className="text-text-secondary text-sm">
                You can also click directly on the map to select any location
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative overflow-hidden border border-border rounded-lg">
        {loading && (
          <div className="absolute inset-0 bg-bg-primary flex items-center justify-center z-10">
            <div className="bg-bg-primary border border-border rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-6 h-6 text-bg-primary animate-spin" />
              </div>
              <p className="text-text-primary font-medium">
                Loading interactive map...
              </p>
              <p className="text-text-secondary text-sm mt-1">
                Setting up venue selection
              </p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-80" />
      </div>

      {/* Selected Venue Card */}
      {selectedVenue && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-bg-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-xl font-bold text-text-primary">
                  {selectedVenue.name}
                </h4>
                <span className="bg-success text-bg-primary px-3 py-1 rounded-md text-xs font-medium">
                  Selected
                </span>
              </div>

              <div className="flex items-start gap-2 mb-3">
                <MapPin className="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                <p className="text-text-primary leading-relaxed">
                  {selectedVenue.address}
                </p>
              </div>

              <div className="bg-bg-primary border border-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-primary font-medium text-sm">
                    Coordinates:
                  </span>
                  <span className="text-text-secondary text-sm font-mono">
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
