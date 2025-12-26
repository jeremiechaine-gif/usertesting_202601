/**
 * Folder management utilities
 * Handles localStorage persistence for routine folders
 */

export interface RoutineFolder {
  id: string;
  name: string;
  routineIds: string[];
  parentFolderId?: string | null; // null = root level
  userId: string; // Owner of the folder
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pelico-routine-folders';

/**
 * Validate folder data structure
 */
function isValidFolder(folder: unknown): folder is RoutineFolder {
  if (!folder || typeof folder !== 'object') return false;
  const f = folder as Record<string, unknown>;
  return (
    typeof f.id === 'string' &&
    typeof f.name === 'string' &&
    Array.isArray(f.routineIds) &&
    typeof f.userId === 'string' &&
    typeof f.createdAt === 'string' &&
    typeof f.updatedAt === 'string'
  );
}

export const getFolders = (userId?: string): RoutineFolder[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('Invalid folders data format: expected array');
      return [];
    }
    
    // Validate and filter out invalid folders
    const validFolders = parsed.filter(isValidFolder);
    if (validFolders.length !== parsed.length) {
      console.warn(`Filtered out ${parsed.length - validFolders.length} invalid folders`);
    }
    
    // Filter by userId if provided
    if (userId) {
      return validFolders.filter((f) => f.userId === userId);
    }
    
    return validFolders;
  } catch (error) {
    console.error('Error loading folders from localStorage:', error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore cleanup errors
    }
    return [];
  }
};

export const saveFolders = (folders: RoutineFolder[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  } catch (error) {
    console.error('Failed to save folders:', error);
  }
};

export const createFolder = (folder: Omit<RoutineFolder, 'id' | 'createdAt' | 'updatedAt'>): RoutineFolder => {
  const folders = getFolders();
  const newFolder: RoutineFolder = {
    ...folder,
    id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  folders.push(newFolder);
  saveFolders(folders);
  return newFolder;
};

export const updateFolder = (id: string, updates: Partial<Omit<RoutineFolder, 'id' | 'createdAt'>>): RoutineFolder | null => {
  const folders = getFolders();
  const index = folders.findIndex((f) => f.id === id);
  if (index === -1) return null;
  
  folders[index] = {
    ...folders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveFolders(folders);
  return folders[index];
};

export const deleteFolder = (id: string): boolean => {
  const folders = getFolders();
  const filtered = folders.filter((f) => f.id !== id);
  if (filtered.length === folders.length) return false;
  saveFolders(filtered);
  return true;
};

export const getFolder = (id: string): RoutineFolder | null => {
  const folders = getFolders();
  return folders.find((f) => f.id === id) || null;
};






