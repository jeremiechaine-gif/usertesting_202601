/**
 * Routine Converter
 * Converts onboarding library entries to actual Routine instances
 */

import { createRoutine, getRoutines, type Routine } from '../routines';
import { getRoutineById } from './routineLibrary';
import { getCurrentUserId } from '../users';
import type { RoutineLibraryEntry } from './types';

/**
 * Check if a routine with the given name already exists for the current user
 */
function routineNameExists(name: string, excludeId?: string): boolean {
  const routines = getRoutines();
  const currentUserId = getCurrentUserId();
  return routines.some(
    (r) =>
      r.name === name &&
      r.createdBy === currentUserId &&
      (!excludeId || r.id !== excludeId)
  );
}

/**
 * Convert a library entry to a Routine instance
 * Creates a routine with default configuration that can be customized later
 * 
 * @param libraryEntry - The library entry to convert
 * @param skipIfExists - If true, skip creation if a routine with the same name already exists
 * @returns Created Routine instance, or null if skipped
 */
export function createRoutineFromLibraryEntry(
  libraryEntry: RoutineLibraryEntry,
  skipIfExists: boolean = true
): Routine | null {
  // Check for existing routine with same name
  if (skipIfExists && routineNameExists(libraryEntry.label)) {
    console.log(`Routine "${libraryEntry.label}" already exists, skipping creation`);
    return null;
  }

  return createRoutine({
    name: libraryEntry.label,
    description: libraryEntry.description,
    filters: [], // User will configure filters later
    sorting: [], // User will configure sorting later
    scopeMode: 'scope-aware', // Default: uses user's scope
    createdBy: getCurrentUserId(),
    teamIds: [], // Private by default
  });
}

/**
 * Create multiple routines from library entry IDs
 * 
 * @param routineIds - Array of library entry IDs
 * @param skipIfExists - If true, skip creation if a routine with the same name already exists
 * @returns Object with created routines and skipped count
 */
export function createRoutinesFromLibraryEntries(
  routineIds: string[],
  skipIfExists: boolean = true
): { created: Routine[]; skipped: number } {
  const createdRoutines: Routine[] = [];
  let skipped = 0;
  
  for (const routineId of routineIds) {
    const libraryEntry = getRoutineById(routineId);
    if (libraryEntry) {
      const routine = createRoutineFromLibraryEntry(libraryEntry, skipIfExists);
      if (routine) {
        createdRoutines.push(routine);
      } else {
        skipped++;
      }
    } else {
      console.warn(`Library entry not found for ID: ${routineId}`);
      skipped++;
    }
  }
  
  return { created: createdRoutines, skipped };
}

