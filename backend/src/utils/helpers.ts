/**
 * Generates a random 6-digit OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Formats a phone number to international format
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Add +39 if it's an Italian number without country code
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return `+39${cleaned}`;
  }
  
  // If it already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  return phone;
};

/**
 * Validates Italian phone number
 */
export const isValidItalianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Italian mobile numbers start with 3 and are 10 digits long
  // or have +39 prefix making them 13 digits
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return true;
  }
  
  if (cleaned.length === 13 && cleaned.startsWith('393')) {
    return true;
  }
  
  return false;
};

/**
 * Sanitizes user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim(); // Remove leading/trailing whitespace
};

/**
 * Generates a random string for tokens
 */
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};