import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComparison } from "../context/ComparisonContext";
import { getAmenityLabel, getPolicyItemLabel } from "../constants/venueConstants";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        <div className="bg-white rounded-lg max-w-7xl mx-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Space Comparison</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Compare up to 3 spaces side-by-side to make an informed decision
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                  <div key={space._id} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    {/* Space Header */}
                    <div className="bg-blue-600 text-white p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold">{space.name}</h3>
                        <button
                          onClick={() => removeSpace(space._id)}
                          className="text-white hover:text-blue-200"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-blue-100 text-sm font-medium">
                        {space.venue?.name || 'Venue'}
                      </p>
                      <p className="text-blue-200 text-xs">
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
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            +{space.photos.length - 1}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 space-y-4">
                      {/* Basic Info */}
                      <div className="bg-white rounded-lg p-3 space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Type:</span>
                            <p className="font-medium text-gray-900 capitalize">{space.type}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Setting:</span>
                            <p className="font-medium text-gray-900 capitalize">{space.indoorOutdoor}</p>
                          </div>
                        </div>
                      </div>

                      {/* Capacity & Size */}
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2">Capacity & Size</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600 block">Capacity</span>
                            <p className="font-bold text-gray-900 text-lg">{space.maxPax}</p>
                            <span className="text-gray-500 text-xs">people</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600 block">Area</span>
                            <p className="font-bold text-gray-900 text-lg">{space.areaSqFt || 'N/A'}</p>
                            <span className="text-gray-500 text-xs">sq ft</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Types */}
                      {space.supportedEventTypes && space.supportedEventTypes.length > 0 && (
                        <div className="bg-white rounded-lg p-3">
                          <button
                            onClick={() => toggleSection(space._id, 'eventTypes')}
                            className="w-full flex items-center justify-between mb-2"
                          >
                            <h4 className="font-semibold text-gray-900 text-sm">Supported Event Types</h4>
                            <svg
                              className={`h-4 w-4 text-gray-500 transition-transform ${isSectionExpanded(space._id, 'eventTypes') ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
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
                                    className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
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
                        <div className="bg-white rounded-lg p-3">
                          <button
                            onClick={() => toggleSection(space._id, 'amenities')}
                            className="w-full flex items-center justify-between mb-2"
                          >
                            <h4 className="font-semibold text-gray-900 text-sm">
                              Amenities ({allAmenities.length})
                            </h4>
                            <svg
                              className={`h-4 w-4 text-gray-500 transition-transform ${isSectionExpanded(space._id, 'amenities') ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isSectionExpanded(space._id, 'amenities') && (
                            <ul className="space-y-1 text-xs">
                              {allAmenities.map((amenity, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <svg className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-gray-700">{getAmenityLabel(amenity)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Policies */}
                      {(allAllowedItems.length > 0 || allBannedItems.length > 0 || space.policies?.additionalPolicy) && (
                        <div className="bg-white rounded-lg p-3">
                          <button
                            onClick={() => toggleSection(space._id, 'policies')}
                            className="w-full flex items-center justify-between mb-2"
                          >
                            <h4 className="font-semibold text-gray-900 text-sm">Space Policies</h4>
                            <svg
                              className={`h-4 w-4 text-gray-500 transition-transform ${isSectionExpanded(space._id, 'policies') ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isSectionExpanded(space._id, 'policies') && (
                            <div className="space-y-3">
                              {allAllowedItems.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-1">✓ Allowed:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {allAllowedItems.map((item, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                      >
                                        {getPolicyItemLabel(item)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {allBannedItems.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-1">✗ Banned:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {allBannedItems.map((item, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                                      >
                                        {getPolicyItemLabel(item)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {space.policies?.additionalPolicy && (
                                <div className="bg-amber-50 border border-amber-200 rounded p-2">
                                  <p className="text-xs text-amber-900">{space.policies.additionalPolicy}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Parking (Venue-level) */}
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2">Parking</h4>
                        <div className="text-xs">
                          {space.venue?.parking?.available ? (
                            <div>
                              <div className="flex items-center gap-1 text-green-600 font-medium mb-1">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Available
                              </div>
                              {space.venue.parking.notes && (
                                <p className="text-gray-600">{space.venue.parking.notes}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500">Not specified</p>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleEnquiry(space)}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Send Enquiry
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Information Purpose Only</p>
                  <p className="text-blue-800">
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
