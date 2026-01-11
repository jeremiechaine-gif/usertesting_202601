#!/bin/bash

# Script to commit all changes
cd /Users/pelico/pelico-onboarding-2026-1

# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: Add drag & drop functionality for routine folders

- Make folders draggable with visual feedback (GripVertical icon, opacity, scale)
- Add folder drag handlers (handleFolderDragStart, handleFolderDragEnd, handleFolderDrop)
- Support dropping folder on routine: adds routine to folder or merges folders
- Support dropping folder on folder: merges folders together
- Replace chevron icons with Folder/FolderOpen icons to show expand/collapse state
- Improve folder name truncation (max 40 chars total, 18 chars per routine name)
- Add visual feedback during folder drag (ring, background color)
- Restrict folder operations to same section (MY ROUTINES or SHARED ROUTINES)
- Add toast notifications for folder merge operations
- Maintain folder indentation (ml-6) for routines inside folders"

echo "✅ Commit completed successfully!"
