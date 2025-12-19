/**
 * Scope Context
 * Manages global scope state across the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getScopes, 
  getCurrentScopeId, 
  setCurrentScopeId as saveCurrentScopeId,
  getDefaultScope,
  type Scope 
} from '@/lib/scopes';
import type { ColumnFiltersState } from '@tanstack/react-table';

interface ScopeContextType {
  currentScopeId: string | null;
  setCurrentScopeId: (id: string | null) => void;
  currentScope: Scope | null;
  scopes: Scope[];
  refreshScopes: () => void;
  getScopeFilters: () => ColumnFiltersState;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export const useScope = () => {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error('useScope must be used within ScopeProvider');
  }
  return context;
};

interface ScopeProviderProps {
  children: React.ReactNode;
}

export const ScopeProvider: React.FC<ScopeProviderProps> = ({ children }) => {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [currentScopeId, setCurrentScopeIdState] = useState<string | null>(null);

  // Load scopes and current scope on mount
  useEffect(() => {
    const loadedScopes = getScopes();
    setScopes(loadedScopes);

    // Try to load current scope from localStorage
    const savedScopeId = getCurrentScopeId();
    if (savedScopeId) {
      // Verify the scope still exists
      const scopeExists = loadedScopes.some((s) => s.id === savedScopeId);
      if (scopeExists) {
        setCurrentScopeIdState(savedScopeId);
      } else {
        // If saved scope doesn't exist, try default scope
        const defaultScope = getDefaultScope();
        if (defaultScope) {
          setCurrentScopeIdState(defaultScope.id);
          saveCurrentScopeId(defaultScope.id);
        } else {
          saveCurrentScopeId(null);
        }
      }
    } else {
      // No saved scope, try default scope
      const defaultScope = getDefaultScope();
      if (defaultScope) {
        setCurrentScopeIdState(defaultScope.id);
        saveCurrentScopeId(defaultScope.id);
      }
    }
  }, []);

  const setCurrentScopeId = useCallback((id: string | null) => {
    setCurrentScopeIdState(id);
    saveCurrentScopeId(id);
  }, []);

  const refreshScopes = useCallback(() => {
    const loadedScopes = getScopes();
    setScopes(loadedScopes);
    
    // Verify current scope still exists
    if (currentScopeId) {
      const scopeExists = loadedScopes.some((s) => s.id === currentScopeId);
      if (!scopeExists) {
        // Current scope was deleted, try default or clear
        const defaultScope = getDefaultScope();
        if (defaultScope) {
          setCurrentScopeId(defaultScope.id);
        } else {
          setCurrentScopeId(null);
        }
      }
    }
  }, [currentScopeId, setCurrentScopeId]);

  // Memoize currentScope to prevent unnecessary recalculations
  const currentScope = useMemo(() => {
    return currentScopeId 
      ? scopes.find((s) => s.id === currentScopeId) || null
      : null;
  }, [currentScopeId, scopes]);

  const getScopeFilters = useCallback((): ColumnFiltersState => {
    if (!currentScope || currentScope.filters.length === 0) {
      return [];
    }
    
    // Convert scope filters to table filters format
    return currentScope.filters
      .filter((filter) => filter.values.length > 0)
      .map((filter) => ({
        id: filter.filterId,
        value: filter.condition
          ? { condition: filter.condition, values: filter.values }
          : filter.values,
      }));
  }, [currentScope]);

  return (
    <ScopeContext.Provider
      value={{
        currentScopeId,
        setCurrentScopeId,
        currentScope,
        scopes,
        refreshScopes,
        getScopeFilters,
      }}
    >
      {children}
    </ScopeContext.Provider>
  );
};


