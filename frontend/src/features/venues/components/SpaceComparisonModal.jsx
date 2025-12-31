import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComparison } from "../../../context/ComparisonContext";
import { getAmenityLabel, getPolicyItemLabel } from "../../../constants/venueConstants";
import { X, XCircle, CheckCircle2, ChevronDown, Info } from "lucide-react";

const SpaceComparisonModal = () => {
  const navigate = useNavigate();
  const { selectedSpaces, showComparison, setShowComparison, removeSpace } = useComparison();
  const [expandedSections, setExpandedSections] = useState({});

  if (!showComparison || selectedSpaces.length < 2) return null;

  const toggleSection = (spaceId, section) => {
    const key = `${spaceId}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isSectionExpanded = (spaceId, section) => {
    return expandedSections[`${spaceId}-${section}`] || false;
  };

  const handleClose = () => {
    setShowComparison(false);
  };

  const handleEnquiry = (space) => {
    navigate(`/venues/${space.venue._id || space.venue}`, { 
      state: { selectedSpaceId: space._id } 
    });
    setShowComparison(false);
  };

  return (
    <div className="fixed inset-0 bg-text-primary/50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        <div className="bg-bg-primary rounded-lg max-w-7xl mx-auto">
          {/* Header */}
          <div className="sticky top-0 bg-bg-primary border-b border-border px-6 py-4 rounded-t-lg z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Space Comparison</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Compare up to 3 spaces side-by-side to make an informed decision
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="p-6">
            <div className={`grid ${selectedSpaces.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
              {selectedSpaces.map((space) => {
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
                  <div key={space._id} className="bg-bg-secondary rounded-lg overflow-hidden border border-border flex flex-col">
                    {/* Space Header */}
                    <div className="bg-primary text-bg-primary p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold">{space.name}</h3>
                        <button
                          onClick={() => removeSpace(space._id)}
                          className="text-bg-primary hover:text-bg-primary/80 cursor-pointer transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-bg-primary/90 text-sm font-medium">
                        {space.venue?.name || 'Venue'}
                      </p>
                      <p className="text-bg-primary/80 text-xs">
                        {space.venue?.city || 'City'}
                      </p>
                    </div>

                    {/* Space Photos */}
                    {space.photos && space.photos.length > 0 && (
                      <div className="relative">
                        <img
                          src={space.photos[0]}
                          alt={space.name}
                          className="w-full h-32 object-cover"
                        />
                        {space.photos.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-text-primary/80 text-bg-primary text-xs px-2 py-1 rounded-md">
                            +{space.photos.length - 1}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 space-y-4 flex-1 flex flex-col">
                      {/* Basic Info */}
                      <div className="bg-bg-primary rounded-lg p-3 space-y-2">
                        <h4 className="font-semibold text-text-primary text-sm mb-2">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-text-secondary">Type:</span>
                            <p className="font-medium text-text-primary capitalize">{space.type}</p>
                          </div>
                          <div>
                            <span className="text-text-secondary">Setting:</span>
                            <p className="font-medium text-text-primary capitalize">{space.indoorOutdoor}</p>
                          </div>
                        </div>
                      </div>

                      {/* Capacity & Size */}
                      <div className="bg-bg-primary rounded-lg p-3">
                        <h4 className="font-semibold text-text-primary text-sm mb-2">Capacity & Size</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-bg-secondary p-2 rounded-lg">
                            <span className="text-text-secondary block">Capacity</span>
                            <p className="font-bold text-text-primary text-lg">{space.maxPax}</p>
                            <span className="text-text-secondary text-xs">people</span>
                          </div>
                          <div className="bg-bg-secondary p-2 rounded-lg">
                            <span className="text-text-secondary block">Area</span>
                            <p className="font-bold text-text-primary text-lg">{space.areaSqFt || 'N/A'}</p>
                            <span className="text-text-secondary text-xs">sq ft</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Types */}
                      {space.supportedEventTypes && space.supportedEventTypes.length > 0 && (
                        <div className="bg-bg-primary rounded-lg p-3">
                          <button
                            onClick={() => toggleSection(space._id, 'eventTypes')}
                            className="w-full flex items-center justify-between mb-2 cursor-pointer"
                          >
                            <h4 className="font-semibold text-text-primary text-sm">Supported Event Types</h4>
                            <ChevronDown
                              className={`h-4 w-4 text-text-secondary transition-transform ${isSectionExpanded(space._id, 'eventTypes') ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isSectionExpanded(space._id, 'eventTypes') && (
                            <div className="flex flex-wrap gap-1">
                              {space.supportedEventTypes.map((type, idx) => {
                                const displayName = type.startsWith("other:")
                                  ? type.substring(6)
                                  : type.charAt(0).toUpperCase() + type.slice(1);
                                return (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
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
                        <div className="bg-bg-primary rounded-lg p-3">
                          <button
                            onClick={() => toggleSection(space._id, 'amenities')}
                            className="w-full flex items-center justify-between mb-2 cursor-pointer"
                          >
                            <h4 className="font-semibold text-text-primary text-sm">
                              Amenities ({allAmenities.length})
                            </h4>
                            <ChevronDown
                              className={`h-4 w-4 text-text-secondary transition-transform ${isSectionExpanded(space._id, 'amenities') ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isSectionExpanded(space._id, 'amenities') && (
                            <ul className="space-y-1 text-xs">
                              {allAmenities.map((amenity, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                  <span className="text-text-primary">{getAmenityLabel(amenity)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Policies */}
                      {(allAllowedItems.length > 0 || allBannedItems.length > 0 || space.policies?.additionalPolicy) && (
                        <div className="bg-bg-primary rounded-lg p-3">
                          <button
                            onClick={() => toggleSection(space._id, 'policies')}
                            className="w-full flex items-center justify-between mb-2 cursor-pointer"
                          >
                            <h4 className="font-semibold text-text-primary text-sm">Space Policies</h4>
                            <ChevronDown
                              className={`h-4 w-4 text-text-secondary transition-transform ${isSectionExpanded(space._id, 'policies') ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isSectionExpanded(space._id, 'policies') && (
                            <div className="space-y-3">
                              {allAllowedItems.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-text-primary mb-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-success" />
                                    Allowed:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {allAllowedItems.map((item, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-1 bg-success/10 text-success text-xs rounded-md"
                                      >
                                        {getPolicyItemLabel(item)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {allBannedItems.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-text-primary mb-1 flex items-center gap-1">
                                    <XCircle className="w-3 h-3 text-error" />
                                    Banned:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {allBannedItems.map((item, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-1 bg-error/10 text-error text-xs rounded-md"
                                      >
                                        {getPolicyItemLabel(item)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {space.policies?.additionalPolicy && (
                                <div className="bg-warning/10 border border-warning/30 rounded-lg p-2">
                                  <p className="text-xs text-text-primary">{space.policies.additionalPolicy}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Parking (Venue-level) */}
                      <div className="bg-bg-primary rounded-lg p-3">
                        <h4 className="font-semibold text-text-primary text-sm mb-2">Parking</h4>
                        <div className="text-xs">
                          {space.venue?.parking?.available ? (
                            <div>
                              <div className="flex items-center gap-1 text-success font-medium mb-1">
                                <CheckCircle2 className="h-4 w-4" />
                                Available
                              </div>
                              {space.venue.parking.notes && (
                                <p className="text-text-secondary">{space.venue.parking.notes}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-text-secondary">Not specified</p>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-auto pt-4">
                        <button
                          onClick={() => handleEnquiry(space)}
                          className="w-full bg-primary text-bg-primary px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold cursor-pointer"
                        >
                          Send Enquiry
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 bg-secondary/10 border border-secondary/30 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-secondary flex-shrink-0" />
                <div className="text-sm text-text-primary">
                  <p className="font-medium mb-1">Information Purpose Only</p>
                  <p className="text-text-secondary">
                    This comparison is for informational and decision-support purposes only. 
                    It does not represent a booking, reservation, or guarantee of availability. 
                    Pricing and final arrangements are handled through the enquiry process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceComparisonModal;
