/**
 * Tests for routine management utilities
 * Critical: Filter merging, routine application, state persistence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRoutine,
  getRoutine,
  updateRoutine,
  deleteRoutine,
  mergeFilters,
} from '../routines';
import type { ColumnFiltersState } from '@tanstack/react-table';

describe('Routine Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('CRUD Operations', () => {
    it('should create a routine', () => {
      const routine = createRoutine({
        name: 'Test Routine',
        description: 'Test description',
        filters: [],
        sorting: [],
        scopeMode: 'scope-aware',
        createdBy: 'test-user-id',
      });

      expect(routine.id).toBeDefined();
      expect(routine.name).toBe('Test Routine');
      expect(routine.createdAt).toBeDefined();
      expect(routine.updatedAt).toBeDefined();
    });

    it('should get a routine by ID', () => {
      const routine = createRoutine({
        name: 'Test Routine',
        filters: [],
        sorting: [],
        scopeMode: 'scope-aware',
        createdBy: 'test-user-id',
      });

      const retrieved = getRoutine(routine.id);
      expect(retrieved).toEqual(routine);
    });

    it('should update a routine', () => {
      const routine = createRoutine({
        name: 'Test Routine',
        filters: [],
        sorting: [],
        scopeMode: 'scope-aware',
        createdBy: 'test-user-id',
      });

      const originalUpdatedAt = routine.updatedAt;
      
      // Small delay to ensure timestamp difference
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const updated = updateRoutine(routine.id, { name: 'Updated Name' });
          expect(updated?.name).toBe('Updated Name');
          expect(updated?.updatedAt).toBeDefined();
          expect(new Date(updated?.updatedAt || '').getTime()).toBeGreaterThanOrEqual(
            new Date(originalUpdatedAt).getTime()
          );
          resolve();
        }, 10);
      });
    });

    it('should delete a routine', () => {
      const routine = createRoutine({
        name: 'Test Routine',
        filters: [],
        sorting: [],
        scopeMode: 'scope-aware',
        createdBy: 'test-user-id',
      });

      const deleted = deleteRoutine(routine.id);
      expect(deleted).toBe(true);
      expect(getRoutine(routine.id)).toBeNull();
    });
  });

  describe('Filter Merging', () => {
    it('should merge routine filters with scope filters', () => {
      const routineFilters: ColumnFiltersState = [
        { id: 'column1', value: ['value1'] },
        { id: 'column2', value: ['value2'] },
      ];

      const scopeFilters: ColumnFiltersState = [
        { id: 'column2', value: ['scopeValue'] }, // Should be overridden
        { id: 'column3', value: ['value3'] }, // Should be added
      ];

      const merged = mergeFilters(routineFilters, scopeFilters);

      expect(merged).toHaveLength(3);
      expect(merged.find((f) => f.id === 'column1')?.value).toEqual(['value1']);
      expect(merged.find((f) => f.id === 'column2')?.value).toEqual(['value2']); // Routine wins
      expect(merged.find((f) => f.id === 'column3')?.value).toEqual(['value3']);
    });

    it('should handle empty filters', () => {
      const merged = mergeFilters([], []);
      expect(merged).toEqual([]);
    });

    it('should handle complex filter values with conditions', () => {
      const routineFilters: ColumnFiltersState = [
        {
          id: 'column1',
          value: { condition: 'isNot', values: ['value1'] },
        },
      ];

      const scopeFilters: ColumnFiltersState = [
        { id: 'column2', value: ['value2'] },
      ];

      const merged = mergeFilters(routineFilters, scopeFilters);
      expect(merged).toHaveLength(2);
      expect(merged.find((f) => f.id === 'column1')?.value).toEqual({
        condition: 'isNot',
        values: ['value1'],
      });
    });
  });
});

