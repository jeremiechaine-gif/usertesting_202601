#!/bin/bash

# Script to commit all changes
cd /Users/pelico/pelico-onboarding-2026-1

# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: Improve UX/UI consistency and dark mode support

- Unify RoutineChip component across all pages with consistent styling
- Replace View button with Remove/Delete actions based on routine type
- Convert action buttons to icon buttons for space efficiency
- Reorder action buttons: Preview, Share, Remove/Delete
- Update Preview button to secondary variant
- Improve dark mode support for page titles, badges, and buttons
- Update team card styling: bg-muted without default border, border on hover
- Update routine button on team cards to accent variant
- Remove Pelico logo badges from all page headers
- Move Hello message and description to HomePage header
- Align notification bell icon with Hello text
- Fix JSX errors and add routine prop validation
- Improve RoutineChip responsiveness and prevent element overlap"

echo "✅ Commit completed successfully!"
