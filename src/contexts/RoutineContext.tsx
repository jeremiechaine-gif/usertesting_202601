/**
 * Routine Context
 * Manages global routine state across the application
 * Provides refresh mechanism to sync all components when routines change
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { getRoutines, type Routine } from '@/lib/routines';

interface RoutineContextType {
  routines: Routine[];
  refreshRoutines: () => void;
  refreshKey: number; // Key to force re-renders in components using routines
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const useRoutine = () => {
  const context = useContext(RoutineContext);
  if (!context) {
    throw new Error('useRoutine must be used within RoutineProvider');
  }
  return context;
};

interface RoutineProviderProps {
  children: React.ReactNode;
}

export const RoutineProvider: React.FC<RoutineProviderProps> = ({ children }) => {
  const [routines, setRoutines] = useState<Routine[]>(() => getRoutines());
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshRoutines = useCallback(() => {
    const loadedRoutines = getRoutines();
    setRoutines(loadedRoutines);
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <RoutineContext.Provider
      value={{
        routines,
        refreshRoutines,
        refreshKey,
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
};

