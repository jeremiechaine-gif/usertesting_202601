/**
 * Routine Library Page
 * Displays all generic routines from the onboarding library
 * Full-screen page with search, filters, and sorting
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from './Sidebar';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type { RoutineLibraryEntry } from '@/lib/onboarding/types';
import { applyGenericRoutine } from '@/lib/routineLibraryUtils';
import { columns } from '@/lib/columns';
import { getColumnLabel } from './sorting-filters/utils';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { RoutineChip } from './ui/routine-chip';
import { getRoutines, createRoutine, updateRoutine, getRoutine, deleteRoutine } from '@/lib/routines';
import { getCurrentUser, getCurrentUserId } from '@/lib/users';
import { useRoutine } from '@/contexts/RoutineContext';
import { 
  Search, 
  ArrowLeft, 
  Filter,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortOption = 'name' | 'frequency' | 'horizon';
type PersonaFilter = string | 'all';
type ObjectiveFilter = string | 'all';
type HorizonFilter = string | 'all';
type PelicoViewFilter = string | 'all';

export const RoutineLibraryPage: React.FC<{ 
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}> = ({ onNavigate, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [personaFilter, setPersonaFilter] = useState<PersonaFilter>('all');
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilter>('all');
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>('all');
  const [pelicoViewFilter, setPelicoViewFilter] = useState<PelicoViewFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<Set<string>>(new Set());
  const { refreshRoutines, refreshKey } = useRoutine();

  // Check which routines are already selected (shared with user's team)
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser?.teamId) return;

    const routines = getRoutines();
    const selected = new Set<string>();

    routines.forEach(routine => {
      // Check if routine is shared with user's team
      const routineTeamIds = routine.teamIds || [];
      if (currentUser.teamId && routineTeamIds.includes(currentUser.teamId)) {
        // Find matching library entry by name
        const libraryEntry = ROUTINE_LIBRARY.find(entry => entry.label === routine.name);
        if (libraryEntry) {
          selected.add(libraryEntry.id);
        }
      }
    });

    setSelectedRoutineIds(selected);
  }, [refreshKey]);

  // Helper function to create routine from library entry
  const createRoutineFromLibrary = (libraryEntry: RoutineLibraryEntry): string => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('No current user found');
    }

    // Convert library filters to ColumnFiltersState
    const filters: any[] = [];
    if (libraryEntry.filters) {
      libraryEntry.filters.forEach(filter => {
        const { columnId, condition, values, dateExpression } = filter;
        
        // Handle date expressions
        if (dateExpression) {
          const today = new Date();
          const lowerExpr = dateExpression.toLowerCase().trim();
          let dateValue: Date | null = null;
          
          if (lowerExpr === 'today') {
            dateValue = today;
          } else {
            const match = lowerExpr.match(/(\d+)\s*(week|month|day|year)s?\s*ago/);
            if (match) {
              const amount = parseInt(match[1], 10);
              const unit = match[2];
              dateValue = new Date(today);
              
              switch (unit) {
                case 'day':
                  dateValue.setDate(dateValue.getDate() - amount);
                  break;
                case 'week':
                  dateValue.setDate(dateValue.getDate() - (amount * 7));
                  break;
                case 'month':
                  dateValue.setMonth(dateValue.getMonth() - amount);
                  break;
                case 'year':
                  dateValue.setFullYear(dateValue.getFullYear() - amount);
                  break;
              }
            }
          }
          
          if (dateValue) {
            filters.push({
              id: columnId,
              value: {
                condition: condition || 'lessThan',
                date: dateValue.toISOString().split('T')[0],
              },
            });
          }
        } else if (condition && condition !== 'is') {
          filters.push({
            id: columnId,
            value: { condition, values },
          });
        } else {
          filters.push({
            id: columnId,
            value: values.length === 1 ? values[0] : values,
          });
        }
      });
    }

    // Map Pelico View
    const viewMap: Record<string, any> = {
      'Supply': 'supply',
      'Production Control': 'so-book',
      'Customer Support': 'customer',
      'Escalation Room': 'escalation',
      'Value Engineering': 'planning',
      'Event Explorer': 'events-explorer',
      'Simulation': 'events-explorer',
    };
    const pelicoView = viewMap[libraryEntry.primaryPelicoView] || 'supply';

    // Check if routine already exists (by name and creator)
    const existingRoutine = getRoutines().find(
      r => r.name === libraryEntry.label && r.createdBy === currentUserId
    );

    if (existingRoutine) {
      return existingRoutine.id;
    }

    // Create new routine
    const routine = createRoutine({
      name: libraryEntry.label,
      description: libraryEntry.description,
      filters,
      sorting: [],
      columnVisibility: libraryEntry.requiredColumns?.reduce((acc, colId) => {
        acc[colId] = true;
        return acc;
      }, {} as Record<string, boolean>),
      scopeMode: 'scope-aware',
      pelicoView,
      createdBy: currentUserId,
      teamIds: [],
    });

    return routine.id;
  };

  // Toggle routine selection (add/remove from shared routines)
  const handleToggleRoutineSelection = (libraryEntry: RoutineLibraryEntry) => {
    const currentUser = getCurrentUser();
    if (!currentUser?.teamId) {
      alert('You must be part of a team to share routines');
      return;
    }

    const isSelected = selectedRoutineIds.has(libraryEntry.id);
    
    if (isSelected) {
      // Remove routine completely (delete from database)
      const routines = getRoutines();
      const routine = routines.find(r => r.name === libraryEntry.label && r.createdBy === getCurrentUserId());
      
      if (routine) {
        // Delete the routine completely
        deleteRoutine(routine.id);
        
        // Update selected state
        setSelectedRoutineIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(libraryEntry.id);
          return newSet;
        });
      }
    } else {
      // Add to shared routines
      const routineId = createRoutineFromLibrary(libraryEntry);
      const routine = getRoutine(routineId);
      
      if (routine) {
        const currentTeamIds = routine.teamIds || [];
        if (!currentTeamIds.includes(currentUser.teamId)) {
          updateRoutine(routineId, { teamIds: [...currentTeamIds, currentUser.teamId] });
        }
        
        // Update selected state
        setSelectedRoutineIds(prev => new Set(prev).add(libraryEntry.id));
      }
    }

    // Refresh routines in sidebar and other components
    refreshRoutines();
  };

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
      const matchesPersona = personaFilter === 'all' || routine.personas.includes(personaFilter as any);

      // Objective filter
      const matchesObjective = objectiveFilter === 'all' || routine.objectives.includes(objectiveFilter as any);

      // Horizon filter
      const matchesHorizon = horizonFilter === 'all' || routine.horizon === horizonFilter;

      // Pelico View filter
      const matchesPelicoView = pelicoViewFilter === 'all' || 
        (routine.pelicoViews && routine.pelicoViews.includes(pelicoViewFilter as any));

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


  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {!sidebarCollapsed && (
        <Sidebar 
          activeItem="routines-library" 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(true)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-4 bg-muted/50">
        <div className="flex-1 flex flex-col overflow-hidden bg-background border border-border/60 rounded-2xl shadow-sm">
          {/* Main Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/5 via-[#2063F0]/5 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="relative px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {sidebarCollapsed && (
                  <Button 
                    variant="ghost" 
                    className="h-9 px-3 gap-2 hover:bg-[#31C7AD]/10"
                    onClick={() => setSidebarCollapsed(false)}
                  >
                    <Menu className="w-4 h-4" />
                    <img 
                      src="/images/Pelico-small-logo.svg" 
                      alt="Pelico" 
                      className="h-4 w-auto"
                    />
                    <span className="text-sm font-medium">Menu</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('scope-routines')}
                  className="gap-2 h-9"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 border border-[#2063F0]/20">
                  <Zap className="h-5 w-5 text-[#2063F0]" />
                </div>
                <div>
                  <h1 className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Generic Routines Library
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {filteredAndSortedRoutines.length} routine{filteredAndSortedRoutines.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Empty - removed Link dropdown */}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="border-b bg-background px-6 py-4">
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
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filters:</span>
              </div>

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
        <div className="flex-1 overflow-auto p-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
              {filteredAndSortedRoutines.map((routine) => {
                const isSelected = selectedRoutineIds.has(routine.id);
                return (
                  <RoutineChip
                    key={routine.id}
                    name={routine.label}
                    description={routine.description}
                    pelicoView={routine.pelicoViews && routine.pelicoViews.length > 0 ? routine.pelicoViews[0] : undefined}
                    selected={isSelected}
                    isSuggested={false}
                    onPreview={() => applyGenericRoutine(routine, onNavigate)}
                    onToggle={() => handleToggleRoutineSelection(routine)}
                    addLabel="Add"
                    removeLabel="Remove"
                  />
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

