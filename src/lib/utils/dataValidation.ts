/**
 * Data validation utilities
 * Provides type guards and validation functions for common data structures
 */

/**
 * Type guard to check if a value is a valid string (non-empty after trim)
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid array
 */
export function isValidArray<T>(
  value: unknown,
  itemValidator?: (item: unknown) => item is T
): value is T[] {
  if (!Array.isArray(value)) {
    return false;
  }
  if (itemValidator) {
    return value.every(itemValidator);
  }
  return true;
}

/**
 * Type guard to check if a value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard to check if a value is a valid date string (ISO format)
 */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Safely parse JSON with validation
 */
export function safeParseJSON<T>(
  json: string,
  validator?: (parsed: unknown) => parsed is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    if (validator && !validator(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize string input
 */
export function sanitizeString(input: unknown, maxLength?: number): string {
  if (typeof input !== 'string') {
    return '';
  }
  let sanitized = input.trim();
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}






