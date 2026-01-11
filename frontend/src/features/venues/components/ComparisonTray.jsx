import { useComparison } from "../../../context/ComparisonContext";
import { ClipboardList } from 'lucide-react';

const ComparisonTray = () => {
  const { selectedSpaces, removeSpace, clearComparison, setShowComparison, canAddMore } = useComparison();

  if (selectedSpaces.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t-2 border-primary shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="font-semibold text-text-primary">
                {selectedSpaces.length} space{selectedSpaces.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            {!canAddMore && (
              <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded-md inline-block">
                Maximum 3 spaces
              </span>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {selectedSpaces.map((space) => (
                <div
                  key={space._id}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0"
                >
                  <span className="font-medium">{space.name}</span>
                  <span className="text-text-secondary">@</span>
                  <span className="text-text-primary">{space.venue?.name || 'Venue'}</span>
                  <button
                    onClick={() => removeSpace(space._id)}
                    className="ml-1 text-primary hover:text-primary/80 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={clearComparison}
              className="text-text-secondary hover:text-text-primary cursor-pointer text-sm font-medium transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowComparison(true)}
              disabled={selectedSpaces.length < 2}
              className="bg-primary text-bg-primary px-4 sm:px-6 py-2 rounded-lg hover:bg-primary/90 cursor-pointer transition-colors disabled:bg-bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed font-semibold text-sm"
            >
              Compare
            </button>
          </div>
        </div>

        {selectedSpaces.length === 1 && (
          <p className="text-xs text-text-secondary mt-2">
            Select at least one more space to compare
          </p>
        )}
      </div>
    </div>
  );
};

export default ComparisonTray;
