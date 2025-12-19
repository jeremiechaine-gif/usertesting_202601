/**
 * Routine Scoring Function
 * 
 * Computes relevance score for routines based on:
 * - Persona match: +5 points
 * - Objective match: +3 points per matched intent/objective
 * - Impact zone match: +2 points per matched impact zone
 * - Frequency preference: +1 point (if we add later)
 * 
 * Scoring is deterministic and testable.
 * 
 * To adjust weights:
 * - PERSONA_MATCH_SCORE: Increase for stronger persona preference
 * - OBJECTIVE_MATCH_SCORE: Increase for stronger intent matching
 * - IMPACT_ZONE_MATCH_SCORE: Increase for stronger impact zone relevance
 * - FREQUENCY_MATCH_SCORE: Increase if frequency preference is important
 */

import type {
  RoutineLibraryEntry,
  Persona,
  Intent,
  Frequency,
} from './types';
import {
  INTENT_TO_OBJECTIVES,
  INTENT_TO_IMPACT_ZONES,
} from './types';

// Scoring weights (adjustable)
const PERSONA_MATCH_SCORE = 5;
const OBJECTIVE_MATCH_SCORE = 3;
const IMPACT_ZONE_MATCH_SCORE = 2;
const FREQUENCY_MATCH_SCORE = 1; // Currently not used but available for future

export interface ScoringParams {
  persona: Persona | null;
  intents: Intent[];
  preferredFrequency?: Frequency | null;
}

export interface ScoredRoutine {
  routine: RoutineLibraryEntry;
  score: number;
  reasons: string[]; // For debugging/explanation
}

/**
 * Score a single routine against user selections
 */
export function scoreRoutine(
  routine: RoutineLibraryEntry,
  params: ScoringParams
): ScoredRoutine {
  const { persona, intents, preferredFrequency } = params;
  let score = 0;
  const reasons: string[] = [];

  // 1. Persona match (+5)
  if (persona && routine.personas.includes(persona)) {
    score += PERSONA_MATCH_SCORE;
    reasons.push(`Persona match: ${persona} (+${PERSONA_MATCH_SCORE})`);
  }

  // 2. Objective match from intents (+3 per match)
  const matchedObjectives = new Set<string>();
  for (const intent of intents) {
    const intentObjectives = INTENT_TO_OBJECTIVES[intent] || [];
    for (const objective of intentObjectives) {
      if (routine.objectives.includes(objective)) {
        matchedObjectives.add(objective);
      }
    }
  }
  const objectiveScore = matchedObjectives.size * OBJECTIVE_MATCH_SCORE;
  if (objectiveScore > 0) {
    score += objectiveScore;
    reasons.push(
      `Objective matches: ${Array.from(matchedObjectives).join(', ')} (+${objectiveScore})`
    );
  }

  // 3. Impact zone match from intents (+2 per match)
  const matchedImpactZones = new Set<string>();
  for (const intent of intents) {
    const intentImpactZones = INTENT_TO_IMPACT_ZONES[intent] || [];
    for (const impactZone of intentImpactZones) {
      if (routine.impactZones.includes(impactZone)) {
        matchedImpactZones.add(impactZone);
      }
    }
  }
  const impactZoneScore = matchedImpactZones.size * IMPACT_ZONE_MATCH_SCORE;
  if (impactZoneScore > 0) {
    score += impactZoneScore;
    reasons.push(
      `Impact zone matches: ${Array.from(matchedImpactZones).join(', ')} (+${impactZoneScore})`
    );
  }

  // 4. Frequency match (+1) - optional
  if (preferredFrequency && routine.frequency === preferredFrequency) {
    score += FREQUENCY_MATCH_SCORE;
    reasons.push(`Frequency match: ${preferredFrequency} (+${FREQUENCY_MATCH_SCORE})`);
  }

  return {
    routine,
    score,
    reasons,
  };
}

/**
 * Score all routines and return top N
 * 
 * @param routines - All routines to score
 * @param params - Scoring parameters
 * @param maxResults - Maximum number of results (default: 7)
 * @returns Sorted array of scored routines (highest score first)
 */
export function scoreAndRankRoutines(
  routines: RoutineLibraryEntry[],
  params: ScoringParams,
  maxResults: number = 7
): ScoredRoutine[] {
  const scored = routines.map((routine) => scoreRoutine(routine, params));

  // Sort by score (descending), then by label (alphabetical) for tie-breaking
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.routine.label.localeCompare(b.routine.label);
  });

  return scored.slice(0, maxResults);
}

/**
 * Group scored routines by frequency
 */
export function groupRoutinesByFrequency(
  scoredRoutines: ScoredRoutine[]
): {
  Daily: ScoredRoutine[];
  Weekly: ScoredRoutine[];
  Monthly: ScoredRoutine[];
} {
  const grouped = {
    Daily: [] as ScoredRoutine[],
    Weekly: [] as ScoredRoutine[],
    Monthly: [] as ScoredRoutine[],
  };

  for (const scored of scoredRoutines) {
    const frequency = scored.routine.frequency;
    if (frequency in grouped) {
      grouped[frequency as keyof typeof grouped].push(scored);
    }
  }

  return grouped;
}

