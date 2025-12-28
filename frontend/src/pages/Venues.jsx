import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import { STANDARD_AMENITIES, STANDARD_POLICY_ITEMS, getAmenityLabel, getPolicyItemLabel } from "../constants/venueConstants";
import { useComparison } from "../context/ComparisonContext";

const VenuesPage = () => {
  const { toggleSpace, isSelected, canAddMore } = useComparison();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAmenities, setExpandedAmenities] = useState({});
  const [filters, setFilters] = useState({
    city: "",
    eventType: "",
    minPax: "",
    spaceType: "",
    indoorOutdoor: "",
    startDate: "",
    endDate: "",
    parking: "",
    amenities: [],
    allowedItems: [],
    bannedItems: [],
  });

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle array filters
          if (value.length > 0) {
            params.append(key, value.join(','));
          }
        } else if (value && value.trim() !== "") {
          params.append(key, value.trim());
        }
      });

      const res = await apiClient.get(`/spaces/search?${params.toString()}`);
      setSpaces(res.data);
    } catch (err) {
      console.error("Error fetching spaces:", err);
      setSpaces([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSpaces();
  };

  const clearFilters = () => {
    setFilters({
      city: "",
      eventType: "",
      minPax: "",
      spaceType: "",
      indoorOutdoor: "",
      startDate: "",
      endDate: "",
      parking: "",
      amenities: [],
      allowedItems: [],
      bannedItems: [],
    });
    setTimeout(() => fetchSpaces(), 0);
  };

  const toggleAmenity = (value) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter(a => a !== value)
        : [...prev.amenities, value]
    }));
  };

  const toggleAllowedItem = (value) => {
    setFilters(prev => ({
      ...prev,
      allowedItems: prev.allowedItems.includes(value)
        ? prev.allowedItems.filter(a => a !== value)
        : [...prev.allowedItems, value]
    }));
  };

  const toggleBannedItem = (value) => {
    setFilters(prev => ({
      ...prev,
      bannedItems: prev.bannedItems.includes(value)
        ? prev.bannedItems.filter(a => a !== value)
        : [...prev.bannedItems, value]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Event Spaces</h1>
          <p className="mt-2 text-gray-600">
            Browse and enquire about event spaces at verified venues
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  placeholder="e.g., Bangalore"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Space Type
                </label>
                <select
                  name="spaceType"
                  value={filters.spaceType}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="hall">Hall</option>
                  <option value="lawn">Lawn</option>
                  <option value="auditorium">Auditorium</option>
                  <option value="open-area">Open Area</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indoor/Outdoor
                </label>
                <select
                  name="indoorOutdoor"
                  value={filters.indoorOutdoor}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Capacity
                </label>
                <input
                  type="number"
                  name="minPax"
                  value={filters.minPax}
                  onChange={handleFilterChange}
                  placeholder="e.g., 100"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  name="eventType"
                  value={filters.eventType}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="wedding">Wedding</option>
                  <option value="conference">Conference</option>
                  <option value="concert">Concert</option>
                  <option value="birthday">Birthday</option>
                  <option value="corporate">Corporate</option>
                  <option value="exhibition">Exhibition</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Start Date (Optional)
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event End Date (Optional)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  min={filters.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Additional Filters Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Filters</h3>
              
              {/* Parking Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parking
                </label>
                <select
                  name="parking"
                  value={filters.parking}
                  onChange={handleFilterChange}
                  className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="true">Must Have Parking</option>
                </select>
              </div>

              {/* Amenities Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Amenities (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {STANDARD_AMENITIES.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(value)}
                        onChange={() => toggleAmenity(value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Allowed Items Filter */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Must be allowed (select all that apply)
                  </label>
                  <span 
                    className="inline-flex items-center justify-center w-4 h-4 text-xs text-gray-500 border border-gray-400 rounded-full cursor-help" 
                    title="Show venues who have explicitly allowed this."
                  >
                    ⓘ
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STANDARD_POLICY_ITEMS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={filters.allowedItems.includes(value)}
                        onChange={() => toggleAllowedItem(value)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Banned Items Filter */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Must not be restricted (select all that apply)
                  </label>
                  <span 
                    className="inline-flex items-center justify-center w-4 h-4 text-xs text-gray-500 border border-gray-400 rounded-full cursor-help" 
                    title="Hide venues who have explicitly restricted this."
                  >
                    ⓘ
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STANDARD_POLICY_ITEMS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={filters.bannedItems.includes(value)}
                        onChange={() => toggleBannedItem(value)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading spaces...</p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No spaces found</h3>
            <p className="mt-2 text-gray-600">
              Try adjusting your search filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
            {spaces.map((space) => {
              const selected = isSelected(space._id);
              const disabled = !selected && !canAddMore;
              
              return (
                <div key={space._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
                  {/* Compare Checkbox */}
                  <div className="absolute top-4 right-4 z-10">
                    <label className={`flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={disabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSpace(space);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-sm font-medium text-gray-700">Compare</span>
                    </label>
                  </div>

                  <Link
                    to={`/venues/${space.venue._id}`}
                    className="block p-6"
                  >
                    {/* Space Photos */}
                    {space.photos && space.photos.length > 0 && (
                      <div className="mb-4 -mx-6 -mt-6">
                        <img
                          src={space.photos[0]}
                          alt={space.name}
                          className="w-full h-48 object-cover"
                        />
                        {space.photos.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            +{space.photos.length - 1} photos
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2 pr-24">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {space.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          at {space.venue.name}
                        </p>
                      </div>
                      <div className="ml-2 flex flex-col gap-1 items-end">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                        {filters.startDate && filters.endDate && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            space.isAvailableForDates === false
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {space.isAvailableForDates === false ? "Unavailable" : "Available"}
                          </span>
                        )}
                      </div>
                    </div>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
                    {space.venue.city}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium capitalize">{space.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Setting:</span>
                      <p className="font-medium capitalize">{space.indoorOutdoor}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Capacity:</span>
                      <p className="font-medium">{space.maxPax} guests</p>
                    </div>
                    {space.areaSqFt && (
                      <div>
                        <span className="text-gray-600">Area:</span>
                        <p className="font-medium">{space.areaSqFt} sq ft</p>
                      </div>
                    )}
                  </div>

                  {space.supportedEventTypes && space.supportedEventTypes.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-600">Event Types: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {space.supportedEventTypes.map((type, idx) => {
                          const displayName = type.startsWith("other:") 
                            ? type.substring(6)
                            : type.charAt(0).toUpperCase() + type.slice(1);
                          return (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs"
                            >
                              {displayName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {space.amenities && space.amenities.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs text-gray-600">Amenities: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(expandedAmenities[space._id] ? space.amenities : space.amenities.slice(0, 3)).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                        {space.amenities.length > 3 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedAmenities(prev => ({
                                ...prev,
                                [space._id]: !prev[space._id]
                              }));
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {expandedAmenities[space._id] 
                              ? 'Show less' 
                              : `+${space.amenities.length - 3} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
                      View Venue Details →
                    </span>
                  </div>
                </Link>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenuesPage;
