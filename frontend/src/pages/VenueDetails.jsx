import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import VenueMap from "../components/VenueMap";
import { useAuth } from "../context/AuthContext";
import { useComparison } from "../context/ComparisonContext";
import toast from "react-hot-toast";
import { getAmenityLabel, getPolicyItemLabel } from "../constants/venueConstants";
import { MapPin, CheckCircle2, ArrowLeft, ChevronDown, X, XCircle } from "lucide-react";

const VenueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toggleSpace, isSelected, canAddMore } = useComparison();
  const [venue, setVenue] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [modalSpace, setModalSpace] = useState(null);

  useEffect(() => {
    fetchVenueDetails();
  }, [id]);

  const fetchVenueDetails = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/venues/${id}`);
      setVenue(res.data);
      setSpaces(res.data.spaces || []);
    } catch (err) {
      console.error("Error fetching venue details:", err);
      toast.error("Failed to load venue details");
    }
    setLoading(false);
  };

  const handleEnquireClick = (space) => {
    if (!currentUser) {
      toast.error("Please login to send enquiries");
      navigate("/login");
      return;
    }
    setSelectedSpace(space);
    setShowEnquiryForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary">Venue not found</h2>
          <button
            onClick={() => navigate("/venues")}
            className="mt-4 text-primary hover:underline"
          >
            Back to venues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/venues")}
            className="flex items-center text-text-secondary hover:text-text-primary mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to venues
          </button>
          
          {/* Venue Photo */}
          {venue.photo && (
            <div className="mb-6 rounded-lg overflow-hidden bg-bg-secondary flex items-center justify-center" style={{maxHeight: '400px'}}>
              <img
                src={venue.photo}
                alt={venue.name}
                className="w-full h-full object-fit"
              />
            </div>
          )}

          <h1 className="text-3xl font-bold text-text-primary">{venue.name}</h1>
          <div className="flex items-center text-text-secondary mt-2">
            <MapPin className="h-5 w-5 mr-2" />
            {venue.city}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Info */}
            <div className="bg-bg-primary border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Venue Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-text-primary">Address:</span>
                  <p className="text-text-secondary">{venue.fullAddress}</p>
                </div>
                {venue.parking?.available && (
                  <div>
                    <span className="font-medium text-text-primary">Parking:</span>
                    <p className="text-text-secondary">
                      {venue.parking.notes || "Available"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Policies */}
            {venue.policies && (
              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Policies</h2>
                <div className="space-y-4">
                  {venue.policies.allowedItems && venue.policies.allowedItems.length > 0 && (
                    <div>
                      <span className="font-medium text-success">Allowed Items:</span>
                      <ul className="mt-2 list-disc list-inside text-text-secondary">
                        {venue.policies.allowedItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {venue.policies.bannedItems && venue.policies.bannedItems.length > 0 && (
                    <div>
                      <span className="font-medium text-error">Banned Items:</span>
                      <ul className="mt-2 list-disc list-inside text-text-secondary">
                        {venue.policies.bannedItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {venue.policies.additionalPolicy && (
                    <div>
                      <span className="font-medium text-text-primary">Additional Policy:</span>
                      <p className="mt-2 text-text-secondary">{venue.policies.additionalPolicy}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            {venue.location?.coordinates && (
              <div className="bg-bg-primary border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Location</h2>
                <VenueMap
                  venue={{
                    coordinates: venue.location.coordinates,
                    name: venue.name,
                    address: venue.fullAddress
                  }}
                />
              </div>
            )}
          </div>

          {/* Sidebar - Contact */}
          <div className="lg:col-span-1">
            <div className="bg-bg-primary border border-border rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Contact</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-text-primary">Name:</span>
                  <p className="text-text-primary">{venue.primaryContact.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-text-primary">Phone:</span>
                  <p className="text-text-primary">{venue.primaryContact.phone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-text-primary">Email:</span>
                  <p className="text-text-primary">{venue.primaryContact.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spaces List */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Available Spaces</h2>
          {spaces.length === 0 ? (
            <div className="bg-bg-primary border border-border rounded-lg p-8 text-center">
              <p className="text-text-secondary">No spaces available at this venue</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
              {spaces.map((space) => {
                const allAmenities = [
                  ...(space.amenities?.standard || []),
                  ...(space.amenities?.custom || [])
                ];
                const firstThreeAmenities = allAmenities.slice(0, 3);
                const remainingCount = allAmenities.length - 3;
                const selected = isSelected(space._id);
                const disabled = !selected && !canAddMore;

                return (
                  <div key={space._id} className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative">
                    {/* Compare Checkbox */}
                    <div className="absolute top-4 right-4 z-10">
                      <label className={`flex items-center gap-2 bg-white px-2 py-1 rounded shadow-md cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-secondary'}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={disabled}
                          onChange={() => {
                            const spaceWithVenue = { ...space, venue };
                            toggleSpace(spaceWithVenue);
                          }}
                          className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="text-xs font-medium text-text-primary">Compare</span>
                      </label>
                    </div>

                    {/* Space Photos */}
                    {space.photos && space.photos.length > 0 && (
                      <div className="mb-4 -mx-6 -mt-6 bg-bg-secondary flex items-center justify-center" style={{height: '200px'}}>
                        <img
                          src={space.photos[0]}
                          alt={space.name}
                          className="w-full h-full object-cover"
                        />
                        {space.photos.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            +{space.photos.length - 1} more
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">{space.name}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Type:</span>
                        <span className="font-medium text-text-primary capitalize">{space.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Capacity:</span>
                        <span className="font-medium text-text-primary">{space.maxPax} people</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Area:</span>
                        <span className="font-medium text-text-primary">{space.areaSqFt} sq ft</span>
                      </div>
                    </div>

                    {allAmenities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-text-secondary mb-2">Amenities:</p>
                        <ul className="text-xs text-text-secondary space-y-1">
                          {firstThreeAmenities.map((amenity, idx) => (
                            <li key={idx}>• {getAmenityLabel(amenity)}</li>
                          ))}
                          {remainingCount > 0 && (
                            <li className="text-primary font-medium">+ {remainingCount} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setModalSpace(space);
                          setShowSpaceModal(true);
                        }}
                        className="w-full bg-bg-secondary text-text-primary px-4 py-2 rounded-lg hover:bg-border transition-colors font-medium"
                      >
                        View Full Details
                      </button>
                      <button
                        onClick={() => handleEnquireClick(space)}
                        className="w-full bg-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Send Enquiry
                      </button>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Space Details Modal */}
      {showSpaceModal && modalSpace && (
        <SpaceDetailsModal
          space={modalSpace}
          onClose={() => {
            setShowSpaceModal(false);
            setModalSpace(null);
          }}
          onEnquire={() => {
            setShowSpaceModal(false);
            handleEnquireClick(modalSpace);
          }}
        />
      )}

      {/* Enquiry Form Modal */}
      {showEnquiryForm && selectedSpace && (
        <EnquiryFormModal
          venue={venue}
          space={selectedSpace}
          onClose={() => {
            setShowEnquiryForm(false);
            setSelectedSpace(null);
          }}
        />
      )}
    </div>
  );
};

// Space Details Modal Component
const SpaceDetailsModal = ({ space, onClose, onEnquire }) => {
  const [expandedSections, setExpandedSections] = useState({
    amenities: true,
    eventTypes: true,
    policies: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const allAmenities = [
    ...(space.amenities?.standard || []),
    ...(space.amenities?.custom || [])
  ];

  const allAllowedItems = [
    ...(space.policies?.allowedItems?.standard || []),
    ...(space.policies?.allowedItems?.custom || [])
  ];

  const allBannedItems = [
    ...(space.policies?.bannedItems?.standard || []),
    ...(space.policies?.bannedItems?.custom || [])
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-bg-primary sm:rounded-lg max-w-3xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-4 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{space.name}</h2>
              <p className="text-text-secondary mt-1 capitalize">{space.type}</p>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary/60 hover:text-text-secondary"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Space Photos Gallery */}
          {space.photos && space.photos.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2">
                {space.photos.map((photo, index) => (
                  <div key={index} className="bg-bg-secondary rounded-lg flex items-center justify-center" style={{height: '160px'}}>
                    <img
                      src={photo}
                      alt={`${space.name} - Photo ${index + 1}`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-bg-secondary p-4 rounded-lg">
              <p className="text-sm text-text-secondary">Capacity</p>
              <p className="text-lg font-semibold text-text-primary">{space.maxPax} people</p>
            </div>
            <div className="bg-bg-secondary p-4 rounded-lg">
              <p className="text-sm text-text-secondary">Area</p>
              <p className="text-lg font-semibold text-text-primary">{space.areaSqFt} sq ft</p>
            </div>
            <div className="bg-bg-secondary p-4 rounded-lg">
              <p className="text-sm text-text-secondary">Setting</p>
              <p className="text-lg font-semibold text-text-primary capitalize">{space.indoorOutdoor}</p>
            </div>
          </div>

          {/* Event Types */}
          {space.supportedEventTypes && space.supportedEventTypes.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('eventTypes')}
                className="flex items-center justify-between w-full mb-3"
              >
                <h3 className="text-lg font-semibold text-text-primary">Supported Event Types</h3>
                <ChevronDown className={`h-5 w-5 text-text-secondary transition-transform ${expandedSections.eventTypes ? 'rotate-180' : ''}`} />
              </button>
              {expandedSections.eventTypes && (
                <div className="flex flex-wrap gap-2">
                  {space.supportedEventTypes.map((type, idx) => {
                    const displayName = type.startsWith("other:") 
                      ? type.substring(6)
                      : type.charAt(0).toUpperCase() + type.slice(1);
                    return (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 text-sm rounded-full font-medium"
                      >
                        {displayName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Amenities */}
          {allAmenities.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('amenities')}
                className="flex items-center justify-between w-full mb-3"
              >
                <h3 className="text-lg font-semibold text-text-primary">Amenities</h3>
                <ChevronDown className={`h-5 w-5 text-text-secondary transition-transform ${expandedSections.amenities ? 'rotate-180' : ''}`} />
              </button>
              {expandedSections.amenities && (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {allAmenities.map((amenity, idx) => (
                    <li key={idx} className="flex items-center text-text-primary">
                      <CheckCircle2 className="h-5 w-5 text-success mr-2" />
                      {getAmenityLabel(amenity)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Policies */}
          {(allAllowedItems.length > 0 || allBannedItems.length > 0 || space.policies?.additionalPolicy) && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('policies')}
                className="flex items-center justify-between w-full mb-3"
              >
                <h3 className="text-lg font-semibold text-text-primary">Space Policies</h3>
                <ChevronDown className={`h-5 w-5 text-text-secondary transition-transform ${expandedSections.policies ? 'rotate-180' : ''}`} />
              </button>
              {expandedSections.policies && (
                <div className="space-y-4">
                  {allAllowedItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Allowed Items:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allAllowedItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-3 py-1.5 bg-success/10 text-success text-sm rounded-md border border-success/20"
                          >
                            {getPolicyItemLabel(item)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {allBannedItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-2 flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-error" />
                        Banned Items:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allBannedItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-3 py-1.5 bg-error/10 text-error text-sm rounded-md border border-error/20"
                          >
                            {getPolicyItemLabel(item)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {space.policies?.additionalPolicy && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-amber-900 mb-1">Additional Policy:</p>
                      <p className="text-sm text-amber-800">{space.policies.additionalPolicy}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with CTA */}
        <div className="sticky bottom-0 bg-bg-secondary border-t border-border p-6">
          <button
            onClick={onEnquire}
            className="w-full bg-primary text-bg-primary px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg"
          >
            Send Enquiry for This Space
          </button>
        </div>
      </div>
    </div>
  );
};

// Enquiry Form Modal Component
const EnquiryFormModal = ({ venue, space, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    eventDateStart: "",
    eventDateEnd: "",
    expectedPax: "",
    eventType: "",
    budgetMax: "",
    notes: "",
  });
  const [customEventType, setCustomEventType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If "other" is selected and custom type is provided, use it
    let finalEventType = formData.eventType;
    if (formData.eventType === "other" && customEventType.trim()) {
      finalEventType = `other:${customEventType.trim()}`;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/venue-requests", {
        venue: venue._id,
        space: space._id,
        ...formData,
        eventType: finalEventType,
      });
      
      toast.success("Enquiry sent successfully!");
      onClose();
      navigate("/venue-enquiries");
    } catch (err) {
      console.error("Error sending enquiry:", err);
      toast.error(err.response?.data?.message || "Failed to send enquiry");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Send Enquiry</h2>
              <p className="text-text-secondary mt-1">
                {space.name} at {venue.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary/60 hover:text-text-secondary"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Event Start Date *
                </label>
                <input
                  type="date"
                  name="eventDateStart"
                  value={formData.eventDateStart}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Event End Date *
                </label>
                <input
                  type="date"
                  name="eventDateEnd"
                  value={formData.eventDateEnd}
                  onChange={handleChange}
                  required
                  min={formData.eventDateStart || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Expected Attendees *
              </label>
              <input
                type="number"
                name="expectedPax"
                value={formData.expectedPax}
                onChange={handleChange}
                required
                min="1"
                max={space.maxPax}
                placeholder={`Max capacity: ${space.maxPax}`}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Event Type *
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
              >
                <option value="">Select event type</option>
                {space.supportedEventTypes.map((type) => {
                  // Display custom name for 'other:CustomName', otherwise capitalize first letter
                  const displayName = type.startsWith("other:") 
                    ? type.substring(6) // Show custom name without 'other:' prefix
                    : type.charAt(0).toUpperCase() + type.slice(1);
                  
                  return (
                    <option key={type} value={type}>
                      {displayName}
                    </option>
                  );
                })}
                {/* Always show "Other (Not Listed)" option */}
                <option value="other">Other (Not Listed)</option>
              </select>
            </div>

            {/* Custom Event Type Input - shown when "other" is selected */}
            {formData.eventType === "other" && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Specify Event Type
                </label>
                <input
                  type="text"
                  value={customEventType}
                  onChange={(e) => setCustomEventType(e.target.value)}
                  placeholder="e.g., Product Launch, Art Exhibition"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Optional: Provide more details about your event type
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Budget (₹) *
              </label>
              <input
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
                required
                min="0"
                placeholder="e.g., 100000"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any special requirements or additional information..."
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
              ></textarea>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary text-bg-primary px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-border"
              >
                {submitting ? "Sending..." : "Send Enquiry"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VenueDetails;
