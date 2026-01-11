/**
 * Recommended Routines Modal
 * Modal for viewing and selecting recommended routines for a team
 * Based on AddRoutinesModal but filtered to show only recommended routines
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type { RoutineLibraryEntry } from '@/lib/onboarding/types';
import { RoutineChip } from '@/components/ui/routine-chip';
import { 
  Search, 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'name' | 'frequency' | 'horizon';

interface RecommendedRoutinesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  teamPersona: string | null;
  selectedRoutineIds: string[];
  onRoutineToggle: (routineId: string) => void;
  onAddSelected: () => void;
  onAddAllSuggested: () => void;
  alreadyAssignedRoutineIds?: string[]; // Routines already assigned to the team
}

// Persona mapping from French to English (same as in RoutineSelectionStep)
const PERSONA_FR_TO_EN: Record<string, string> = {
  'Approvisionneur': 'Supply Planner',
  'Planificateur': 'Planner',
  'Ordonnanceur': 'Scheduler',
  'Responsable Production': 'Production Manager',
  'Chef d\'Atelier': 'Workshop Manager',
  'Responsable Qualité': 'Quality Manager',
  'Support Logistique': 'Logistics Support',
  'Recette': 'Quality Control',
  'Responsable Supply Chain': 'Supply Chain Manager',
  'Directeur Supply Chain': 'Supply Chain Director',
  'Responsable Ordo & Support log': 'Scheduling & Logistics Manager',
  'Autre / Mixte': 'Other / Mixed',
};

export const RecommendedRoutinesModal: React.FC<RecommendedRoutinesModalProps> = ({
  open,
  onOpenChange,
  teamId,
  teamName,
  teamPersona,
  selectedRoutineIds,
  onRoutineToggle,
  onAddSelected,
  onAddAllSuggested,
  alreadyAssignedRoutineIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Get suggested routine IDs for the team's persona
  const getSuggestedRoutineIds = (persona: string | null): string[] => {
    if (!persona) return [];
    const englishPersona = PERSONA_FR_TO_EN[persona] || persona;
    return ROUTINE_LIBRARY
      .filter(r => r.personas.includes(englishPersona as any))
      .map(r => r.id);
  };

  // Get all recommended routines (including already assigned ones)
  const recommendedRoutineIds = useMemo(() => {
    return getSuggestedRoutineIds(teamPersona);
  }, [teamPersona]);

  // Filter and sort routines
  const filteredAndSortedRoutines = useMemo(() => {
    // Filter to only recommended routines
    let filtered = ROUTINE_LIBRARY.filter(routine => {
      return recommendedRoutineIds.includes(routine.id);
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(routine => 
        routine.label.toLowerCase().includes(searchLower) ||
        routine.description?.toLowerCase().includes(searchLower) ||
        routine.keywords?.some(k => k.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.label.localeCompare(b.label);
      } else if (sortBy === 'frequency') {
        const frequencyOrder = { 'Daily': 1, 'Weekly': 2, 'Monthly': 3 };
        const aFreq = frequencyOrder[a.frequency as keyof typeof frequencyOrder] || 99;
        const bFreq = frequencyOrder[b.frequency as keyof typeof frequencyOrder] || 99;
        return aFreq - bFreq;
      } else if (sortBy === 'horizon') {
        const horizonOrder = { 'Today': 1, 'ThisWeek': 2, 'ThisMonth': 3, 'ThisQuarter': 4 };
        const aHor = horizonOrder[a.horizon as keyof typeof horizonOrder] || 99;
        const bHor = horizonOrder[b.horizon as keyof typeof horizonOrder] || 99;
        return aHor - bHor;
      }
      return 0;
    });

    return filtered;
  }, [searchQuery, sortBy, recommendedRoutineIds]);

  const selectedCount = selectedRoutineIds.length;
  const unassignedRecommendedCount = filteredAndSortedRoutines.filter(
    r => !alreadyAssignedRoutineIds.includes(r.id)
  ).length;

  const handleClearSelection = () => {
    selectedRoutineIds.forEach(routineId => {
      onRoutineToggle(routineId);
    });
  };

  const handleAddAllSuggested = () => {
    onAddAllSuggested();
    // Clear the temporary selection after adding all
    handleClearSelection();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Recommended Routines for {teamName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                View and select recommended routines for {teamName}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Content - Search, Filters and Cards Grid */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 pt-4 pb-6">
              {/* Search and Filters Section */}
              <div className="flex flex-col gap-4 mb-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search routines by name, description, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>

                {/* Filters Row - Only Sort */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1" />
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-[150px] h-9">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="frequency">Frequency</SelectItem>
                      <SelectItem value="horizon">Horizon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Routine Count */}
                <div className="text-xs text-muted-foreground">
                  {filteredAndSortedRoutines.length} {filteredAndSortedRoutines.length === 1 ? 'routine' : 'routines'} found
                  {unassignedRecommendedCount > 0 && (
                    <span className="ml-2">
                      ({unassignedRecommendedCount} not yet assigned)
                    </span>
                  )}
                </div>
              </div>

              {/* Cards Grid */}
              {filteredAndSortedRoutines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border/60 bg-gradient-to-br from-[#2063F0]/5 to-transparent">
                  <div className="p-4 rounded-full bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 mb-4">
                    <Search className="h-8 w-8 text-[#2063F0]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No routines found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm text-center">
                    Try adjusting your search to find routines
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
                {filteredAndSortedRoutines.map((routine) => {
                  const isSelected = selectedRoutineIds.includes(routine.id);
                  const isAlreadyAssigned = alreadyAssignedRoutineIds.includes(routine.id);
                  return (
                    <RoutineChip
                      key={routine.id}
                      name={routine.label}
                      description={routine.description}
                      pelicoView={routine.pelicoViews && routine.pelicoViews.length > 0 ? routine.pelicoViews[0] : undefined}
                      selected={isSelected || isAlreadyAssigned}
                      isSuggested={true}
                      onPreview={() => {
                        // Preview functionality can be added here if needed
                      }}
                      onToggle={isAlreadyAssigned ? undefined : () => onRoutineToggle(routine.id)}
                      addLabel="Add"
                      removeLabel="Remove"
                    />
                  );
                })}
              </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedCount > 0 ? (
                <span>{selectedCount} routine{selectedCount !== 1 ? 's' : ''} selected</span>
              ) : (
                <span>No routines selected</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleClearSelection}
                disabled={selectedCount === 0}
              >
                Clear selection
              </Button>
              <Button
                variant="accent"
                onClick={handleAddAllSuggested}
                disabled={unassignedRecommendedCount === 0}
              >
                Add All Suggested
              </Button>
              <Button
                onClick={() => {
                  onAddSelected();
                  onOpenChange(false);
                }}
                variant="default"
                disabled={selectedCount === 0}
              >
                Add Selected ({selectedCount})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
