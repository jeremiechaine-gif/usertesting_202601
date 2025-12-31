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
 * - Default sets per Role profile (list of routine IDs)
 * - Scoring function computes relevance based on Role profile + intents
 */

export type Persona =
  | 'Supply Planner'
  | 'Buyer'
  | 'Procurement Manager'
  | 'Assembly Scheduler'
  | 'Scheduler'
  | 'Master Planner'
  | 'Logistics Support'
  | 'Quality Control'
  | 'Supply Chain Manager'
  | 'Supply Chain Director'
  | 'Scheduling & Logistics Manager'
  | 'Other / Mixed';

export type Objective = 'Anticipate' | 'Monitor' | 'Correct' | 'Prioritize' | 'Report';

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
  | 'Manage delays'
  | 'Anticipate risks'
  | 'Prioritize actions'
  | 'Meet customer commitments'
  | 'Monitor workload / production'
  | 'Business insights / KPIs';

/**
 * Routine Filter Definition
 * Defines a filter to be applied when using a routine
 */
export interface RoutineFilter {
  columnId: string; // Column ID (e.g., 'arStatus', 'createdDate')
  filterId?: string; // Filter definition ID (e.g., 'ar-status', 'date-comparison')
  condition?: 'is' | 'isNot' | 'lessThan' | 'greaterThan' | 'lessThanOrEqual' | 'greaterThanOrEqual';
  values: (string | number)[]; // Filter values
  // For date filters: relative date expressions like "1 week ago", "today", etc.
  dateExpression?: string; // e.g., "1 week ago", "today", "1 month ago"
}

/**
 * Routine Library Entry
 * Normalized structure supporting multiple Role profiles and discovery paths
 */
export interface RoutineLibraryEntry {
  id: string; // Stable identifier (e.g., 'commandes-sans-ar')
  label: string; // Short neutral name (e.g., 'Commandes sans AR')
  description: string; // 1 line, value-oriented
  personas: Persona[]; // Primary + secondary Role profiles
  objectives: Objective[]; // What this routine helps achieve
  horizon: Horizon;
  impactZones: ImpactZone[];
  frequency: Frequency;
  pelicoViews: PelicoView[];
  keywords: string[]; // For search (e.g., ['AR', 'acknowledgement', 'fournisseur'])
  
  // Routine configuration
  primaryPelicoView: PelicoView; // Main Pelico view for this routine (e.g., 'Supply')
  requiredColumns?: string[]; // Column IDs that must be visible (e.g., ['arStatus'])
  filters?: RoutineFilter[]; // Filters to apply when using this routine
}

/**
 * Default routine sets per Role profile
 * Maps Role profile to list of routine IDs that should be preselected
 */
export type PersonaDefaultSets = Record<Persona, string[]>;

/**
 * Intent to Objective mapping
 * Maps user-selected intents to objectives for scoring
 */
export const INTENT_TO_OBJECTIVES: Record<Intent, Objective[]> = {
  'Manage delays': ['Correct'],
  'Anticipate risks': ['Anticipate'],
  'Prioritize actions': ['Prioritize', 'Monitor'],
  'Meet customer commitments': ['Monitor', 'Report'],
  'Monitor workload / production': ['Monitor'],
  'Business insights / KPIs': ['Report', 'Prioritize'],
};

/**
 * Intent to Impact Zone mapping
 * Maps user-selected intents to impact zones for scoring
 */
export const INTENT_TO_IMPACT_ZONES: Record<Intent, ImpactZone[]> = {
  'Manage delays': ['Supplier', 'Production', 'Customer'],
  'Anticipate risks': ['Supplier', 'Production', 'Customer'],
  'Prioritize actions': ['Supplier', 'Production', 'Customer', 'Business'],
  'Meet customer commitments': ['Customer'],
  'Monitor workload / production': ['Production'],
  'Business insights / KPIs': ['Business'],
};

/**
 * Onboarding state persisted to localStorage
 */
export interface OnboardingState {
  selectedPersona: Persona | null;
  selectedIntents: Intent[];
  selectedRoutineIds: string[];
}




