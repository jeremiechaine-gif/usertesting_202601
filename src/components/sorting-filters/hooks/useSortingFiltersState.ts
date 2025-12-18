/**
 * Custom hook for managing sorting and filters draft state
 * Handles synchronization between table state and modal draft state
 */

import { useState, useEffect, useMemo } from 'react';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import type { SortConfig, FilterConfig } from '../../SortingAndFiltersPopover';
import {
  tableStateToDraftSorting,
  tableStateToDraftFilters,
  sortingEqual,
  filtersEqual,
} from '../stateAdapters';

interface UseSortingFiltersStateProps {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  modalOpen: boolean;
}

interface UseSortingFiltersStateReturn {
  draftSorting: SortConfig[];
  draftFilters: FilterConfig[];
  hasDraftChanges: boolean;
  setDraftSorting: React.Dispatch<React.SetStateAction<SortConfig[]>>;
  setDraftFilters: React.Dispatch<React.SetStateAction<FilterConfig[]>>;
  setHasDraftChanges: (value: boolean) => void;
}

/**
 * Manages draft state for sorting and filters modal
 * Syncs with table state when modal opens or table state changes
 */
export function useSortingFiltersState({
  sorting,
  columnFilters,
  modalOpen,
}: UseSortingFiltersStateProps): UseSortingFiltersStateReturn {
  const [draftSorting, setDraftSorting] = useState<SortConfig[]>([]);
  const [draftFilters, setDraftFilters] = useState<FilterConfig[]>([]);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);

  // Convert table state to draft state
  const currentDraftSorting = useMemo(
    () => tableStateToDraftSorting(sorting),
    [sorting]
  );
  const currentDraftFilters = useMemo(
    () => tableStateToDraftFilters(columnFilters),
    [columnFilters]
  );

  // Sync draft state with table state
  useEffect(() => {
    // Convert current draft state to table format for comparison
    const currentTableSorting = draftSorting.map((s) => ({
      id: s.columnId,
      desc: s.direction === 'desc',
    }));
    const sortingChanged = !sortingEqual(sorting, currentTableSorting);
    
    const currentTableFilters = draftFilters.map((f) => ({
      id: f.filterId,
      value: f.values.length === 1 ? f.values[0] : f.values,
    }));
    const filtersChanged = !filtersEqual(columnFilters, currentTableFilters);

    // Only update draft state if it differs from table state
    // This prevents unnecessary updates and potential infinite loops
    if (sortingChanged) {
      setDraftSorting(currentDraftSorting);
    }
    if (filtersChanged) {
      setDraftFilters(currentDraftFilters);
    }

    // If modal is opening, reset draft changes flag
    // If modal is already open and table state changed (from headers), mark as having changes
    if (!modalOpen) {
      setHasDraftChanges(false);
    } else if (modalOpen && (sortingChanged || filtersChanged)) {
      // Table state changed while modal is open (e.g., from column headers)
      // Keep hasDraftChanges as true if user had made changes, or set to true if change came from headers
      setHasDraftChanges(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting, columnFilters, modalOpen]);

  return {
    draftSorting,
    draftFilters,
    hasDraftChanges,
    setDraftSorting,
    setDraftFilters,
    setHasDraftChanges,
  };
}

