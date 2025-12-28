import { useComparison } from "../context/ComparisonContext";

const ComparisonTray = () => {
  const { selectedSpaces, removeSpace, clearComparison, setShowComparison, canAddMore } = useComparison();

  if (selectedSpaces.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-600 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-semibold text-gray-900">
                {selectedSpaces.length} space{selectedSpaces.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            {!canAddMore && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Maximum 3 spaces
              </span>
            )}

            <div className="flex gap-2 overflow-x-auto max-w-2xl">
              {selectedSpaces.map((space) => (
                <div
                  key={space._id}
                  className="flex items-center gap-2 bg-blue-50 text-blue-900 px-3 py-1 rounded-full text-sm whitespace-nowrap"
                >
                  <span className="font-medium">{space.name}</span>
                  <span className="text-blue-600">@</span>
                  <span className="text-blue-700">{space.venue?.name || 'Venue'}</span>
                  <button
                    onClick={() => removeSpace(space._id)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearComparison}
              className="text-gray-600 hover:text-gray-800 hover:cursor-pointer text-sm font-medium"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowComparison(true)}
              disabled={selectedSpaces.length < 2}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            >
              Compare Spaces
            </button>
          </div>
        </div>

        {selectedSpaces.length === 1 && (
          <p className="text-xs text-gray-600 mt-2">
            Select at least one more space to compare
          </p>
        )}
      </div>
    </div>
  );
};

export default ComparisonTray;
