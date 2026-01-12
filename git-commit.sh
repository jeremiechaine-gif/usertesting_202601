#!/bin/bash
cd /Users/pelico/pelico-onboarding-2026-1
git add src/components/SimpleOnboardingWizard/RecommendedRoutinesModal.tsx \
        src/components/SimpleOnboardingWizard/RoutineSelectionStep.tsx \
        src/components/ui/routine-chip.tsx \
        src/components/CreateRoutineFullPageWizard.tsx

git commit -m "feat: Add Recommended Routines modal, improve RoutineChip layout, and add Clear routines button

- Create RecommendedRoutinesModal component for viewing recommended routines
- Integrate modal into RoutineSelectionStep (replaces navigation to substep)
- Reorganize RoutineChip layout: actions always at bottom, Remove/Delete button on the right
- Align Pelico View badge to left, check icon to right when selected
- Add Clear routines button in team card header
- Add sidebar to CreateRoutineFullPageWizard matching SimpleOnboardingWizard design"
