/**
 * Add Routines Modal
 * Modal for selecting routines to add to a team
 * Based on the design from AllRoutinesSelectionStep
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type { RoutineLibraryEntry } from '@/lib/onboarding/types';
import { 
  Search, 
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
type PersonaFilter = string | 'all';
type ObjectiveFilter = string | 'all';
type HorizonFilter = string | 'all';
type PelicoViewFilter = string | 'all';

interface AddRoutinesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRoutineIds: string[];
  onRoutineToggle: (routineId: string) => void;
  onAddSelected: () => void;
  alreadyAssignedRoutineIds?: string[]; // Routines already assigned to the team
}

export const AddRoutinesModal: React.FC<AddRoutinesModalProps> = ({
  open,
  onOpenChange,
  selectedRoutineIds,
  onRoutineToggle,
  onAddSelected,
  alreadyAssignedRoutineIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [personaFilter, setPersonaFilter] = useState<PersonaFilter>('all');
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilter>('all');
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>('all');
  const [pelicoViewFilter, setPelicoViewFilter] = useState<PelicoViewFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Get unique values for filters
  const uniquePersonas = useMemo(() => {
    const personas = new Set<string>();
    ROUTINE_LIBRARY.forEach(routine => {
      routine.personas.forEach(p => personas.add(p));
    });
    return Array.from(personas).sort();
  }, []);

  const uniqueObjectives = useMemo(() => {
    const objectives = new Set<string>();
    ROUTINE_LIBRARY.forEach(routine => {
      routine.objectives.forEach(o => objectives.add(o));
    });
    return Array.from(objectives).sort();
  }, []);

  const uniqueHorizons = useMemo(() => {
    const horizons = new Set<string>();
    ROUTINE_LIBRARY.forEach(routine => {
      if (routine.horizon) horizons.add(routine.horizon);
    });
    return Array.from(horizons).sort();
  }, []);

  const uniquePelicoViews = useMemo(() => {
    const views = new Set<string>();
    ROUTINE_LIBRARY.forEach(routine => {
      if (routine.pelicoViews) {
        routine.pelicoViews.forEach(view => views.add(view));
      }
    });
    return Array.from(views).sort();
  }, []);

  // Filter and sort routines
  const filteredAndSortedRoutines = useMemo(() => {
    let filtered = ROUTINE_LIBRARY.filter(routine => {
      // Exclude already assigned routines
      if (alreadyAssignedRoutineIds.includes(routine.id)) {
        return false;
      }

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        routine.label.toLowerCase().includes(searchLower) ||
        routine.description?.toLowerCase().includes(searchLower) ||
        routine.keywords?.some(k => k.toLowerCase().includes(searchLower));

      // Persona filter
      const matchesPersona = personaFilter === 'all' || routine.personas.includes(personaFilter);

      // Objective filter
      const matchesObjective = objectiveFilter === 'all' || routine.objectives.includes(objectiveFilter);

      // Horizon filter
      const matchesHorizon = horizonFilter === 'all' || routine.horizon === horizonFilter;

      // Pelico View filter
      const matchesPelicoView = pelicoViewFilter === 'all' || 
        (routine.pelicoViews && routine.pelicoViews.includes(pelicoViewFilter));

      return matchesSearch && matchesPersona && matchesObjective && matchesHorizon && matchesPelicoView;
    });

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
  }, [searchQuery, personaFilter, objectiveFilter, horizonFilter, pelicoViewFilter, sortBy, alreadyAssignedRoutineIds]);

  const getPersonaColor = (persona: string) => {
    const colors: Record<string, string> = {
      'Supply Planner': 'bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30',
      'Buyer': 'bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/30',
      'Procurement Manager': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      'Scheduler': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    };
    return colors[persona] || 'bg-muted text-muted-foreground border-border';
  };

  const getObjectiveColor = (objective: string) => {
    const colors: Record<string, string> = {
      'Monitor': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      'Correct': 'bg-red-500/10 text-red-600 border-red-500/30',
      'Anticipate': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      'Report': 'bg-green-500/10 text-green-600 border-green-500/30',
      'Prioritize': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    };
    return colors[objective] || 'bg-muted text-muted-foreground border-border';
  };

  const selectedCount = selectedRoutineIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Add routines</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Select routines to add to your team
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Search and Filters Section */}
          <div className="px-6 pt-4 pb-4 border-b border-border">
            <div className="flex flex-col gap-4">
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

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-3">
                <Select value={personaFilter} onValueChange={(value) => setPersonaFilter(value as PersonaFilter)}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Personas</SelectItem>
                    {uniquePersonas.map(persona => (
                      <SelectItem key={persona} value={persona}>{persona}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={objectiveFilter} onValueChange={(value) => setObjectiveFilter(value as ObjectiveFilter)}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Objective" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Objectives</SelectItem>
                    {uniqueObjectives.map(objective => (
                      <SelectItem key={objective} value={objective}>{objective}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={horizonFilter} onValueChange={(value) => setHorizonFilter(value as HorizonFilter)}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Horizon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Horizons</SelectItem>
                    {uniqueHorizons.map(horizon => (
                      <SelectItem key={horizon} value={horizon}>{horizon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={pelicoViewFilter} onValueChange={(value) => setPelicoViewFilter(value as PelicoViewFilter)}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Pelico View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pelico Views</SelectItem>
                    {uniquePelicoViews.map(view => (
                      <SelectItem key={view} value={view}>{view}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
            </div>
          </div>

          {/* Routines Grid */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAndSortedRoutines.map((routine) => {
                  const isSelected = selectedRoutineIds.includes(routine.id);
                  return (
                    <div
                      key={routine.id}
                      className={cn(
                        "group relative p-5 rounded-xl border-2 transition-all cursor-pointer",
                        isSelected
                          ? "border-[#2063F0] bg-gradient-to-br from-[#2063F0]/10 to-[#2063F0]/5 shadow-lg shadow-[#2063F0]/10"
                          : "border-border bg-background hover:border-[#31C7AD]/50 hover:shadow-md"
                      )}
                      onClick={() => onRoutineToggle(routine.id)}
                    >
                      {/* Checkbox */}
                      <div className="absolute top-4 right-4 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            onRoutineToggle(routine.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-5 w-5 data-[state=checked]:bg-[#2063F0] data-[state=checked]:border-[#2063F0]"
                        />
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold mb-2 pr-8">{routine.label}</h3>

                      {/* Description */}
                      {routine.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {routine.description}
                        </p>
                      )}

                      {/* Personas */}
                      {routine.personas && routine.personas.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-muted-foreground mb-1.5">Personas</div>
                          <div className="flex flex-wrap gap-1.5">
                            {routine.personas.map((persona) => (
                              <Badge
                                key={persona}
                                variant="outline"
                                className={cn("text-xs", getPersonaColor(persona))}
                              >
                                {persona}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Objectives */}
                      {routine.objectives && routine.objectives.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-muted-foreground mb-1.5">Objectives</div>
                          <div className="flex flex-wrap gap-1.5">
                            {routine.objectives.map((objective) => (
                              <Badge
                                key={objective}
                                variant="outline"
                                className={cn("text-xs", getObjectiveColor(objective))}
                              >
                                {objective}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pelico Views */}
                      {routine.pelicoViews && routine.pelicoViews.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1.5">Pelico Views</div>
                          <div className="flex flex-wrap gap-1.5">
                            {routine.pelicoViews.map((view) => (
                              <Badge
                                key={view}
                                variant="outline"
                                className="text-xs bg-pink-500/10 text-pink-600 border-pink-500/30"
                              >
                                {view}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onAddSelected();
                  onOpenChange(false);
                }}
                disabled={selectedCount === 0}
                className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white"
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

