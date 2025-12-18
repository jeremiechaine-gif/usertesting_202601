/**
 * Routine management utilities
 * Handles localStorage persistence for routines
 */

import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

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
  
  // Relation avec le scope
  scopeMode: 'scope-aware' | 'scope-fixed';
  linkedScopeId?: string | null; // Scope lié (si scope-fixed)
  
  // Métadonnées
  createdBy?: string;
  sharedWith?: string[];
  isShared?: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pelico-routines';

export const getRoutines = (): Routine[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
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

export const duplicateRoutine = (id: string): Routine | null => {
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
    createdBy: routine.createdBy,
    sharedWith: [],
    isShared: false,
  });
};

