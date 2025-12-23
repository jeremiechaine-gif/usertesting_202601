/**
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import type { ColumnDef } from '@tanstack/react-table';
import type { FilterDefinition } from '../../SortingAndFiltersPopover';
import {
  getColumnLabel,
  getSortableColumns,
  groupFilterDefinitions,
  filterSearchResults,
  getColumnIdFromFilterId,
  getFilterDisplayValues,
} from '../utils';

describe('utils', () => {
  describe('getColumnLabel', () => {
    const columns: ColumnDef<any>[] = [
      { id: 'partName', header: 'Part Name' },
      { id: 'price', header: () => 'Price' },
      { id: 'type', header: 'Type' },
    ];

    it('should return header string for string headers', () => {
      expect(getColumnLabel('partName', columns)).toBe('Part Name');
    });

    it('should return column ID when header is function', () => {
      expect(getColumnLabel('price', columns)).toBe('price');
    });

    it('should return column ID when column not found', () => {
      expect(getColumnLabel('nonexistent', columns)).toBe('nonexistent');
    });
  });

  describe('getSortableColumns', () => {
    it('should return only sortable columns', () => {
      const columns: ColumnDef<any>[] = [
        { id: 'partName', header: 'Part Name', enableSorting: true },
        { id: 'price', header: 'Price', enableSorting: false },
        { id: 'type', header: 'Type' }, // enableSorting defaults to true
      ];
      const result = getSortableColumns(columns);
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id)).toContain('partName');
      expect(result.map((c) => c.id)).toContain('type');
      expect(result.map((c) => c.id)).not.toContain('price');
    });

    it('should handle nested columns', () => {
      const columns: ColumnDef<any>[] = [
        { id: 'partName', header: 'Part Name' },
        {
          id: 'group',
          header: 'Group',
          columns: [
            { id: 'nested1', header: 'Nested 1' },
            { id: 'nested2', header: 'Nested 2', enableSorting: false },
          ],
        },
      ];
      const result = getSortableColumns(columns);
      expect(result.map((c) => c.id)).toContain('partName');
      expect(result.map((c) => c.id)).toContain('nested1');
      expect(result.map((c) => c.id)).not.toContain('nested2');
    });
  });

  describe('groupFilterDefinitions', () => {
    const filterDefinitions: FilterDefinition[] = [
      {
        id: 'favorite1',
        label: 'Favorite 1',
        category: 'favorites',
        type: 'text',
        isFavorite: true,
      },
      {
        id: 'general1',
        label: 'General 1',
        category: 'general',
        type: 'text',
      },
      {
        id: 'consumed1',
        label: 'Consumed 1',
        category: 'consumed-parts',
        type: 'text',
      },
      {
        id: 'produced1',
        label: 'Produced 1',
        category: 'produced-parts',
        type: 'text',
      },
    ];

    it('should group filters correctly', () => {
      const result = groupFilterDefinitions(filterDefinitions);
      expect(result.favorites).toHaveLength(1);
      expect(result.favorites[0].id).toBe('favorite1');
      expect(result.general).toHaveLength(1);
      expect(result.general[0].id).toBe('general1');
      expect(result.consumedParts).toHaveLength(1);
      expect(result.consumedParts[0].id).toBe('consumed1');
      expect(result.producedParts).toHaveLength(1);
      expect(result.producedParts[0].id).toBe('produced1');
    });
  });

  describe('filterSearchResults', () => {
    const filterDefinitions: FilterDefinition[] = [
      { id: 'part-name', label: 'Part Name', category: 'general', type: 'text' },
      { id: 'price', label: 'Price', category: 'general', type: 'number' },
      { id: 'type', label: 'Type', category: 'general', type: 'select' },
    ];

    it('should return all filters when search is empty', () => {
      const result = filterSearchResults(filterDefinitions, '');
      expect(result).toHaveLength(3);
    });

    it('should filter by label', () => {
      const result = filterSearchResults(filterDefinitions, 'Part');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('part-name');
    });

    it('should filter by ID', () => {
      const result = filterSearchResults(filterDefinitions, 'price');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('price');
    });

    it('should be case insensitive', () => {
      const result = filterSearchResults(filterDefinitions, 'PART');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('part-name');
    });

    it('should return empty array for no matches', () => {
      const result = filterSearchResults(filterDefinitions, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('getColumnIdFromFilterId', () => {
    it('should map filter IDs to column IDs', () => {
      expect(getColumnIdFromFilterId('part-name')).toBe('partName');
      expect(getColumnIdFromFilterId('part-number')).toBe('partNumber');
      expect(getColumnIdFromFilterId('delivery-status')).toBe('deliveryStatus');
    });

    it('should return null for unknown filter IDs', () => {
      expect(getColumnIdFromFilterId('unknown-filter')).toBeNull();
    });
  });

  describe('getFilterDisplayValues', () => {
    const filterDef: FilterDefinition = {
      id: 'type',
      label: 'Type',
      category: 'general',
      type: 'select',
      options: [
        { label: 'Type A', value: 'A' },
        { label: 'Type B', value: 'B' },
      ],
    };

    it('should return display labels for values with options', () => {
      const result = getFilterDisplayValues(
        { values: ['A', 'B'] },
        filterDef
      );
      expect(result).toEqual(['Type A', 'Type B']);
    });

    it('should return string values when no filter definition', () => {
      const result = getFilterDisplayValues({ values: ['A', 'B'] }, undefined);
      expect(result).toEqual(['A', 'B']);
    });

    it('should return string values when no options', () => {
      const filterDefNoOptions: FilterDefinition = {
        id: 'type',
        label: 'Type',
        category: 'general',
        type: 'text',
      };
      const result = getFilterDisplayValues(
        { values: ['test'] },
        filterDefNoOptions
      );
      expect(result).toEqual(['test']);
    });

    it('should handle mixed string and number values', () => {
      const result = getFilterDisplayValues(
        { values: ['A', 123] },
        filterDef
      );
      expect(result).toEqual(['Type A', '123']);
    });
  });
});




