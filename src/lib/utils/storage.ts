/**
 * Centralized localStorage utilities with error handling
 * Provides safe wrappers for localStorage operations with fallback handling
 */

/**
 * Safely get an item from localStorage
 * @param key - localStorage key
 * @returns Parsed value or null if error/not found
 */
export function safeGetItem<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    // If JSON is corrupted, try to remove the corrupted item
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors when trying to clean up
    }
    return null;
  }
}

/**
 * Safely set an item in localStorage
 * @param key - localStorage key
 * @param value - Value to store (will be JSON stringified)
 * @returns true if successful, false otherwise
 */
export function safeSetItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Consider clearing old data.');
      // Could trigger a user notification here
      return false;
    }
    
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * @param key - localStorage key
 * @returns true if successful, false otherwise
 */
export function safeRemoveItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns true if localStorage is available, false otherwise
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage usage estimate (approximate)
 * @returns Object with used and available bytes (approximate)
 */
export function getStorageUsage(): { used: number; available: number } | null {
  if (typeof window === 'undefined' || !isStorageAvailable()) {
    return null;
  }

  try {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    // Most browsers have ~5-10MB limit, estimate 5MB as available
    const available = 5 * 1024 * 1024; // 5MB in bytes

    return { used, available };
  } catch {
    return null;
  }
}






