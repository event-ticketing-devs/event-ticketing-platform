import { createContext, useContext, useState } from "react";

const ComparisonContext = createContext();

export const ComparisonProvider = ({ children }) => {
  const [selectedSpaces, setSelectedSpaces] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const toggleSpace = (space) => {
    setSelectedSpaces((prev) => {
      const exists = prev.find((s) => s._id === space._id);
      if (exists) {
        return prev.filter((s) => s._id !== space._id);
      } else {
        if (prev.length >= 3) {
          return prev; // Max 3 spaces
        }
        return [...prev, space];
      }
    });
  };

  const removeSpace = (spaceId) => {
    setSelectedSpaces((prev) => prev.filter((s) => s._id !== spaceId));
  };

  const clearComparison = () => {
    setSelectedSpaces([]);
    setShowComparison(false);
  };

  const isSelected = (spaceId) => {
    return selectedSpaces.some((s) => s._id === spaceId);
  };

  const canAddMore = selectedSpaces.length < 3;

  return (
    <ComparisonContext.Provider
      value={{
        selectedSpaces,
        toggleSpace,
        removeSpace,
        clearComparison,
        isSelected,
        canAddMore,
        showComparison,
        setShowComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => useContext(ComparisonContext);
