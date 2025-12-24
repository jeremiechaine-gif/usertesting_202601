/**
 * All Routines Selection Step
 * Displays all generic routines in a grid layout (similar to RoutineLibraryPage)
 * Allows users to search, filter, sort, and select multiple routines
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type { RoutineLibraryEntry } from '@/lib/onboarding/types';
import { columns } from '@/lib/columns';
import { getColumnLabel } from '../sorting-filters/utils';
import { 
  Search, 
  Filter,
  Target,
  Zap,
  Users,
  Eye,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface AllRoutinesSelectionStepProps {
  selectedRoutineIds: string[];
  onRoutineToggle: (routineId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const AllRoutinesSelectionStep: React.FC<AllRoutinesSelectionStepProps> = ({
  selectedRoutineIds,
  onRoutineToggle,
  onBack,
  onNext,
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
  }, [searchQuery, personaFilter, objectiveFilter, horizonFilter, pelicoViewFilter, sortBy]);

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


  const canContinue = selectedRoutineIds.length > 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Filters and Search Bar */}
      <div className="border-b bg-background px-6 py-4 shrink-0">
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

      {/* Content - Cards Grid */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6">
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
                                className="text-xs h-5 px-2 bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/30"
                              >
                                {view}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Filters */}
                      {routine.filters && routine.filters.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Applied Filters</span>
                          </div>
                          <div className="space-y-2">
                            {routine.filters.map((filter, index) => {
                              const columnLabel = getColumnLabel(filter.columnId, columns);
                              
                              // Format filter display
                              let filterDisplay = '';
                              if (filter.dateExpression) {
                                const operator = filter.condition === 'lessThan' ? '<' : 
                                               filter.condition === 'greaterThan' ? '>' : 
                                               filter.condition === 'lessThanOrEqual' ? '≤' :
                                               filter.condition === 'greaterThanOrEqual' ? '≥' : '';
                                filterDisplay = `${operator} ${filter.dateExpression}`;
                              } else if (filter.values && filter.values.length > 0) {
                                if (filter.condition === 'is') {
                                  filterDisplay = `= ${filter.values.join(', ')}`;
                                } else if (filter.condition === 'isNot') {
                                  filterDisplay = `≠ ${filter.values.join(', ')}`;
                                } else {
                                  filterDisplay = filter.values.join(', ');
                                }
                              }

                              return (
                                <div
                                  key={index}
                                  className="text-xs bg-muted/50 rounded-md px-2.5 py-1.5 border border-border/50"
                                >
                                  <div className="font-medium text-foreground mb-0.5">{columnLabel}</div>
                                  <div className="text-muted-foreground">{filterDisplay}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Required Columns */}
                      {routine.requiredColumns && routine.requiredColumns.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Target className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Required Columns</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {routine.requiredColumns.map((colId) => {
                              const columnLabel = getColumnLabel(colId, columns);
                              return (
                                <Badge
                                  key={colId}
                                  variant="outline"
                                  className="text-xs h-5 px-2 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30"
                                >
                                  {columnLabel}
                                </Badge>
                              );
                            })}
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
      <div className="px-8 py-4 border-t border-border/50 bg-background shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-[#2063F0] hover:bg-[#2063F0]/5 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to role selection
          </Button>
          
          <div className="flex items-center gap-3">
            {selectedRoutineIds.length > 0 && (
              <div className="px-3 py-1.5 rounded-full bg-[#2063F0]/10 border border-[#2063F0]/20">
                <span className="text-xs font-semibold text-[#2063F0]">
                  {selectedRoutineIds.length} routine{selectedRoutineIds.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}
            <Button
              onClick={onNext}
              disabled={!canContinue}
              className="gap-2 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review Selection
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

