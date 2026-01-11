import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { format } from "date-fns";
import { Search, X, RotateCcw, ArrowUpDown, Calendar as CalendarIcon, MapPin } from "lucide-react";

const EventListPage = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 12
  });
  const [filters, setFilters] = useState({
    category: "",
    dateFrom: "",
    dateTo: "",
    city: "",
    minPrice: "",
    maxPrice: "",
    search: "",
  });
  const [sorting, setSorting] = useState({
    sortBy: "date",
    sortOrder: "asc"
  });

  const fetchEvents = async (page = 1) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
      });

      // Add filters if they have values
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          params.append(key, value.trim());
        }
      });

      const res = await apiClient.get(`/events?${params.toString()}`);
      
      // Handle the new paginated response format
      if (res.data.events) {
        setEvents(res.data.events);
        setPagination(res.data.pagination);
      } else {
        // Fallback for old API format
        setEvents(res.data);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setEvents([]);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle sorting changes
  const handleSortChange = (sortBy, sortOrder = "asc") => {
    setSorting({ sortBy, sortOrder });
  };

  // Apply filters and sorting (triggers new API call)
  const applyFiltersAndSort = () => {
    fetchEvents(1); // Reset to page 1 when applying filters
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchEvents(newPage);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      category: "",
      dateFrom: "",
      dateTo: "",
      city: "",
      minPrice: "",
      maxPrice: "",
      search: "",
    });
    setSorting({ sortBy: "date", sortOrder: "asc" });
  };

  // Format event price for display
  const formatEventPrice = (event) => {
    if (event.hasTicketCategories && event.ticketCategories?.length > 0) {
      const prices = event.ticketCategories.map(cat => cat.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} onwards`;
    }
    return `₹${event.price || 0}`;
  };

  // Get unique cities for filter dropdown (from current page of events)
  const cities = Array.from(
    new Set(events.map((e) => e.city).filter(Boolean))
  );

  // Client-side safety: remove past events so UI never shows events with date < now
  const now = new Date();
  const visibleEvents = events.filter((ev) => {
    try {
      // treat invalid/missing dates as hidden
      const d = new Date(ev.date);
      return !isNaN(d.getTime()) && d >= now;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  // Trigger API call when filters or sorting change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvents(1);
    }, 500); // Debounce API calls

    return () => clearTimeout(timeoutId);
  }, [filters, sorting]);

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">All Events</h1>
              <p className="mt-1 text-text-secondary">
                Find and book tickets for concerts, festivals, conferences, and more
              </p>
            </div>
            <Link
              to="/events/create"
              className="inline-flex items-center gap-2 bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium"
            >
              Create Event
            </Link>
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
                placeholder="Search by event name or description..."
                className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => handleFilterChange('search', '')}
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
                  <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Min Price</label>
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Max Price</label>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Sort By</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
                    value={sorting.sortBy}
                    onChange={(e) => handleSortChange(e.target.value, sorting.sortOrder)}
                  >
                    <option value="date">Date</option>
                    <option value="title">Title</option>
                    <option value="city">City</option>
                    <option value="price">Price</option>
                    <option value="createdAt">Created</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 items-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex-1 lg:flex-none px-3 py-1.5 rounded-lg border border-border hover:bg-bg-secondary text-text-primary transition-colors cursor-pointer font-medium text-sm flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => handleSortChange(sorting.sortBy, sorting.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex-1 lg:flex-none px-3 py-1.5 rounded-lg border border-border hover:bg-bg-secondary text-text-primary transition-colors cursor-pointer font-medium text-sm flex items-center justify-center gap-1.5"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sorting.sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </button>
              </div>
            </div>

            {/* Date Range - Compact Row */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">From Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">To Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-primary cursor-pointer"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  min={filters.dateFrom || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="mb-8">
          {loading ? (
            // Loading State
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-bg-secondary border border-border rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-border"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-border rounded w-3/4"></div>
                    <div className="h-3 bg-border rounded w-1/2"></div>
                    <div className="h-10 bg-border rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : visibleEvents.length === 0 ? (
            // No Events State
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 mb-6 bg-bg-secondary rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No events found
              </h3>
              <p className="text-text-secondary mb-6">
                Try adjusting your filters or{" "}
                <button 
                  onClick={resetFilters}
                  className="text-primary hover:text-primary/80 font-medium cursor-pointer"
                >
                  reset them
                </button>{" "}
                to see more events
              </p>
              <Link
                to="/events/create"
                className="inline-flex items-center gap-2 bg-primary text-bg-primary px-5 py-2.5 font-semibold hover:bg-primary/90 transition-colors rounded-lg cursor-pointer"
              >
                Create New Event
              </Link>
            </div>
          ) : (
            // Events Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleEvents.map((event) => (
                <div
                  key={event._id}
                  className="group bg-bg-primary border border-border hover:border-primary/30 rounded-lg overflow-hidden transition-all flex flex-col hover:shadow-md"
                >
                  {/* Event Image */}
                  <div className="relative h-48 bg-bg-secondary overflow-hidden">
                    {event.photo ? (
                      <img
                        src={event.photo}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CalendarIcon className="w-12 h-12 text-text-secondary/30" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    {event.categoryId && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-block bg-bg-primary text-text-primary px-2.5 py-1 text-xs font-medium rounded-md shadow-md">
                          {event.categoryId.name || event.categoryId}
                        </span>
                      </div>
                    )}

                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-block bg-primary text-bg-primary px-2.5 py-1 text-xs font-semibold rounded-md shadow-md">
                        {formatEventPrice(event)}
                      </span>
                    </div>
                  </div>

                  {/* Event Details - flex-1 to grow and push button down */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    
                    {/* Date and Time */}
                    <div className="flex items-center gap-2 text-text-secondary mb-2">
                      <CalendarIcon className="w-4 h-4 text-text-secondary/60" />
                      <span className="text-sm">
                        {format(new Date(event.date), "MMM dd, yyyy 'at' h:mm a")}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-text-secondary mb-4">
                      <MapPin className="w-4 h-4 text-text-secondary/60 flex-shrink-0" />
                      <span className="text-sm truncate">
                        {event.venue?.name || event.venue}, {event.city}
                      </span>
                    </div>

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1"></div>

                    {/* View Details Button */}
                    <Link
                      to={`/events/${event._id}`}
                      className="block w-full bg-primary text-bg-primary text-center py-2.5 font-semibold hover:bg-primary/90 transition-colors rounded-lg cursor-pointer"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-text-secondary">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                First
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.currentPage - 2)) + i;
                if (pageNum <= pagination.totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm border rounded-lg transition-colors cursor-pointer ${
                        pageNum === pagination.currentPage
                          ? "bg-primary text-bg-primary border-primary"
                          : "border-border hover:bg-bg-secondary"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventListPage;