#!/bin/bash

# Script to commit all changes
cd /Users/pelico/pelico-onboarding-2026-1

# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: Improve dark mode support and unify RoutineChip component

- Unify RoutineChip component across all pages (ScopeAndRoutinesPage, RoutineLibraryPage, TeamRoutinesPage, AddRoutinesModal, AllRoutinesSelectionStep, RoutineSelectionStep)
- Update Button secondary variant for dark mode compatibility
- Fix page titles to be white in dark mode
- Fix JSX error in ScopeAndRoutinesPage (removed dead code)
- Improve dark mode styling for badges, tooltips, and info banners
- Add validation for routine props to prevent undefined errors
- Update Create Routine button to use default variant
- Improve RoutineChip responsiveness and prevent internal element overlap"

echo "✅ Commit completed successfully!"
