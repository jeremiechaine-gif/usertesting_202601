/**
 * Tests for state adapters
 * Ensures correct conversion between TanStack Table state and modal draft state
 */

import { describe, it, expect } from 'vitest';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import {
  tableStateToDraftSorting,
  draftSortingToTableState,
  tableStateToDraftFilters,
  draftFiltersToTableState,
  sortingEqual,
  filtersEqual,
} from '../stateAdapters';

describe('stateAdapters', () => {
  describe('tableStateToDraftSorting', () => {
    it('should convert empty sorting state to empty array', () => {
      const sorting: SortingState = [];
      const result = tableStateToDraftSorting(sorting);
      expect(result).toEqual([]);
    });

    it('should convert single sort to draft config', () => {
      const sorting: SortingState = [{ id: 'partName', desc: false }];
      const result = tableStateToDraftSorting(sorting);
      expect(result).toEqual([
        { id: 'sort-0', columnId: 'partName', direction: 'asc' },
      ]);
    });

    it('should convert descending sort correctly', () => {
      const sorting: SortingState = [{ id: 'price', desc: true }];
      const result = tableStateToDraftSorting(sorting);
      expect(result).toEqual([
        { id: 'sort-0', columnId: 'price', direction: 'desc' },
      ]);
    });

    it('should convert multi-sort correctly', () => {
      const sorting: SortingState = [
        { id: 'partName', desc: false },
        { id: 'price', desc: true },
      ];
      const result = tableStateToDraftSorting(sorting);
      expect(result).toEqual([
        { id: 'sort-0', columnId: 'partName', direction: 'asc' },
        { id: 'sort-1', columnId: 'price', direction: 'desc' },
      ]);
    });
  });

  describe('draftSortingToTableState', () => {
    it('should convert empty draft sorting to empty array', () => {
      const result = draftSortingToTableState([]);
      expect(result).toEqual([]);
    });

    it('should convert single draft sort to table state', () => {
      const result = draftSortingToTableState([
        { id: 'sort-0', columnId: 'partName', direction: 'asc' },
      ]);
      expect(result).toEqual([{ id: 'partName', desc: false }]);
    });

    it('should convert descending draft sort correctly', () => {
      const result = draftSortingToTableState([
        { id: 'sort-0', columnId: 'price', direction: 'desc' },
      ]);
      expect(result).toEqual([{ id: 'price', desc: true }]);
    });

    it('should convert multi-sort correctly', () => {
      const result = draftSortingToTableState([
        { id: 'sort-0', columnId: 'partName', direction: 'asc' },
        { id: 'sort-1', columnId: 'price', direction: 'desc' },
      ]);
      expect(result).toEqual([
        { id: 'partName', desc: false },
        { id: 'price', desc: true },
      ]);
    });
  });

  describe('round-trip conversion (sorting)', () => {
    it('should maintain data integrity through round-trip', () => {
      const original: SortingState = [
        { id: 'partName', desc: false },
        { id: 'price', desc: true },
      ];
      const draft = tableStateToDraftSorting(original);
      const converted = draftSortingToTableState(draft);
      expect(converted).toEqual(original);
    });
  });

  describe('tableStateToDraftFilters', () => {
    it('should convert empty filters to empty array', () => {
      const filters: ColumnFiltersState = [];
      const result = tableStateToDraftFilters(filters);
      expect(result).toEqual([]);
    });

    it('should convert single string value filter', () => {
      const filters: ColumnFiltersState = [
        { id: 'partName', value: 'test' },
      ];
      const result = tableStateToDraftFilters(filters);
      expect(result).toEqual([
        { id: 'filter-partName', filterId: 'partName', values: ['test'] },
      ]);
    });

    it('should convert single number value filter', () => {
      const filters: ColumnFiltersState = [{ id: 'price', value: 100 }];
      const result = tableStateToDraftFilters(filters);
      expect(result).toEqual([
        { id: 'filter-price', filterId: 'price', values: [100] },
      ]);
    });

    it('should convert array of values', () => {
      const filters: ColumnFiltersState = [
        { id: 'partName', value: ['test1', 'test2'] },
      ];
      const result = tableStateToDraftFilters(filters);
      expect(result).toEqual([
        {
          id: 'filter-partName',
          filterId: 'partName',
          values: ['test1', 'test2'],
        },
      ]);
    });

    it('should handle object with values property', () => {
      const filters: ColumnFiltersState = [
        { id: 'partName', value: { values: ['test1', 'test2'] } },
      ];
      const result = tableStateToDraftFilters(filters);
      expect(result).toEqual([
        {
          id: 'filter-partName',
          filterId: 'partName',
          values: ['test1', 'test2'],
        },
      ]);
    });

    it('should filter out non-string/number values from arrays', () => {
      const filters: ColumnFiltersState = [
        { id: 'partName', value: ['test', null, undefined, 123, 'test2'] },
      ];
      const result = tableStateToDraftFilters(filters);
      expect(result).toEqual([
        {
          id: 'filter-partName',
          filterId: 'partName',
          values: ['test', 123, 'test2'],
        },
      ]);
    });

    it('should handle multiple filters', () => {
      const filters: ColumnFiltersState = [
        { id: 'partName', value: 'test' },
        { id: 'price', value: 100 },
      ];
      const result = tableStateToDraftFilters(filters);
      expect(result).toEqual([
        { id: 'filter-partName', filterId: 'partName', values: ['test'] },
        { id: 'filter-price', filterId: 'price', values: [100] },
      ]);
    });
  });

  describe('draftFiltersToTableState', () => {
    it('should convert empty filters to empty array', () => {
      const result = draftFiltersToTableState([]);
      expect(result).toEqual([]);
    });

    it('should convert single value to single value filter', () => {
      const result = draftFiltersToTableState([
        { id: 'filter-partName', filterId: 'partName', values: ['test'] },
      ]);
      expect(result).toEqual([{ id: 'partName', value: 'test' }]);
    });

    it('should convert multiple values to array filter', () => {
      const result = draftFiltersToTableState([
        {
          id: 'filter-partName',
          filterId: 'partName',
          values: ['test1', 'test2'],
        },
      ]);
      expect(result).toEqual([
        { id: 'partName', value: ['test1', 'test2'] },
      ]);
    });

    it('should handle multiple filters', () => {
      const result = draftFiltersToTableState([
        { id: 'filter-partName', filterId: 'partName', values: ['test'] },
        { id: 'filter-price', filterId: 'price', values: [100] },
      ]);
      expect(result).toEqual([
        { id: 'partName', value: 'test' },
        { id: 'price', value: 100 },
      ]);
    });
  });

  describe('round-trip conversion (filters)', () => {
    it('should maintain data integrity through round-trip (single value)', () => {
      const original: ColumnFiltersState = [
        { id: 'partName', value: 'test' },
      ];
      const draft = tableStateToDraftFilters(original);
      const converted = draftFiltersToTableState(draft);
      expect(converted).toEqual(original);
    });

    it('should maintain data integrity through round-trip (array values)', () => {
      const original: ColumnFiltersState = [
        { id: 'partName', value: ['test1', 'test2'] },
      ];
      const draft = tableStateToDraftFilters(original);
      const converted = draftFiltersToTableState(draft);
      expect(converted).toEqual(original);
    });
  });

  describe('sortingEqual', () => {
    it('should return true for identical sorting states', () => {
      const sorting1: SortingState = [{ id: 'partName', desc: false }];
      const sorting2: SortingState = [{ id: 'partName', desc: false }];
      expect(sortingEqual(sorting1, sorting2)).toBe(true);
    });

    it('should return false for different sorting states', () => {
      const sorting1: SortingState = [{ id: 'partName', desc: false }];
      const sorting2: SortingState = [{ id: 'partName', desc: true }];
      expect(sortingEqual(sorting1, sorting2)).toBe(false);
    });

    it('should return false for different column IDs', () => {
      const sorting1: SortingState = [{ id: 'partName', desc: false }];
      const sorting2: SortingState = [{ id: 'price', desc: false }];
      expect(sortingEqual(sorting1, sorting2)).toBe(false);
    });

    it('should return true for empty arrays', () => {
      expect(sortingEqual([], [])).toBe(true);
    });
  });

  describe('filtersEqual', () => {
    it('should return true for identical filter states', () => {
      const filters1: ColumnFiltersState = [
        { id: 'partName', value: 'test' },
      ];
      const filters2: ColumnFiltersState = [
        { id: 'partName', value: 'test' },
      ];
      expect(filtersEqual(filters1, filters2)).toBe(true);
    });

    it('should return false for different filter values', () => {
      const filters1: ColumnFiltersState = [
        { id: 'partName', value: 'test1' },
      ];
      const filters2: ColumnFiltersState = [
        { id: 'partName', value: 'test2' },
      ];
      expect(filtersEqual(filters1, filters2)).toBe(false);
    });

    it('should return false for different filter IDs', () => {
      const filters1: ColumnFiltersState = [
        { id: 'partName', value: 'test' },
      ];
      const filters2: ColumnFiltersState = [{ id: 'price', value: 'test' }];
      expect(filtersEqual(filters1, filters2)).toBe(false);
    });

    it('should handle array values correctly', () => {
      const filters1: ColumnFiltersState = [
        { id: 'partName', value: ['test1', 'test2'] },
      ];
      const filters2: ColumnFiltersState = [
        { id: 'partName', value: ['test1', 'test2'] },
      ];
      expect(filtersEqual(filters1, filters2)).toBe(true);
    });

    it('should return true for empty arrays', () => {
      expect(filtersEqual([], [])).toBe(true);
    });

    it('should handle object values correctly', () => {
      const filters1: ColumnFiltersState = [
        { id: 'partName', value: { values: ['test1'] } },
      ];
      const filters2: ColumnFiltersState = [
        { id: 'partName', value: { values: ['test1'] } },
      ];
      expect(filtersEqual(filters1, filters2)).toBe(true);
    });
  });
});

