# Onboarding Routine Builder

## Overview

The Onboarding Routine Builder is a progressive 3-step flow that guides users to select routines from a predefined library. It avoids cognitive overload and the blank-page problem while maintaining power-user control.

## UX Logic

### Step 1: Role-Based Start (30s)
- **Question**: "What is your primary role?"
- **Options**: 12 personas (Approvisionneur, Acheteur, Manager Appro, etc.)
- **Behavior**: Selecting a role preselects a default set of routines from `PERSONA_DEFAULT_SETS`

### Step 2: Intent-Based Refinement (multi-select)
- **Question**: "What do you want to improve first?"
- **Intent Cards**: 6 intents (Gérer des retards, Anticiper des risques, etc.)
- **Behavior**: Each intent increases the "score" for routines tagged with matching objectives/impact zones
- **Live Updates**: Selection updates scoring in real-time

### Step 3: Concrete Review (final selection)
- **Display**: Curated list grouped by frequency (Daily, Weekly, Monthly)
- **Default**: Shows max 7 routines initially (e.g., 4 daily, 2 weekly, 1 monthly)
- **User Actions**:
  - Remove a routine
  - Add from library ("Browse all routines")
  - Continue
- **Reassurance**: "You can change this anytime later"

## Data Model

### Routine Library Entry

Each routine in the library has:

```typescript
{
  id: string;                    // Stable identifier (kebab-case)
  label: string;                 // Short neutral name
  description: string;            // 1 line, value-oriented
  personas: Persona[];           // Primary + secondary personas
  objectives: Objective[];        // Anticiper, Piloter, Corriger, Arbitrer, Reporter
  horizon: Horizon;              // Today, ThisWeek, Projection
  impactZones: ImpactZone[];     // Supplier, Production, Customer, Business
  frequency: Frequency;           // Daily, Weekly, Monthly
  pelicoViews: PelicoView[];     // Supply, Production Control, etc.
  keywords: string[];             // For search
}
```

### Persona Default Sets

Maps each persona to a list of routine IDs that should be preselected:

```typescript
PERSONA_DEFAULT_SETS: Record<Persona, string[]>
```

## Scoring System

### Scoring Function

The `scoreRoutine` function computes relevance based on:

1. **Persona Match**: +5 points if routine matches selected persona
2. **Objective Match**: +3 points per matched objective from intents
3. **Impact Zone Match**: +2 points per matched impact zone from intents
4. **Frequency Match**: +1 point (optional, for future use)

### Intent Mappings

- **Intent → Objectives**: Maps user intents to objectives (e.g., "Gérer des retards" → ["Corriger"])
- **Intent → Impact Zones**: Maps user intents to impact zones (e.g., "Tenir la promesse client" → ["Customer"])

### Adjusting Weights

To adjust scoring weights, modify constants in `scoring.ts`:

```typescript
const PERSONA_MATCH_SCORE = 5;      // Increase for stronger persona preference
const OBJECTIVE_MATCH_SCORE = 3;    // Increase for stronger intent matching
const IMPACT_ZONE_MATCH_SCORE = 2;  // Increase for stronger impact zone relevance
const FREQUENCY_MATCH_SCORE = 1;    // Increase if frequency preference is important
```

### Scoring Example

For a routine with:
- Personas: ["Approvisionneur"]
- Objectives: ["Piloter", "Corriger"]
- Impact Zones: ["Supplier"]

And user selections:
- Persona: "Approvisionneur" (+5)
- Intents: ["Gérer des retards"] → Objectives: ["Corriger"] (+3), Impact Zones: ["Supplier"] (+2)

**Total Score**: 5 + 3 + 2 = 10

## Power User Mode

The "Browse All Routines" modal provides:

- **Search**: By keywords (name, description, keywords array)
- **Filters**: Role, Objective, Horizon, Impact Zone, Pelico View, Frequency
- **Sorting**: By relevance score or alphabetical
- **Add/Remove**: Toggle routines in/out of selection

## State Management

### LocalStorage Persistence

State is persisted to `localStorage` with key `pelico-onboarding-state`:

```typescript
{
  selectedPersona: Persona | null;
  selectedIntents: Intent[];
  selectedRoutineIds: string[];
}
```

This allows users to:
- Close and resume the flow
- Recover from browser crashes
- Navigate back/forward between steps

### State Recovery

On modal open, the component:
1. Loads state from localStorage
2. Determines current step based on completed selections
3. Restores scoring and selected routines

## Integration

### Triggering from Home Page

The onboarding flow is triggered when clicking "Create routine" on the Home page:

```typescript
<OnboardingRoutineBuilder
  open={routineBuilderOpen}
  onOpenChange={setRoutineBuilderOpen}
  onComplete={(selectedRoutineIds) => {
    // Create routines from selected IDs
    // Navigate to scope-routines page
  }}
/>
```

### Completion Handler

The `onComplete` callback receives an array of selected routine IDs. The implementation should:
1. Create routine instances from library entries
2. Save to localStorage (via `createRoutine` from `lib/routines.ts`)
3. Optionally navigate to the routines page

## File Structure

```
src/
├── lib/
│   └── onboarding/
│       ├── types.ts              # Type definitions
│       ├── routineLibrary.ts     # Routine library + persona defaults
│       ├── scoring.ts            # Scoring function
│       ├── __tests__/
│       │   └── scoring.test.ts   # Unit tests
│       └── README.md             # This file
└── components/
    └── OnboardingRoutineBuilder/
        ├── OnboardingRoutineBuilder.tsx  # Main component
        ├── RoleSelectionStep.tsx         # Step 1
        ├── IntentSelectionStep.tsx       # Step 2
        ├── RoutineReviewStep.tsx         # Step 3
        └── BrowseAllRoutines.tsx         # Power user mode
```

## Testing

Run tests with:

```bash
npm test -- src/lib/onboarding/__tests__/scoring.test.ts
```

Tests cover:
- Persona matching
- Objective matching
- Impact zone matching
- Score accumulation
- Ranking and grouping

## Accessibility

- Keyboard navigation supported
- Focus visible indicators
- ARIA labels for dialogs and buttons
- Screen reader friendly

## Future Enhancements

- Frequency preference selection
- Routine preview/details modal
- Analytics hooks for step completion
- Routine templates/customization
- Team-based routine sharing integration

