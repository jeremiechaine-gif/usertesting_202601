#!/bin/bash
cd /Users/pelico/pelico-onboarding-2026-1

git add src/lib/routines.ts

git commit -m "fix: Align getTeamRoutinesCount logic with getTeamRoutinesGroupedByObjectives

- Ensure getTeamRoutinesCount uses exact same logic as getTeamRoutinesGroupedByObjectives
- Use teamRoutineIds variable name to match getTeamRoutinesGroupedByObjectives
- Ensure consistent counting of user-created and library routines
- Fixes discrepancy between button count and page display count"
