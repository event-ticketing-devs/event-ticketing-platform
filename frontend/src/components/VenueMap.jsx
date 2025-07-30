import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const VenueMap = ({ venue, height = "300px", showDirections = true }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!venue || !venue.coordinates) return;

    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places"],
        });

        await loader.load();
        const google = window.google;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: venue.coordinates,
          zoom: 15,
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "on" }],
            },
          ],
        });

        // Add marker for the venue
        new google.maps.Marker({
          position: venue.coordinates,
          map: mapInstance,
          title: venue.name,
          animation: google.maps.Animation.DROP,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new google.maps.Size(32, 32),
          },
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${venue.name}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${venue.address}</p>
            </div>
          `,
        });

        const marker = new google.maps.Marker({
          position: venue.coordinates,
          map: mapInstance,
          title: venue.name,
        });

        marker.addListener("click", () => {
          infoWindow.open(mapInstance, marker);
        });

        // Auto-open info window
        setTimeout(() => {
          infoWindow.open(mapInstance, marker);
        }, 1000);

        setMap(mapInstance);
        setLoading(false);
      } catch (err) {
        setError("Failed to load map");
        setLoading(false);
      }
    };

    initializeMap();
  }, [venue]);

  const openInGoogleMaps = () => {
    if (venue && venue.coordinates) {
      const url = `https://www.google.com/maps/search/?api=1&query=${venue.coordinates.lat},${venue.coordinates.lng}`;
      window.open(url, "_blank");
    }
  };

  const getDirections = () => {
    if (venue && venue.coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates.lat},${venue.coordinates.lng}`;
      window.open(url, "_blank");
    }
  };

  if (!venue || !venue.coordinates) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
        <p className="text-gray-500">Venue location not available</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-md z-10">
            <div className="text-blue-600">Loading map...</div>
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full border border-gray-300 rounded-md"
          style={{ height }}
        />
      </div>

      {showDirections && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={openInGoogleMaps}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            🗺️ View on Google Maps
          </button>
          <button
            onClick={getDirections}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            🧭 Get Directions
          </button>
        </div>
      )}

      <div className="bg-gray-50 p-3 rounded-md">
        <h4 className="font-semibold text-gray-900 mb-1">{venue.name}</h4>
        <p className="text-gray-600 text-sm">{venue.address}</p>
      </div>
    </div>
  );
};

export default VenueMap;
