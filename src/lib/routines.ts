/**
 * Routine management utilities
 * Handles localStorage persistence for routines
 */

import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import type { Persona } from '@/lib/onboarding/pelicoViews';

export type PelicoViewPage = 
  | 'supply'
  | 'production'
  | 'customer'
  | 'escalation'
  | 'value-engineering'
  | 'event-explorer'
  | 'simulation';

export interface Routine {
  id: string;
  name: string;
  description?: string;
  
  // Configuration de vue
  filters: ColumnFiltersState;
  sorting: SortingState;
  columnVisibility?: Record<string, boolean>;
  columnOrder?: string[];
  groupBy?: string | null;
  pageSize?: number;
  
  // Page cible pour cette routine
  pelicoView?: PelicoViewPage; // Page Pelico associée (Supply, Production Control, etc.)
  
  // Relation avec le scope
  scopeMode: 'scope-aware' | 'scope-fixed';
  linkedScopeId?: string | null; // Scope lié (si scope-fixed)
  
  // Métadonnées
  createdBy: string; // userId du créateur
  teamIds?: string[]; // [] ou undefined = privée, [teamId1, teamId2, ...] = partagée à plusieurs équipes
  // Legacy: teamId is kept for backward compatibility but deprecated
  teamId?: string | null; // @deprecated Use teamIds instead
  personas?: Persona[]; // Personas for which this routine is recommended
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pelico-routines';

/**
 * Validate routine data structure
 */
function isValidRoutine(routine: unknown): routine is Routine {
  if (!routine || typeof routine !== 'object') return false;
  const r = routine as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    Array.isArray(r.filters) &&
    Array.isArray(r.sorting) &&
    typeof r.createdBy === 'string' &&
    typeof r.createdAt === 'string' &&
    typeof r.updatedAt === 'string'
  );
}

export const getRoutines = (): Routine[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('Invalid routines data format: expected array');
      return [];
    }
    
    // Validate and filter out invalid routines
    const validRoutines = parsed.filter(isValidRoutine);
    if (validRoutines.length !== parsed.length) {
      console.warn(`Filtered out ${parsed.length - validRoutines.length} invalid routines`);
    }
    
    // Migrate old routines with teamId to teamIds
    let needsMigration = false;
    const migratedRoutines = validRoutines.map((routine) => {
      if (routine.teamId && !routine.teamIds) {
        needsMigration = true;
        return {
          ...routine,
          teamIds: [routine.teamId],
          teamId: undefined, // Remove old field
        };
      }
      // Ensure teamIds is always an array (even if empty)
      if (!routine.teamIds && !routine.teamId) {
        return {
          ...routine,
          teamIds: [],
        };
      }
      return routine;
    });
    
    if (needsMigration) {
      saveRoutines(migratedRoutines);
      return migratedRoutines;
    }
    
    return migratedRoutines;
  } catch {
    return [];
  }
};

export const saveRoutines = (routines: Routine[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  } catch (error) {
    console.error('Failed to save routines:', error);
  }
};

export const createRoutine = (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Routine => {
  const routines = getRoutines();
  const newRoutine: Routine = {
    ...routine,
    createdBy: routine.createdBy || '', // Must be provided
    id: `routine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  routines.push(newRoutine);
  saveRoutines(routines);
  return newRoutine;
};

export const updateRoutine = (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>): Routine | null => {
  const routines = getRoutines();
  const index = routines.findIndex((r) => r.id === id);
  if (index === -1) return null;
  
  routines[index] = {
    ...routines[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveRoutines(routines);
  return routines[index];
};

export const deleteRoutine = (id: string): boolean => {
  const routines = getRoutines();
  const filtered = routines.filter((r) => r.id !== id);
  if (filtered.length === routines.length) return false;
  saveRoutines(filtered);
  
  // Clean up empty folders that contained this routine
  // Use dynamic import to avoid circular dependency
  import('./folders').then((foldersModule) => {
    const folders = foldersModule.getFolders();
    folders.forEach((folder) => {
      if (folder.routineIds.includes(id)) {
        // Remove routine from folder
        const updatedRoutineIds = folder.routineIds.filter((rid) => rid !== id);
        if (updatedRoutineIds.length === 0) {
          // Folder is now empty, delete it
          foldersModule.deleteFolder(folder.id);
        } else {
          // Update folder with remaining routines
          foldersModule.updateFolder(folder.id, { routineIds: updatedRoutineIds });
        }
      }
    });
  }).catch((error) => {
    console.error('Error cleaning up folders after routine deletion:', error);
  });
  
  return true;
};

export const getRoutine = (id: string): Routine | null => {
  const routines = getRoutines();
  return routines.find((r) => r.id === id) || null;
};

/**
 * Merge filters from routine and scope
 * Priority: routine filters override scope filters for same column
 */
export const mergeFilters = (
  routineFilters: ColumnFiltersState,
  scopeFilters: ColumnFiltersState
): ColumnFiltersState => {
  // Start with routine filters (they have priority)
  const merged: ColumnFiltersState = [...routineFilters];
  
  // Add scope filters that don't conflict with routine filters
  scopeFilters.forEach((scopeFilter) => {
    const routineHasFilter = routineFilters.some((rf) => rf.id === scopeFilter.id);
    if (!routineHasFilter) {
      merged.push(scopeFilter);
    }
  });
  
  return merged;
};

export const shareRoutine = (id: string): string | null => {
  const routine = getRoutine(id);
  if (!routine) return null;
  
  // Generate shareable link (in a real app, this would be a server endpoint)
  const shareToken = btoa(JSON.stringify({ type: 'routine', id, timestamp: Date.now() }));
  return `${window.location.origin}/share/${shareToken}`;
};

export const duplicateRoutine = (id: string, newCreatedBy?: string): Routine | null => {
  const routine = getRoutine(id);
  if (!routine) return null;
  
  return createRoutine({
    name: `${routine.name} (Copy)`,
    description: routine.description,
    filters: routine.filters,
    sorting: routine.sorting,
    columnVisibility: routine.columnVisibility,
    columnOrder: routine.columnOrder,
    groupBy: routine.groupBy,
    pageSize: routine.pageSize,
    scopeMode: routine.scopeMode,
    linkedScopeId: routine.linkedScopeId,
    createdBy: newCreatedBy || routine.createdBy,
    teamIds: [], // Duplicated routine is private by default
  });
};

/**
 * Get routines created by a specific user
 */
export const getRoutinesByCreator = (userId: string): Routine[] => {
  const routines = getRoutines();
  return routines.filter(r => r.createdBy === userId);
};

/**
 * Get routines assigned to a team
 * Combines team.assignedRoutineIds and routines shared via routine.teamIds
 * This is the optimal approach: it includes both directly assigned routines and shared routines
 */
export const getTeamRoutines = (teamId: string, teamAssignedRoutineIds?: string[]): Routine[] => {
  const routines = getRoutines();
  const teamRoutineIds = new Set<string>();
  
  // Add routines from team.assignedRoutineIds (directly assigned)
  if (teamAssignedRoutineIds) {
    teamAssignedRoutineIds.forEach(id => teamRoutineIds.add(id));
  }
  
  // Add routines shared via routine.teamIds
  routines.forEach(routine => {
    const routineTeamIds = routine.teamIds || (routine.teamId ? [routine.teamId] : []);
    if (routineTeamIds.includes(teamId)) {
      teamRoutineIds.add(routine.id);
    }
  });
  
  return routines.filter(r => teamRoutineIds.has(r.id));
};

/**
 * Get count of routines assigned to a team
 */
export const getTeamRoutinesCount = (teamId: string, teamAssignedRoutineIds?: string[]): number => {
  return getTeamRoutines(teamId, teamAssignedRoutineIds).length;
};

/**
 * Get routines shared with a team
 */
export const getRoutinesByTeam = (teamId: string): Routine[] => {
  const routines = getRoutines();
  return routines.filter(r => {
    // Check new teamIds array
    if (r.teamIds && r.teamIds.length > 0) {
      return r.teamIds.includes(teamId);
    }
    // Fallback to legacy teamId for backward compatibility
    return r.teamId === teamId;
  });
};

/**
 * Get routines accessible to a user (created by them or shared with their team)
 */
export const getAccessibleRoutines = (userId: string, userTeamId?: string | null): Routine[] => {
  const routines = getRoutines();
  return routines.filter(r => {
    // User's own routines
    if (r.createdBy === userId) return true;
    // Routines shared with user's team
    if (userTeamId) {
      // Check new teamIds array
      if (r.teamIds && r.teamIds.length > 0) {
        return r.teamIds.includes(userTeamId);
      }
      // Fallback to legacy teamId for backward compatibility
      if (r.teamId === userTeamId) return true;
    }
    return false;
  });
};

