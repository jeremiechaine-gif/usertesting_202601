/**
 * Scope management utilities
 * Handles localStorage persistence for scopes
 */

export interface ScopeFilter {
  id: string;
  filterId: string;
  values: (string | number)[];
  condition?: string;
}

export interface Scope {
  id: string;
  name: string;
  description?: string;
  filters: ScopeFilter[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pelico-scopes';

export const getScopes = (): Scope[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveScopes = (scopes: Scope[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scopes));
  } catch (error) {
    console.error('Failed to save scopes:', error);
  }
};

export const createScope = (scope: Omit<Scope, 'id' | 'createdAt' | 'updatedAt'>): Scope => {
  const scopes = getScopes();
  const newScope: Scope = {
    ...scope,
    id: `scope-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  scopes.push(newScope);
  saveScopes(scopes);
  return newScope;
};

export const updateScope = (id: string, updates: Partial<Omit<Scope, 'id' | 'createdAt'>>): Scope | null => {
  const scopes = getScopes();
  const index = scopes.findIndex((s) => s.id === id);
  if (index === -1) return null;
  
  scopes[index] = {
    ...scopes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveScopes(scopes);
  return scopes[index];
};

export const deleteScope = (id: string): boolean => {
  const scopes = getScopes();
  const filtered = scopes.filter((s) => s.id !== id);
  if (filtered.length === scopes.length) return false;
  saveScopes(filtered);
  return true;
};

export const getScope = (id: string): Scope | null => {
  const scopes = getScopes();
  return scopes.find((s) => s.id === id) || null;
};

