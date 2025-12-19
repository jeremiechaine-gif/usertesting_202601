/**
 * Custom hook for managing table state
 * Extracts common table state management logic
 * 
 * @example
 * const { sorting, setSorting, filters, setFilters } = useTableState();
 */
import { useState, useCallback } from 'react';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface UseTableStateOptions {
  initialSorting?: SortingState;
  initialFilters?: ColumnFiltersState;
}

interface UseTableStateReturn {
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  filters: ColumnFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  resetState: () => void;
}

export function useTableState(options: UseTableStateOptions = {}): UseTableStateReturn {
  const { initialSorting = [], initialFilters = [] } = options;

  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [filters, setFilters] = useState<ColumnFiltersState>(initialFilters);

  const resetState = useCallback(() => {
    setSorting([]);
    setFilters([]);
  }, []);

  return {
    sorting,
    setSorting,
    filters,
    setFilters,
    resetState,
  };
}

