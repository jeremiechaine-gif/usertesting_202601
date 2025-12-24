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
  Users,
  Target,
  Eye,
  Filter,
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

      // Pelico View filter
      const matchesPelicoView = pelicoViewFilter === 'all' || 
        (routine.pelicoViews && routine.pelicoViews.includes(pelicoViewFilter));

      return matchesSearch && matchesPersona && matchesObjective && matchesPelicoView;
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
  }, [searchQuery, personaFilter, objectiveFilter, pelicoViewFilter, sortBy, alreadyAssignedRoutineIds]);

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

  const handleClearSelection = () => {
    selectedRoutineIds.forEach(routineId => {
      onRoutineToggle(routineId);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Add routines
              </DialogTitle>
              <DialogDescription className="sr-only">
                Select routines to add to your team
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

                {/* Routine Count */}
                <div className="text-xs text-muted-foreground">
                  {filteredAndSortedRoutines.length} {filteredAndSortedRoutines.length === 1 ? 'routine' : 'routines'} found
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
                    Try adjusting your search or filters to find routines
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedRoutines.map((routine) => {
                  const isSelected = selectedRoutineIds.includes(routine.id);
                  return (
                    <div
                      key={routine.id}
                      className={cn(
                        "group border rounded-xl p-5 hover:shadow-lg transition-all bg-background hover:border-[#2063F0]/30 flex flex-col cursor-pointer",
                        isSelected ? "border-[#2063F0] bg-gradient-to-br from-[#2063F0]/10 to-[#2063F0]/5 shadow-lg shadow-[#2063F0]/10" : "border-border/60"
                      )}
                      onClick={() => onRoutineToggle(routine.id)}
                    >
                      {/* Selection Checkbox */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 line-clamp-2">{routine.label}</h3>
                          {routine.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                              {routine.description}
                            </p>
                          )}
                        </div>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onRoutineToggle(routine.id)}
                          className="mt-1 ml-2 shrink-0 data-[state=checked]:bg-[#2063F0] data-[state=checked]:border-[#2063F0]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Characteristics */}
                      <div className="flex-1 space-y-3">
                        {/* Personas */}
                        {routine.personas && routine.personas.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Personas</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {routine.personas.map((persona) => (
                                <Badge
                                  key={persona}
                                  variant="outline"
                                  className={cn("text-xs h-5 px-2", getPersonaColor(persona))}
                                >
                                  {persona}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Objectives */}
                        {routine.objectives && routine.objectives.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Target className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Objectives</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {routine.objectives.map((objective) => (
                                <Badge
                                  key={objective}
                                  variant="outline"
                                  className={cn("text-xs h-5 px-2", getObjectiveColor(objective))}
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
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Pelico Views</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {routine.pelicoViews.map((view) => (
                                <Badge
                                  key={view}
                                  variant="outline"
                                  className="text-xs h-5 px-2 bg-pink-500/10 text-pink-600 border-pink-500/30"
                                >
                                  {view}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleClearSelection}
                disabled={selectedCount === 0}
              >
                Clear selection
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

