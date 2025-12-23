/**
 * State Adapters for Sorting & Filters Modal
 * Converts between TanStack Table state and modal draft state
 * 
 * These functions are pure and testable, ensuring consistent state conversion
 */

import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import type { SortConfig, FilterConfig } from '../SortingAndFiltersPopover';

/**
 * Convert TanStack SortingState to modal SortConfig[]
 */
export function tableStateToDraftSorting(sorting: SortingState): SortConfig[] {
  return sorting.map((sort, index) => ({
    id: `sort-${index}`,
    columnId: sort.id,
    direction: sort.desc ? 'desc' : 'asc',
  }));
}

/**
 * Convert modal SortConfig[] to TanStack SortingState
 */
export function draftSortingToTableState(draftSorting: SortConfig[]): SortingState {
  return draftSorting.map((sort) => ({
    id: sort.columnId,
    desc: sort.direction === 'desc',
  }));
}

/**
 * Convert TanStack ColumnFiltersState to modal FilterConfig[]
 * Handles complex filter values (with conditions, arrays, single values)
 */
export function tableStateToDraftFilters(columnFilters: ColumnFiltersState): FilterConfig[] {
  return columnFilters.map((filter) => {
    let values: (string | number)[] = [];
    
    if (Array.isArray(filter.value)) {
      // Filter array to only include strings and numbers
      values = filter.value.filter((v): v is string | number => 
        typeof v === 'string' || typeof v === 'number'
      );
    } else if (typeof filter.value === 'object' && filter.value !== null && 'values' in filter.value) {
      const objValue = filter.value as { values?: (string | number)[] };
      if (Array.isArray(objValue.values)) {
        values = objValue.values.filter((v): v is string | number => 
          typeof v === 'string' || typeof v === 'number'
        );
      }
    } else if (filter.value !== null && filter.value !== undefined) {
      // Single value - ensure it's string or number
      if (typeof filter.value === 'string' || typeof filter.value === 'number') {
        values = [filter.value];
      }
    }
    
    return {
      id: `filter-${filter.id}`,
      filterId: filter.id,
      values,
    };
  });
}

/**
 * Convert modal FilterConfig[] to TanStack ColumnFiltersState
 */
export function draftFiltersToTableState(draftFilters: FilterConfig[]): ColumnFiltersState {
  return draftFilters.map((filter) => ({
    id: filter.filterId,
    value: filter.values.length === 1 ? filter.values[0] : filter.values,
  }));
}

/**
 * Normalize filters for comparison (handles object vs array formats)
 * Used for detecting unsaved changes
 */
export function normalizeFiltersForComparison(filters: ColumnFiltersState) {
  return filters.map(f => ({
    id: f.id,
    value: typeof f.value === 'object' && f.value !== null 
      ? JSON.stringify(f.value) 
      : f.value
  })).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Check if two filter arrays are equivalent (for change detection)
 */
export function filtersEqual(filters1: ColumnFiltersState, filters2: ColumnFiltersState): boolean {
  const normalized1 = normalizeFiltersForComparison(filters1);
  const normalized2 = normalizeFiltersForComparison(filters2);
  return JSON.stringify(normalized1) === JSON.stringify(normalized2);
}

/**
 * Check if two sorting arrays are equivalent (for change detection)
 */
export function sortingEqual(sorting1: SortingState, sorting2: SortingState): boolean {
  return JSON.stringify(sorting1) === JSON.stringify(sorting2);
}




