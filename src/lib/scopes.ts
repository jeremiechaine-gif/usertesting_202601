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
  isDefault?: boolean; // Scope par défaut pour l'utilisateur
  userId?: string; // Utilisateur propriétaire (pour multi-utilisateurs)
  isGlobal?: boolean; // Scope global vs personnel
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pelico-scopes';

/**
 * Validate scope data structure
 */
function isValidScope(scope: unknown): scope is Scope {
  if (!scope || typeof scope !== 'object') return false;
  const s = scope as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    Array.isArray(s.filters) &&
    typeof s.createdAt === 'string' &&
    typeof s.updatedAt === 'string'
  );
}

export const getScopes = (): Scope[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('Invalid scopes data format: expected array');
      return [];
    }
    
    // Validate and filter out invalid scopes
    const validScopes = parsed.filter(isValidScope);
    if (validScopes.length !== parsed.length) {
      console.warn(`Filtered out ${parsed.length - validScopes.length} invalid scopes`);
    }
    
    return validScopes;
  } catch (error) {
    console.error('Error loading scopes from localStorage:', error);
    // Try to clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore cleanup errors
    }
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

export const getDefaultScope = (): Scope | null => {
  const scopes = getScopes();
  return scopes.find((s) => s.isDefault === true) || null;
};

export const setDefaultScope = (id: string): boolean => {
  const scopes = getScopes();
  // Retirer le flag isDefault de tous les scopes
  scopes.forEach((s) => {
    if (s.isDefault) {
      s.isDefault = false;
    }
  });
  // Définir le nouveau scope par défaut
  const scope = scopes.find((s) => s.id === id);
  if (scope) {
    scope.isDefault = true;
    saveScopes(scopes);
    return true;
  }
  return false;
};

const CURRENT_SCOPE_KEY = 'pelico-current-scope';

export const getCurrentScopeId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CURRENT_SCOPE_KEY);
  } catch {
    return null;
  }
};

export const setCurrentScopeId = (id: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(CURRENT_SCOPE_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_SCOPE_KEY);
    }
  } catch (error) {
    console.error('Failed to save current scope:', error);
  }
};

export const shareScope = (id: string): string | null => {
  const scope = getScope(id);
  if (!scope) return null;
  
  // Generate shareable link (in a real app, this would be a server endpoint)
  const shareToken = btoa(JSON.stringify({ type: 'scope', id, timestamp: Date.now() }));
  return `${window.location.origin}/share/${shareToken}`;
};

export const duplicateScope = (id: string): Scope | null => {
  const scope = getScope(id);
  if (!scope) return null;
  
  return createScope({
    name: `${scope.name} (Copy)`,
    description: scope.description,
    filters: scope.filters.map(f => ({ ...f, id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` })),
    isDefault: false,
    userId: scope.userId,
    isGlobal: scope.isGlobal,
  });
};

