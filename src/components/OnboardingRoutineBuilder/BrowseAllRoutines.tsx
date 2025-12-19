/**
 * Browse All Routines Modal
 * Power user mode: search, filter, and add routines
 * 
 * Features:
 * - Search by keywords
 * - Filters: Role, Objective, Horizon, Impact Zone, Pelico View, Frequency
 * - Sorting: by relevance score, alphabetical
 * - Add/remove routines
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, X, Plus, CheckCircle2, Filter } from 'lucide-react';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type {
  RoutineLibraryEntry,
  Persona,
  Objective,
  Horizon,
  ImpactZone,
  Frequency,
  PelicoView,
} from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';

interface BrowseAllRoutinesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRoutineIds: string[];
  onRoutineToggle: (routineId: string) => void;
}

type SortOption = 'relevance' | 'alphabetical';

export const BrowseAllRoutines: React.FC<BrowseAllRoutinesProps> = ({
  open,
  onOpenChange,
  selectedRoutineIds,
  onRoutineToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<Objective[]>([]);
  const [selectedHorizons, setSelectedHorizons] = useState<Horizon[]>([]);
  const [selectedImpactZones, setSelectedImpactZones] = useState<ImpactZone[]>([]);
  const [selectedPelicoViews, setSelectedPelicoViews] = useState<PelicoView[]>([]);
  const [selectedFrequencies, setSelectedFrequencies] = useState<Frequency[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filters
  const allPersonas = useMemo(() => {
    const personas = new Set<Persona>();
    ROUTINE_LIBRARY.forEach((r) => r.personas.forEach((p) => personas.add(p)));
    return Array.from(personas).sort();
  }, []);

  const allObjectives: Objective[] = ['Anticiper', 'Piloter', 'Corriger', 'Arbitrer', 'Reporter'];
  const allHorizons: Horizon[] = ['Today', 'ThisWeek', 'Projection'];
  const allImpactZones: ImpactZone[] = ['Supplier', 'Production', 'Customer', 'Business'];
  const allFrequencies: Frequency[] = ['Daily', 'Weekly', 'Monthly'];
  const allPelicoViews: PelicoView[] = [
    'Supply',
    'Production Control',
    'Customer Support',
    'Escalation Room',
    'Value Engineering',
    'Event Explorer',
    'Simulation',
  ];

  // Filter and search routines
  const filteredRoutines = useMemo(() => {
    let filtered: RoutineLibraryEntry[] = ROUTINE_LIBRARY;

    // Search by keywords
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.label.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.keywords.some((k) => k.toLowerCase().includes(query))
      );
    }

    // Filter by personas
    if (selectedPersonas.length > 0) {
      filtered = filtered.filter((r) =>
        r.personas.some((p) => selectedPersonas.includes(p))
      );
    }

    // Filter by objectives
    if (selectedObjectives.length > 0) {
      filtered = filtered.filter((r) =>
        r.objectives.some((o) => selectedObjectives.includes(o))
      );
    }

    // Filter by horizons
    if (selectedHorizons.length > 0) {
      filtered = filtered.filter((r) => selectedHorizons.includes(r.horizon));
    }

    // Filter by impact zones
    if (selectedImpactZones.length > 0) {
      filtered = filtered.filter((r) =>
        r.impactZones.some((z) => selectedImpactZones.includes(z))
      );
    }

    // Filter by Pelico views
    if (selectedPelicoViews.length > 0) {
      filtered = filtered.filter((r) =>
        r.pelicoViews.some((v) => selectedPelicoViews.includes(v))
      );
    }

    // Filter by frequencies
    if (selectedFrequencies.length > 0) {
      filtered = filtered.filter((r) => selectedFrequencies.includes(r.frequency));
    }

    return filtered;
  }, [
    searchQuery,
    selectedPersonas,
    selectedObjectives,
    selectedHorizons,
    selectedImpactZones,
    selectedPelicoViews,
    selectedFrequencies,
  ]);

  // Sort routines
  const sortedRoutines = useMemo(() => {
    const sorted = [...filteredRoutines];
    if (sortBy === 'alphabetical') {
      sorted.sort((a, b) => a.label.localeCompare(b.label));
    }
    // 'relevance' is default order (already sorted by library order)
    return sorted;
  }, [filteredRoutines, sortBy]);

  const handleTogglePersona = (persona: Persona) => {
    setSelectedPersonas((prev) =>
      prev.includes(persona)
        ? prev.filter((p) => p !== persona)
        : [...prev, persona]
    );
  };

  const handleToggleObjective = (objective: Objective) => {
    setSelectedObjectives((prev) =>
      prev.includes(objective)
        ? prev.filter((o) => o !== objective)
        : [...prev, objective]
    );
  };

  const handleToggleHorizon = (horizon: Horizon) => {
    setSelectedHorizons((prev) =>
      prev.includes(horizon)
        ? prev.filter((h) => h !== horizon)
        : [...prev, horizon]
    );
  };

  const handleToggleImpactZone = (zone: ImpactZone) => {
    setSelectedImpactZones((prev) =>
      prev.includes(zone)
        ? prev.filter((z) => z !== zone)
        : [...prev, zone]
    );
  };

  const handleTogglePelicoView = (view: PelicoView) => {
    setSelectedPelicoViews((prev) =>
      prev.includes(view)
        ? prev.filter((v) => v !== view)
        : [...prev, view]
    );
  };

  const handleToggleFrequency = (frequency: Frequency) => {
    setSelectedFrequencies((prev) =>
      prev.includes(frequency)
        ? prev.filter((f) => f !== frequency)
        : [...prev, frequency]
    );
  };

  const clearFilters = () => {
    setSelectedPersonas([]);
    setSelectedObjectives([]);
    setSelectedHorizons([]);
    setSelectedImpactZones([]);
    setSelectedPelicoViews([]);
    setSelectedFrequencies([]);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedPersonas.length > 0 ||
    selectedObjectives.length > 0 ||
    selectedHorizons.length > 0 ||
    selectedImpactZones.length > 0 ||
    selectedPelicoViews.length > 0 ||
    selectedFrequencies.length > 0 ||
    searchQuery.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl font-bold">Browse All Routines</DialogTitle>
          <DialogDescription>
            Search and filter routines to add to your collection
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Search and Sort Bar */}
          <div className="px-6 py-3 border-b flex items-center gap-3 shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search routines by name, description, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort by relevance</SelectItem>
                <SelectItem value="alphabetical">Sort alphabetically</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {[
                    selectedPersonas.length,
                    selectedObjectives.length,
                    selectedHorizons.length,
                    selectedImpactZones.length,
                    selectedPelicoViews.length,
                    selectedFrequencies.length,
                  ].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="w-64 border-r bg-muted/20 overflow-y-auto shrink-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {/* Personas */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase">Role</Label>
                      <div className="space-y-2">
                        {allPersonas.map((persona) => (
                          <div key={persona} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-persona-${persona}`}
                              checked={selectedPersonas.includes(persona)}
                              onCheckedChange={() => handleTogglePersona(persona)}
                            />
                            <Label
                              htmlFor={`filter-persona-${persona}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {persona}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Objectives */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase">Objective</Label>
                      <div className="space-y-2">
                        {allObjectives.map((objective) => (
                          <div key={objective} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-objective-${objective}`}
                              checked={selectedObjectives.includes(objective)}
                              onCheckedChange={() => handleToggleObjective(objective)}
                            />
                            <Label
                              htmlFor={`filter-objective-${objective}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {objective}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Horizons */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase">Horizon</Label>
                      <div className="space-y-2">
                        {allHorizons.map((horizon) => (
                          <div key={horizon} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-horizon-${horizon}`}
                              checked={selectedHorizons.includes(horizon)}
                              onCheckedChange={() => handleToggleHorizon(horizon)}
                            />
                            <Label
                              htmlFor={`filter-horizon-${horizon}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {horizon}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Impact Zones */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase">Impact Zone</Label>
                      <div className="space-y-2">
                        {allImpactZones.map((zone) => (
                          <div key={zone} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-zone-${zone}`}
                              checked={selectedImpactZones.includes(zone)}
                              onCheckedChange={() => handleToggleImpactZone(zone)}
                            />
                            <Label
                              htmlFor={`filter-zone-${zone}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {zone}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pelico Views */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase">Pelico View</Label>
                      <div className="space-y-2">
                        {allPelicoViews.map((view) => (
                          <div key={view} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-view-${view}`}
                              checked={selectedPelicoViews.includes(view)}
                              onCheckedChange={() => handleTogglePelicoView(view)}
                            />
                            <Label
                              htmlFor={`filter-view-${view}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {view}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Frequencies */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase">Frequency</Label>
                      <div className="space-y-2">
                        {allFrequencies.map((frequency) => (
                          <div key={frequency} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-frequency-${frequency}`}
                              checked={selectedFrequencies.includes(frequency)}
                              onCheckedChange={() => handleToggleFrequency(frequency)}
                            />
                            <Label
                              htmlFor={`filter-frequency-${frequency}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {frequency}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Routines List */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {sortedRoutines.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No routines found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedRoutines.map((routine) => {
                      const isSelected = selectedRoutineIds.includes(routine.id);
                      return (
                        <div
                          key={routine.id}
                          className={cn(
                            'flex items-start justify-between p-4 rounded-lg border bg-background',
                            'hover:border-[#2063F0] transition-colors',
                            isSelected && 'border-[#2063F0] bg-[#2063F0]/5'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <h4 className="font-medium text-sm">{routine.label}</h4>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {routine.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {routine.frequency}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {routine.horizon}
                              </Badge>
                              {routine.pelicoViews.slice(0, 2).map((view) => (
                                <Badge key={view} variant="outline" className="text-xs">
                                  {view}
                                </Badge>
                              ))}
                              {routine.pelicoViews.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{routine.pelicoViews.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant={isSelected ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => onRoutineToggle(routine.id)}
                            className="ml-4 shrink-0"
                          >
                            {isSelected ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Remove
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

