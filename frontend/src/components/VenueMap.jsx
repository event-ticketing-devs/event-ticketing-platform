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
      <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-bg-primary border border-border rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-text-secondary"
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
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Location Not Available
        </h3>
        <p className="text-text-secondary">
          Venue location information is not available for this event
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/30 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-bg-primary border border-error rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-error"
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
        <h3 className="text-lg font-semibold text-error mb-2">
          Map Loading Error
        </h3>
        <p className="text-error/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Container */}
      <div className="relative overflow-hidden border border-border rounded-lg">
        {loading && (
          <div className="absolute inset-0 bg-bg-primary flex items-center justify-center z-10">
            <div className="bg-bg-primary border border-border rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-text-primary font-medium">Loading map...</p>
              <p className="text-text-secondary text-sm mt-1">
                Please wait while we load the venue location
              </p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full" style={{ height }} />
      </div>

      {/* Action Buttons */}
      {showDirections && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={openInGoogleMaps}
            className="flex-1 bg-primary hover:bg-primary/90 text-bg-primary px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3"
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            View on Google Maps
          </button>
          <button
            onClick={getDirections}
            className="flex-1 bg-primary hover:bg-primary/90 text-bg-primary px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3"
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
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            Get Directions
          </button>
        </div>
      )}

      {/* Venue Information Card */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-bg-primary border border-border rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-text-primary mb-2">
              {venue.name}
            </h4>
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0"
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
              <p className="text-text-secondary leading-relaxed">{venue.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueMap;
