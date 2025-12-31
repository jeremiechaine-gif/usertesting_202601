/**
 * Scope management utilities
 * Handles localStorage persistence for scopes
 */

import { getUsers, type User } from './users';
import { getTeams, type Team } from './teams';

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
  templateId?: string; // ID du template d'origine (si c'est une instance personnalisée)
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
    templateId: scope.templateId, // Preserve templateId if duplicating an instance
  });
};

/**
 * Get all scope templates (scopes without templateId, i.e., not instances)
 */
export const getScopeTemplates = (): Scope[] => {
  return getScopes().filter(scope => !scope.templateId);
};

/**
 * Get all scope instances (scopes with templateId)
 */
export const getScopeInstances = (): Scope[] => {
  return getScopes().filter(scope => scope.templateId);
};

/**
 * Get instances for a specific template
 */
export const getInstancesForTemplate = (templateId: string): Scope[] => {
  return getScopes().filter(scope => scope.templateId === templateId);
};

/**
 * Check if a scope is a template (not an instance)
 */
export const isTemplate = (scope: Scope): boolean => {
  return !scope.templateId;
};

/**
 * Check if a scope is an instance (has templateId)
 */
export const isInstance = (scope: Scope): boolean => {
  return !!scope.templateId;
};

/**
 * Create a scope instance from a template
 * @param templateId The ID of the template to create an instance from
 * @param userId The user ID who will own this instance
 * @param customizations Optional customizations to apply to the instance
 */
export const createInstanceFromTemplate = (
  templateId: string,
  userId: string,
  customizations?: Partial<Pick<Scope, 'name' | 'description' | 'filters'>>
): Scope | null => {
  const template = getScope(templateId);
  if (!template || template.templateId) {
    // Template doesn't exist or is itself an instance
    return null;
  }
  
  return createScope({
    name: customizations?.name || template.name,
    description: customizations?.description !== undefined ? customizations.description : template.description,
    filters: customizations?.filters || template.filters.map(f => ({ ...f, id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` })),
    isDefault: false,
    userId: userId,
    isGlobal: false, // Instances are never global
    templateId: templateId, // Link to the template
  });
};

/**
 * Check if a template has instances
 */
export const templateHasInstances = (templateId: string): boolean => {
  return getInstancesForTemplate(templateId).length > 0;
};

/**
 * Get all users assigned to a scope (directly or via team)
 */
export const getUsersAssignedToScope = (scopeId: string): Array<{ user: User; assignmentType: 'direct' | 'via-team'; teamName?: string }> => {
  const users = getUsers();
  const teams = getTeams();
  
  const assignedUsers: Array<{ user: User; assignmentType: 'direct' | 'via-team'; teamName?: string }> = [];
  const addedUserIds = new Set<string>();
  
  // Users with direct scope assignment
  users.forEach((user) => {
    if (user.assignedScopeIds?.includes(scopeId)) {
      assignedUsers.push({ user, assignmentType: 'direct' });
      addedUserIds.add(user.id);
    }
  });
  
  // Users via team assignment
  teams.forEach((team) => {
    if (team.assignedScopeIds?.includes(scopeId)) {
      const teamUsers = users.filter((u) => u.teamId === team.id);
      teamUsers.forEach((user) => {
        if (!addedUserIds.has(user.id)) {
          assignedUsers.push({ user, assignmentType: 'via-team', teamName: team.name });
          addedUserIds.add(user.id);
        }
      });
    }
  });
  
  return assignedUsers;
};
