/**
 * Onboarding Routine Builder - Type Definitions
 * 
 * UX Logic:
 * - Step 1: Role selection preselects default routines
 * - Step 2: Intent-based refinement scores routines by matching objectives
 * - Step 3: Concrete review shows top-scored routines grouped by frequency
 * 
 * Data Model:
 * - Normalized routine library with tags for multiple entry points
 * - Default sets per persona (list of routine IDs)
 * - Scoring function computes relevance based on persona + intents
 */

export type Persona =
  | 'Approvisionneur'
  | 'Acheteur'
  | 'Manager Appro'
  | 'Ordonnanceur Assemblage'
  | 'Ordonnanceur'
  | 'Master Planner'
  | 'Support Logistique'
  | 'Recette'
  | 'Responsable Supply Chain'
  | 'Directeur Supply Chain'
  | 'Responsable Ordo & Support log'
  | 'Autre / Mixte';

export type Objective = 'Anticiper' | 'Piloter' | 'Corriger' | 'Arbitrer' | 'Reporter';

export type Horizon = 'Today' | 'ThisWeek' | 'Projection';

export type ImpactZone = 'Supplier' | 'Production' | 'Customer' | 'Business';

export type Frequency = 'Daily' | 'Weekly' | 'Monthly';

export type PelicoView =
  | 'Supply'
  | 'Production Control'
  | 'Customer Support'
  | 'Escalation Room'
  | 'Value Engineering'
  | 'Event Explorer'
  | 'Simulation';

export type Intent =
  | 'Gérer des retards'
  | 'Anticiper des risques'
  | 'Prioriser des actions'
  | 'Tenir la promesse client'
  | 'Piloter la charge / la prod'
  | 'Vision business / KPIs';

/**
 * Routine Library Entry
 * Normalized structure supporting multiple personas and discovery paths
 */
export interface RoutineLibraryEntry {
  id: string; // Stable identifier (e.g., 'commandes-sans-ar')
  label: string; // Short neutral name (e.g., 'Commandes sans AR')
  description: string; // 1 line, value-oriented
  personas: Persona[]; // Primary + secondary personas
  objectives: Objective[]; // What this routine helps achieve
  horizon: Horizon;
  impactZones: ImpactZone[];
  frequency: Frequency;
  pelicoViews: PelicoView[];
  keywords: string[]; // For search (e.g., ['AR', 'acknowledgement', 'fournisseur'])
}

/**
 * Default routine sets per persona
 * Maps persona to list of routine IDs that should be preselected
 */
export type PersonaDefaultSets = Record<Persona, string[]>;

/**
 * Intent to Objective mapping
 * Maps user-selected intents to objectives for scoring
 */
export const INTENT_TO_OBJECTIVES: Record<Intent, Objective[]> = {
  'Gérer des retards': ['Corriger'],
  'Anticiper des risques': ['Anticiper'],
  'Prioriser des actions': ['Arbitrer', 'Piloter'],
  'Tenir la promesse client': ['Piloter', 'Reporter'],
  'Piloter la charge / la prod': ['Piloter'],
  'Vision business / KPIs': ['Reporter', 'Arbitrer'],
};

/**
 * Intent to Impact Zone mapping
 * Maps user-selected intents to impact zones for scoring
 */
export const INTENT_TO_IMPACT_ZONES: Record<Intent, ImpactZone[]> = {
  'Gérer des retards': ['Supplier', 'Production', 'Customer'],
  'Anticiper des risques': ['Supplier', 'Production', 'Customer'],
  'Prioriser des actions': ['Supplier', 'Production', 'Customer', 'Business'],
  'Tenir la promesse client': ['Customer'],
  'Piloter la charge / la prod': ['Production'],
  'Vision business / KPIs': ['Business'],
};

/**
 * Onboarding state persisted to localStorage
 */
export interface OnboardingState {
  selectedPersona: Persona | null;
  selectedIntents: Intent[];
  selectedRoutineIds: string[];
}

