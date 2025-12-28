// Standard amenities for spaces
export const STANDARD_AMENITIES = [
  { value: 'sound_system', label: 'Sound System' },
  { value: 'microphones', label: 'Microphones' },
  { value: 'projector', label: 'Projector' },
  { value: 'stage', label: 'Stage' },
  { value: 'lighting', label: 'Professional Lighting' },
  { value: 'green_room', label: 'Green Room' },
  { value: 'power_backup', label: 'Power Backup' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'washrooms', label: 'Washrooms' },
];

// Standard policy items for allowed/banned items
export const STANDARD_POLICY_ITEMS = [
  { value: 'outside_food', label: 'Outside Food' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'smoking', label: 'Smoking' },
  { value: 'tobacco', label: 'Tobacco Products' },
  { value: 'decorations', label: 'Decorations' },
  { value: 'confetti', label: 'Confetti' },
  { value: 'fire_props', label: 'Fire Props/Pyrotechnics' },
  { value: 'pets', label: 'Pets' },
];

// Helper function to get label for a value
export const getAmenityLabel = (value) => {
  const amenity = STANDARD_AMENITIES.find(a => a.value === value);
  return amenity ? amenity.label : value;
};

export const getPolicyItemLabel = (value) => {
  const item = STANDARD_POLICY_ITEMS.find(i => i.value === value);
  return item ? item.label : value;
};
