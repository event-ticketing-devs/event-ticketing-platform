import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { useComparison } from "../../../context/ComparisonContext";
import { Search, X, RotateCcw, ArrowUpDown, Sliders, Building2, MapPin, ChevronRight, CheckCircle2 } from "lucide-react";
import { STANDARD_AMENITIES, STANDARD_POLICY_ITEMS } from "../../../constants/venueConstants";

const VenuesPage = () => {
  const { toggleSpace, isSelected, canAddMore } = useComparison();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAmenities, setExpandedAmenities] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // For sorting by name
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12;
  const [filters, setFilters] = useState({
    search: "",
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

      // Add sorting parameters
      params.append('sortBy', 'venue');
      params.append('sortOrder', sortOrder);
      
      // Add pagination parameters
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);

      const res = await apiClient.get(`/spaces/search?${params.toString()}`);
      setSpaces(res.data.spaces || res.data);
      setTotalCount(res.data.total || res.data.length);
    } catch (err) {
      console.error("Error fetching spaces:", err);
      setSpaces([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSpaces();
  }, [filters, sortOrder, currentPage]); // Auto-apply filters when they change

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [filters, sortOrder]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setFilters({
      search: "",
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
    setSortOrder('asc');
    setShowAdvancedFilters(false);
  };

  const hasActiveFilters = () => {
    return filters.parking || 
           filters.amenities.length > 0 || 
           filters.allowedItems.length > 0 || 
           filters.bannedItems.length > 0;
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
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Find Event Spaces</h1>
            <p className="mt-1 text-text-secondary">
              Browse and enquire about event spaces at verified venues
            </p>
          </div>
        </div>

        {/* Filters - Compact Design */}
        <div className="bg-bg-primary border border-border rounded-lg mb-8">
          {/* Search Bar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-text-secondary" />
              </div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by venue name or space name..."
                className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, search: "" })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Main Filters Bar */}
          <div className="p-4 bg-bg-secondary">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Quick Filters */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    placeholder="Enter city"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Event Type</label>
                  <select
                    name="eventType"
                    value={filters.eventType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
                  >
                    <option value="">Select type</option>
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
                    <label className="block text-xs font-medium text-text-secondary mb-1">Space Type</label>
                    <select
                      name="spaceType"
                      value={filters.spaceType}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
                    >
                      <option value="">Select type</option>
                    <option value="hall">Hall</option>
                    <option value="lawn">Lawn</option>
                    <option value="auditorium">Auditorium</option>
                    <option value="open-area">Open Area</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Setting</label>
                    <select
                      name="indoorOutdoor"
                      value={filters.indoorOutdoor}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
                    >
                      <option value="">Any setting</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Capacity</label>
                    <input
                      type="number"
                      name="minPax"
                      value={filters.minPax}
                      onChange={handleFilterChange}
                      placeholder="Min guests"
                      min="1"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 items-end">
                  <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 lg:flex-none px-3 py-1.5 rounded-lg border border-border hover:bg-bg-secondary text-text-primary transition-colors cursor-pointer font-medium text-sm flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={toggleSortOrder}
                  className="flex-1 lg:flex-none px-3 py-1.5 rounded-lg border border-border hover:bg-bg-secondary text-text-primary transition-colors cursor-pointer font-medium text-sm flex items-center justify-center gap-1.5"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex-1 lg:flex-none px-3 py-1.5 rounded-lg border transition-colors cursor-pointer font-medium text-sm flex items-center justify-center gap-1.5 ${
                    hasActiveFilters() 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:bg-bg-secondary text-text-primary'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {showAdvancedFilters ? 'Less' : 'More'}
                  {hasActiveFilters() && !showAdvancedFilters && (
                    <span className="bg-primary text-bg-primary text-xs font-bold px-1.5 rounded-full">
                      {filters.amenities.length + filters.allowedItems.length + filters.bannedItems.length + (filters.parking ? 1 : 0)}
                    </span>
                  )}
                </button>
                </div>
              </div>

              {/* Date Range - Compact Row */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    min={filters.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Active Filters Summary */}
              {!showAdvancedFilters && hasActiveFilters() && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">Active filters:</span>
                  <div className="flex flex-wrap gap-2">
                    {filters.parking && (
                      <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary px-2 py-1 rounded-md text-xs font-medium">
                        Parking
                      </span>
                    )}
                    {filters.amenities.length > 0 && (
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                        {filters.amenities.length} Amenities
                      </span>
                    )}
                    {filters.allowedItems.length > 0 && (
                      <span className="inline-flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded-md text-xs font-medium">
                        {filters.allowedItems.length} Allowed
                      </span>
                    )}
                    {filters.bannedItems.length > 0 && (
                      <span className="inline-flex items-center gap-1 bg-error/10 text-error px-2 py-1 rounded-md text-xs font-medium">
                        {filters.bannedItems.length} Not Restricted
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-text-secondary hover:text-error transition-colors text-xs underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Advanced Filters - Side Panel */}
        {showAdvancedFilters && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-text-primary/50 z-40"
              onClick={() => setShowAdvancedFilters(false)}
            />
            
            {/* Side Panel */}
            <div className="fixed top-0 left-0 h-full w-full sm:w-96 bg-bg-primary shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
              <div className="sticky top-0 bg-primary px-6 py-4 flex items-center justify-between border-b border-primary z-10">
                <h2 className="text-lg font-semibold text-bg-primary">Advanced Filters</h2>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="text-bg-primary hover:text-bg-primary/80 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Parking Filter */}
                <div className="pb-4 border-b border-border">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.parking === "true"}
                      onChange={(e) => setFilters({...filters, parking: e.target.checked ? "true" : ""})}
                      className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer w-5 h-5"
                    />
                    <span className="text-text-primary font-medium group-hover:text-primary transition-colors">Must Have Parking</span>
                  </label>
                </div>

                {/* Amenities Filter */}
                <div className="pb-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Required Amenities</h3>
                  <div className="space-y-2">
                    {STANDARD_AMENITIES.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-3 cursor-pointer hover:bg-bg-secondary p-2 rounded-lg transition-colors group">
                        <input
                          type="checkbox"
                          checked={filters.amenities.includes(value)}
                          onChange={() => toggleAmenity(value)}
                          className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer w-5 h-5"
                        />
                        <span className="text-sm text-text-primary group-hover:text-primary transition-colors">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Allowed Items Filter */}
                <div className="pb-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">Must be Allowed</h3>
                  <p className="text-xs text-text-secondary mb-3">Show only venues that explicitly allow these items</p>
                  <div className="space-y-2">
                    {STANDARD_POLICY_ITEMS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-3 cursor-pointer hover:bg-bg-secondary p-2 rounded-lg transition-colors group">
                        <input
                          type="checkbox"
                          checked={filters.allowedItems.includes(value)}
                          onChange={() => toggleAllowedItem(value)}
                          className="rounded border-border text-success focus:ring-success/20 cursor-pointer w-5 h-5"
                        />
                        <span className="text-sm text-text-primary group-hover:text-success transition-colors">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Banned Items Filter */}
                <div className="pb-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">Must Not be Restricted</h3>
                  <p className="text-xs text-text-secondary mb-3">Hide venues that explicitly restrict these items</p>
                  <div className="space-y-2">
                    {STANDARD_POLICY_ITEMS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-3 cursor-pointer hover:bg-bg-secondary p-2 rounded-lg transition-colors group">
                        <input
                          type="checkbox"
                          checked={filters.bannedItems.includes(value)}
                          onChange={() => toggleBannedItem(value)}
                          className="rounded border-border text-error focus:ring-error/20 cursor-pointer w-5 h-5"
                        />
                        <span className="text-sm text-text-primary group-hover:text-error transition-colors">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-bg-secondary border-t border-border px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="flex-1 bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-semibold"
                >
                  Done
                </button>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 border border-border rounded-lg hover:bg-bg-primary transition-colors cursor-pointer font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          </>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
            {[...Array(12)].map((_, index) => (
              <div
                key={index}
                className="bg-bg-primary border border-border rounded-lg overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-border"></div>
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-border rounded w-3/4"></div>
                  <div className="h-4 bg-border rounded w-1/2"></div>
                  <div className="h-4 bg-border rounded w-2/3"></div>
                  <div className="h-12 bg-border rounded"></div>
                  <div className="h-4 bg-border rounded w-full"></div>
                  <div className="h-4 bg-border rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-12 bg-bg-secondary border border-border rounded-lg">
            <Building2 className="mx-auto h-12 w-12 text-text-secondary/50" />
            <h3 className="mt-4 text-lg font-medium text-text-primary">No spaces found</h3>
            <p className="mt-2 text-text-secondary">
              Try adjusting your search filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
            {spaces.map((space) => {
              const selected = isSelected(space._id);
              const disabled = !selected && !canAddMore;
              
              return (
                <div key={space._id} className="bg-bg-primary border border-border rounded-lg hover:border-primary/30 hover:shadow-md transition-all overflow-hidden relative flex flex-col">
                  {/* Compare Checkbox */}
                  <div className="absolute top-4 right-4 z-10">
                    <label className={`flex items-center gap-2 bg-bg-primary px-3 py-2 rounded-lg shadow-md cursor-pointer border border-border ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-secondary hover:border-primary/30'}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={disabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSpace(space);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-sm font-medium text-text-primary">Compare</span>
                    </label>
                  </div>

                  <Link
                    to={`/venues/${space.venue._id}`}
                    className="p-6 flex flex-col flex-1"
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
                          <div className="absolute top-2 right-2 bg-text-primary/80 text-bg-primary text-xs px-2 py-1 rounded-md">
                            +{space.photos.length - 1} photos
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2 pr-24">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-text-primary">
                          {space.name}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                          at {space.venue.name}
                        </p>
                      </div>
                      <div className="ml-2 flex flex-col gap-1 items-end">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                        {filters.startDate && filters.endDate && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            space.isAvailableForDates === false
                              ? "bg-error/10 text-error border border-error/20"
                              : "bg-success/10 text-success border border-success/20"
                          }`}>
                            {space.isAvailableForDates === false ? "Unavailable" : "Available"}
                          </span>
                        )}
                      </div>
                    </div>
                  
                  <div className="flex items-center text-text-secondary mb-4">
                    <MapPin className="h-5 w-5 mr-2" />
                    {space.venue.city}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <span className="text-text-secondary">Type:</span>
                      <p className="font-medium capitalize text-text-primary">{space.type}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Setting:</span>
                      <p className="font-medium capitalize text-text-primary">{space.indoorOutdoor}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Capacity:</span>
                      <p className="font-medium text-text-primary">{space.maxPax} guests</p>
                    </div>
                    {space.areaSqFt && (
                      <div>
                        <span className="text-text-secondary">Area:</span>
                        <p className="font-medium text-text-primary">{space.areaSqFt} sq ft</p>
                      </div>
                    )}
                  </div>

                  {space.supportedEventTypes && space.supportedEventTypes.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-text-secondary">Event Types: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {space.supportedEventTypes.map((type, idx) => {
                          const displayName = type.startsWith("other:") 
                            ? type.substring(6)
                            : type.charAt(0).toUpperCase() + type.slice(1);
                          return (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-secondary/10 text-secondary rounded-md text-xs border border-secondary/20"
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
                      <span className="text-xs text-text-secondary">Amenities: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(expandedAmenities[space._id] ? space.amenities : space.amenities.slice(0, 3)).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs border border-primary/20"
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
                            className="text-xs text-primary hover:text-primary/80 font-medium cursor-pointer"
                          >
                            {expandedAmenities[space._id] 
                              ? 'Show less' 
                              : `+${space.amenities.length - 3} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-border">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
                      View Venue Details
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </div>
            );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && spaces.length > 0 && totalCount > itemsPerPage && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-border rounded-lg hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1)
                .filter(page => {
                  const totalPages = Math.ceil(totalCount / itemsPerPage);
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  );
                })
                .map((page, idx, arr) => (
                  <div key={page} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2 text-text-secondary">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-bg-primary font-medium'
                          : 'border border-border hover:bg-bg-secondary'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
              className="px-4 py-2 border border-border rounded-lg hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenuesPage;
