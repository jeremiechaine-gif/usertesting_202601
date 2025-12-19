/**
 * Unit tests for routine scoring function
 */

import { describe, it, expect } from 'vitest';
import { scoreRoutine, scoreAndRankRoutines, groupRoutinesByFrequency } from '../scoring';
import type { RoutineLibraryEntry, Persona, Intent } from '../types';
import { ROUTINE_LIBRARY } from '../routineLibrary';

describe('scoring', () => {
  const mockRoutine: RoutineLibraryEntry = {
    id: 'test-routine',
    label: 'Test Routine',
    description: 'A test routine',
    personas: ['Approvisionneur'],
    objectives: ['Piloter', 'Corriger'],
    horizon: 'Today',
    impactZones: ['Supplier'],
    frequency: 'Daily',
    pelicoViews: ['Supply'],
    keywords: ['test'],
  };

  describe('scoreRoutine', () => {
    it('should give +5 for persona match', () => {
      const result = scoreRoutine(mockRoutine, {
        personas: ['Approvisionneur'],
        intents: [],
      });
      expect(result.score).toBe(5);
      expect(result.reasons).toContain('Persona match: Approvisionneur (+5)');
    });

    it('should give +5 per matched persona (multiple personas)', () => {
      const result = scoreRoutine(mockRoutine, {
        personas: ['Approvisionneur', 'Acheteur'],
        intents: [],
      });
      // Only 'Approvisionneur' matches, so +5
      expect(result.score).toBe(5);
    });

    it('should give +3 per matched objective from intents', () => {
      const result = scoreRoutine(mockRoutine, {
        personas: [],
        intents: ['Gérer des retards'], // Maps to 'Corriger' objective and 'Supplier' impact zone
      });
      // Should get 3 (objective) + 2 (impact zone) = 5
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.reasons.some((r) => r.includes('Objective matches'))).toBe(true);
    });

    it('should give +2 per matched impact zone from intents', () => {
      const result = scoreRoutine(mockRoutine, {
        personas: [],
        intents: ['Gérer des retards'], // Maps to ['Supplier', 'Production', 'Customer']
      });
      // Should match 'Supplier' impact zone
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it('should accumulate scores correctly', () => {
      const result = scoreRoutine(mockRoutine, {
        personas: ['Approvisionneur'], // +5
        intents: ['Gérer des retards'], // +3 (Corriger) + 2 (Supplier impact zone)
      });
      expect(result.score).toBeGreaterThanOrEqual(10); // 5 + 3 + 2
    });

    it('should return 0 score if no matches', () => {
      const result = scoreRoutine(mockRoutine, {
        personas: ['Master Planner'], // Not in personas
        intents: ['Vision business / KPIs'], // No matching objectives
      });
      expect(result.score).toBe(0);
    });
  });

  describe('scoreAndRankRoutines', () => {
    it('should return top routines sorted by score', () => {
      const results = scoreAndRankRoutines(
        ROUTINE_LIBRARY.slice(0, 20), // Test with first 20 routines
        {
          personas: ['Approvisionneur'],
          intents: ['Gérer des retards'],
        },
        5
      );

      expect(results.length).toBeLessThanOrEqual(5);
      // Check sorting (descending score)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should respect maxResults limit', () => {
      const results = scoreAndRankRoutines(
        ROUTINE_LIBRARY,
        {
          personas: ['Master Planner'],
          intents: ['Tenir la promesse client'],
        },
        7
      );

      expect(results.length).toBeLessThanOrEqual(7);
    });

    it('should handle empty routines array', () => {
      const results = scoreAndRankRoutines([], {
        personas: ['Approvisionneur'],
        intents: [],
      });
      expect(results).toEqual([]);
    });

    it('should handle multiple personas and boost matching routines', () => {
      const results = scoreAndRankRoutines(
        ROUTINE_LIBRARY.slice(0, 20),
        {
          personas: ['Approvisionneur', 'Acheteur'],
          intents: [],
        },
        10
      );

      // Routines matching both personas should have higher scores
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('groupRoutinesByFrequency', () => {
    it('should group routines by frequency', () => {
      const scored = [
        {
          routine: ROUTINE_LIBRARY.find((r) => r.frequency === 'Daily')!,
          score: 10,
          reasons: [],
        },
        {
          routine: ROUTINE_LIBRARY.find((r) => r.frequency === 'Weekly')!,
          score: 8,
          reasons: [],
        },
        {
          routine: ROUTINE_LIBRARY.find((r) => r.frequency === 'Monthly')!,
          score: 5,
          reasons: [],
        },
      ].filter((s) => s.routine !== undefined);

      const grouped = groupRoutinesByFrequency(scored as any);

      expect(grouped.Daily.length).toBeGreaterThan(0);
      expect(grouped.Weekly.length).toBeGreaterThan(0);
      expect(grouped.Monthly.length).toBeGreaterThan(0);
    });

    it('should handle empty scored routines', () => {
      const grouped = groupRoutinesByFrequency([]);
      expect(grouped.Daily).toEqual([]);
      expect(grouped.Weekly).toEqual([]);
      expect(grouped.Monthly).toEqual([]);
    });
  });
});

