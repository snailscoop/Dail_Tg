/**
 * Formats a date string into a human-readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

/**
 * Checks if a string is a valid DID
 */
export const isValidDid = (did: string): boolean => {
  // Basic DID validation pattern
  const didPattern = /^did:(cheqd|verida):[a-zA-Z0-9]+$/;
  return didPattern.test(did);
};

/**
 * Truncates text with ellipsis for display
 */
export const truncateText = (text: string, maxLength = 20): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Checks if a credential has expired
 */
export const isCredentialExpired = (expirationDate?: string): boolean => {
  if (!expirationDate) return false;
  const expDate = new Date(expirationDate);
  return expDate < new Date();
};

/**
 * Extracts username or ID from a Telegram mention
 */
export const extractTelegramUsername = (mentionText: string): string | null => {
  // Pattern can match @username or direct mentions
  const usernamePattern = /@([a-zA-Z0-9_]+)/;
  const match = mentionText.match(usernamePattern);
  return match ? match[1] : null;
};

/**
 * Generates a random linking code (for testing/demo purposes)
 */
export const generateRandomCode = (length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Safely parses JSON with error handling
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}; 