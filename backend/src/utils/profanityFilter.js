// Simple profanity filter for review text
// This is a basic implementation - for production, consider using a library like 'bad-words'

const profaneWords = [
  // Add common profane words here
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap',
  'dick', 'piss', 'cock', 'pussy', 'whore', 'slut', 'fag',
  // Add more as needed
];

/**
 * Check if text contains profanity
 * @param {string} text - Text to check
 * @returns {boolean} - True if profanity detected
 */
export const containsProfanity = (text) => {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  return profaneWords.some(word => {
    // Use word boundaries to avoid false positives (e.g., "classic" contains "ass")
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
};

/**
 * Clean profanity from text by replacing with asterisks
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
export const cleanProfanity = (text) => {
  if (!text) return text;
  
  let cleanedText = text;
  
  profaneWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, (match) => '*'.repeat(match.length));
  });
  
  return cleanedText;
};

/**
 * Get profane words found in text
 * @param {string} text - Text to check
 * @returns {string[]} - Array of profane words found
 */
export const getProfaneWords = (text) => {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const found = [];
  
  profaneWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerText)) {
      found.push(word);
    }
  });
  
  return found;
};
