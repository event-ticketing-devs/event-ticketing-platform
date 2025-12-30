import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

// Custom hook to fetch venue options
export const useVenueOptions = (type) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await apiClient.get(`/venue-options?type=${type}`);
        setOptions(response.data);
      } catch (error) {
        console.error(`Error fetching ${type} options:`, error);
      } finally {
        setLoading(false);
      }
    };

    if (type) {
      fetchOptions();
    }
  }, [type]);

  return { options, loading };
};

// Helper function to get label for a value
export const getOptionLabel = (options, value) => {
  const option = options.find(o => o.value === value);
  return option ? option.label : value;
};

// Format options for select dropdowns
export const formatOptionsForSelect = (options) => {
  return options.map(opt => ({
    value: opt.value,
    label: opt.label,
  }));
};
