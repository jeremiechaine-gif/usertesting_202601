/**
 * Sorting & Filters Popover Component
 * Single source of truth for table sorting and filtering
 * Syncs bidirectionally with TanStack Table state
 */

import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { getRoutine } from '@/lib/routines';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  X,
  ArrowLeft,
  Star,
  ChevronRight,
  Filter,
  Search,
  ChevronDown,
  Zap,
  Target,
  Info,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
// Import refactored modules
import { useSortingFiltersState } from './sorting-filters/hooks/useSortingFiltersState';
import { draftSortingToTableState, draftFiltersToTableState, tableStateToDraftSorting, tableStateToDraftFilters } from './sorting-filters/stateAdapters';
import { getSortableColumns, groupFilterDefinitions, filterSearchResults, getColumnIdFromFilterId } from './sorting-filters/utils';
import { SortingSection } from './sorting-filters/SortingSection';
import { FiltersSection } from './sorting-filters/FiltersSection';
import { ScopeFiltersSection } from './sorting-filters/ScopeFiltersSection';
import { getFilterDisplayValues, getColumnLabel } from './sorting-filters/utils';
import type { ScopeFilter } from '@/lib/scopes';
// @ts-expect-error - filterDefinitions is used in useState initializer which TypeScript doesn't detect
import { filterDefinitions } from '@/lib/filterDefinitions';

// Types
export interface SortConfig {
  id: string;
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  id: string;
  filterId: string;
  values: (string | number)[];
}

export interface FilterDefinition {
  id: string;
  label: string;
  category: 'favorites' | 'general' | 'consumed-parts' | 'produced-parts';
  type: 'text' | 'number' | 'date' | 'select' | 'multi-select';
  options?: { label: string; value: string | number }[];
  isFavorite?: boolean;
}

interface SortingAndFiltersPopoverProps {
  // Table state (read-only for display)
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  
  // Table callbacks
  onSortingChange: (sorting: SortingState) => void;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  
  // Column definitions for sortable columns
  columns: ColumnDef<any>[];
  
  // Filter definitions
  filterDefinitions: FilterDefinition[];
  
  // Callback to open filter modal for a column
  onOpenFilterModal?: (columnId: string) => void;
  
  // Routine information
  selectedRoutineId?: string | null;
  onSaveAsRoutine?: () => void;
  onUpdateRoutine?: () => void;
  
  // Scope information
  scopeFilters?: Array<{ id: string; filterId: string; values: (string | number)[] }>;
  currentScopeName?: string;
  
  // Routine filters for comparison (to show red dot if at least one filter is not saved)
  routineFilters?: ColumnFiltersState;
  
  // Trigger button (optional, can be passed as children)
  trigger?: React.ReactNode;
}

export const SortingAndFiltersPopover: React.FC<SortingAndFiltersPopoverProps> = ({
  sorting,
  columnFilters,
  onSortingChange,
  onColumnFiltersChange,
  columns,
  filterDefinitions,
  onOpenFilterModal,
  selectedRoutineId,
  onSaveAsRoutine,
  onUpdateRoutine,
  scopeFilters = [],
  currentScopeName,
  routineFilters = [],
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'main' | 'add-filter'>('main');
  const [dismissedTip, setDismissedTip] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  // Session-only favorites state
  const [sessionFavorites, setSessionFavorites] = useState<Set<string>>(
    new Set(filterDefinitions.filter(f => f.isFavorite).map(f => f.id))
  );

  // Use custom hook for draft state management
  const {
    draftSorting,
    draftFilters,
    hasDraftChanges,
    setDraftSorting,
    setDraftFilters,
    setHasDraftChanges,
  } = useSortingFiltersState({
    sorting,
    columnFilters,
    modalOpen: open,
  });

  // Get routine for comparison
  const selectedRoutine = selectedRoutineId ? getRoutine(selectedRoutineId) : null;
  
  // Determine which chips are not part of the routine (for orange highlighting)
  const chipsNotInRoutine = useMemo(() => {
    if (!selectedRoutineId || !selectedRoutine || !hasDraftChanges) {
      return { sorts: new Set<string>(), filters: new Set<string>() };
    }

    const routineSorting = tableStateToDraftSorting(selectedRoutine.sorting);
    const routineFilters = tableStateToDraftFilters(selectedRoutine.filters);

    // Find sorts not in routine
    const sortsNotInRoutine = new Set<string>();
    draftSorting.forEach((draftSort) => {
      const existsInRoutine = routineSorting.some(
        (routineSort: SortConfig) =>
          routineSort.columnId === draftSort.columnId &&
          routineSort.direction === draftSort.direction
      );
      if (!existsInRoutine) {
        sortsNotInRoutine.add(draftSort.id);
      }
    });

    // Find filters not in routine
    const filtersNotInRoutine = new Set<string>();
    draftFilters.forEach((draftFilter) => {
      const existsInRoutine = routineFilters.some((routineFilter: FilterConfig) => {
        if (routineFilter.filterId !== draftFilter.filterId) return false;
        // Compare values
        const draftValues = [...draftFilter.values].sort().join(',');
        const routineValues = [...routineFilter.values].sort().join(',');
        return draftValues === routineValues;
      });
      if (!existsInRoutine) {
        filtersNotInRoutine.add(draftFilter.id);
      }
    });

    return { sorts: sortsNotInRoutine, filters: filtersNotInRoutine };
  }, [selectedRoutineId, selectedRoutine, draftSorting, draftFilters, hasDraftChanges]);

  // Get sortable columns (memoized)
  const sortableColumns = useMemo(() => getSortableColumns(columns), [columns]);

  // Group filter definitions (memoized) - update favorites based on session state
  const filterDefinitionsWithFavorites = useMemo(() => {
    return filterDefinitions.map(f => ({
      ...f,
      isFavorite: sessionFavorites.has(f.id),
      category: sessionFavorites.has(f.id) ? 'favorites' : f.category,
    }));
  }, [sessionFavorites]);

  const groupedFilters = useMemo(() => groupFilterDefinitions(filterDefinitionsWithFavorites), [filterDefinitionsWithFavorites]);

  // Filter search results (memoized) - use updated filter definitions with favorites
  const filteredFilterDefs = useMemo(
    () => filterSearchResults(filterDefinitionsWithFavorites, filterSearch),
    [filterDefinitionsWithFavorites, filterSearch]
  );

  // Apply draft changes to table
  const handleSave = () => {
    const newSorting = draftSortingToTableState(draftSorting);
    const newFilters = draftFiltersToTableState(draftFilters);
    
    onSortingChange(newSorting);
    onColumnFiltersChange(newFilters);

    // Reset draft changes flag and close modal
    // Note: The hook will sync draft state with new table state on next render
    setHasDraftChanges(false);
    setOpen(false);
  };

  // Clear all sorts and filters
  const handleClearAll = () => {
    setDraftSorting([]);
    setDraftFilters([]);
    setHasDraftChanges(true);
  };

  // Add sort
  const handleAddSort = () => {
    const newSort: SortConfig = {
      id: `sort-${Date.now()}`,
      columnId: sortableColumns[0]?.id || '',
      direction: 'asc',
    };
    setDraftSorting([...draftSorting, newSort]);
    setHasDraftChanges(true);
  };

  // Update sort
  const handleUpdateSort = (sortId: string, updates: Partial<SortConfig>) => {
    setDraftSorting(
      draftSorting.map((sort) => (sort.id === sortId ? { ...sort, ...updates } : sort))
    );
    setHasDraftChanges(true);
  };

  // Remove sort
  const handleRemoveSort = (sortId: string) => {
    setDraftSorting(draftSorting.filter((sort) => sort.id !== sortId));
    setHasDraftChanges(true);
  };

  // Reorder sorts
  const handleReorderSort = (fromIndex: number, toIndex: number) => {
    const newSorting = [...draftSorting];
    const [removed] = newSorting.splice(fromIndex, 1);
    newSorting.splice(toIndex, 0, removed);
    setDraftSorting(newSorting);
    setHasDraftChanges(true);
  };

  // Use utility function for filter ID to column ID mapping
  // (getColumnIdFromFilterId is imported from utils)

  // Add filter
  const handleAddFilter = (filterDef: FilterDefinition) => {
    // Check if this filter maps to a column - if so, open the column filter modal
    const columnId = getColumnIdFromFilterId(filterDef.id);
    if (columnId && onOpenFilterModal) {
      // Close the popover and open the filter modal
      setView('main');
      setFilterSearch('');
      setOpen(false);
      onOpenFilterModal(columnId);
      return;
    }

    // Otherwise, add filter to draft (for filters that don't map to columns)
    const existingFilter = draftFilters.find((f) => f.filterId === filterDef.id);
    if (existingFilter) {
      // If exists, just switch to main view (user can edit it there)
      setView('main');
      setFilterSearch('');
      return;
    }

    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      filterId: filterDef.id,
      values: filterDef.type === 'select' && filterDef.options ? [filterDef.options[0].value] : [],
    };
    setDraftFilters([...draftFilters, newFilter]);
    setView('main');
    setFilterSearch('');
    setHasDraftChanges(true);
  };

  // Update filter values
  const handleUpdateFilterValues = (filterId: string, values: (string | number)[]) => {
    setDraftFilters(
      draftFilters.map((filter) => (filter.id === filterId ? { ...filter, values } : filter))
    );
    setHasDraftChanges(true);
  };

  // Remove filter
  const handleRemoveFilter = (filterId: string) => {
    setDraftFilters(draftFilters.filter((filter) => filter.id !== filterId));
    setHasDraftChanges(true);
  };


  const hasActiveSorts = draftSorting.length > 0;
  const hasActiveFilters = draftFilters.length > 0;
  const hasAnyActive = hasActiveSorts || hasActiveFilters;

  // Calculate active counts from user/routine filters only (exclude scope filters)
  // columnFilters passed to this component are already user/routine filters only
  const activeSortCount = sorting.length;
  const activeFilterCount = columnFilters.length;
  const totalActiveCount = activeSortCount + activeFilterCount;


  // Calculate hasUnsavedChanges using the same logic as PurchaseOrderBookPage
  // This determines when routine creation/update buttons should be enabled
  const hasUnsavedChanges = useMemo(() => {
    // If no routine selected, check if there are any sorts or filters in draft state
    if (!selectedRoutineId) {
      return draftSorting.length > 0 || draftFilters.length > 0;
    }
    
    const routine = getRoutine(selectedRoutineId);
    if (!routine) return false;
    
    // Compare draft sorting with routine sorting
    const routineSorting = tableStateToDraftSorting(routine.sorting);
    const sortingMatches = JSON.stringify(draftSorting.sort((a, b) => a.id.localeCompare(b.id))) === 
                          JSON.stringify(routineSorting.sort((a, b) => a.id.localeCompare(b.id)));
    
    // Compare draft filters with routine filters
    const routineFiltersDraft = tableStateToDraftFilters(routine.filters);
    const filtersMatches = JSON.stringify(draftFilters.sort((a, b) => a.id.localeCompare(b.id))) === 
                          JSON.stringify(routineFiltersDraft.sort((a, b) => a.id.localeCompare(b.id)));
    
    // Return true if there are changes
    return !sortingMatches || !filtersMatches;
  }, [selectedRoutineId, draftSorting, draftFilters]);

  // Check if at least one filter is not saved in routine (for red dot indicator)
  const hasUnsavedFilter = useMemo(() => {
    if (!selectedRoutineId || routineFilters.length === 0) {
      // If no routine selected or no routine filters, check if there are any user filters
      return columnFilters.length > 0;
    }
    
    // Normalize filter values for comparison
    const normalizeValue = (val: unknown) => {
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return String(val);
    };
    
    // Check if at least one filter in columnFilters doesn't match routineFilters
    for (const userFilter of columnFilters) {
      const routineFilter = routineFilters.find((rf: any) => rf.id === userFilter.id);
      
      if (!routineFilter) {
        // Filter exists in user filters but not in routine filters
        return true;
      }
      
      // Compare values
      if (normalizeValue(userFilter.value) !== normalizeValue(routineFilter.value)) {
        // Filter value doesn't match routine filter value
        return true;
      }
    }
    
    // Also check if routine has filters that user doesn't have (shouldn't happen, but check anyway)
    for (const routineFilter of routineFilters) {
      const userFilter = columnFilters.find((uf: any) => uf.id === routineFilter.id);
      if (!userFilter) {
        // Routine has a filter that user doesn't have (routine was modified)
        return true;
      }
    }
    
    return false;
  }, [selectedRoutineId, columnFilters, routineFilters]);

  const defaultTrigger = (
    <Button variant="secondary" size="sm" className="gap-2 h-auto px-3 py-1.5 relative">
      <Filter className="w-4 h-4" />
      {totalActiveCount > 0 ? (
        <Badge variant="secondary" className="h-4 px-1.5 text-xs text-muted-foreground ml-1 bg-muted/60 border-border/60">
          {totalActiveCount}
        </Badge>
      ) : null}
      {hasUnsavedFilter && (
        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
      )}
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[1000px] max-w-[90vw] p-0 flex flex-col !top-4 !bottom-4 !left-4 !right-auto !h-[calc(100vh-32px)] !max-h-[calc(100vh-32px)] rounded-lg [&>button]:hidden"
        style={{
          top: '16px',
          bottom: '16px',
          left: '16px',
          right: 'auto',
          height: 'calc(100vh - 32px)',
          maxHeight: 'calc(100vh - 32px)',
          width: '800px',
        }}
        onEscapeKeyDown={() => {
          if (view === 'add-filter') {
            setView('main');
            setFilterSearch('');
          } else {
            setOpen(false);
          }
        }}
      >
        {view === 'main' ? (
          <MainView
            draftSorting={draftSorting}
            draftFilters={draftFilters}
            sortableColumns={sortableColumns}
            filterDefinitions={filterDefinitionsWithFavorites}
            hasDraftChanges={hasDraftChanges}
            dismissedTip={dismissedTip}
            onDismissTip={() => setDismissedTip(true)}
            onAddSort={handleAddSort}
            onUpdateSort={handleUpdateSort}
            onRemoveSort={handleRemoveSort}
            onReorderSort={handleReorderSort}
            onAddFilter={() => setView('add-filter')}
            onUpdateFilterValues={handleUpdateFilterValues}
            onRemoveFilter={handleRemoveFilter}
            onOpenFilterModal={onOpenFilterModal}
            selectedRoutineId={selectedRoutineId}
            onSaveAsRoutine={onSaveAsRoutine}
            onUpdateRoutine={onUpdateRoutine}
            onSave={handleSave}
            onClearAll={handleClearAll}
            hasUnsavedChanges={hasUnsavedChanges}
            hasAnyActive={hasAnyActive}
            onClose={() => setOpen(false)}
            columns={columns}
            chipsNotInRoutine={chipsNotInRoutine}
            scopeFilters={scopeFilters}
            currentScopeName={currentScopeName}
          />
        ) : (
          <AddFilterView
            filterSearch={filterSearch}
            onFilterSearchChange={setFilterSearch}
            filteredFilterDefs={filteredFilterDefs}
            groupedFilters={groupedFilters}
            onSelectFilter={handleAddFilter}
            onToggleFavorite={(filterId) => {
              setSessionFavorites(prev => {
                const newSet = new Set(prev);
                if (newSet.has(filterId)) {
                  newSet.delete(filterId);
                } else {
                  newSet.add(filterId);
                }
                return newSet;
              });
            }}
            onOpenFilterModal={onOpenFilterModal}
            getColumnIdFromFilterId={getColumnIdFromFilterId}
            onBack={() => {
              setView('main');
              setFilterSearch('');
            }}
            onClose={() => setOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

// Main View Component
interface MainViewProps {
  draftSorting: SortConfig[];
  draftFilters: FilterConfig[];
  sortableColumns: { id: string; label: string }[];
  filterDefinitions: FilterDefinition[];
  columns: ColumnDef<any>[];
  dismissedTip: boolean;
  onDismissTip: () => void;
  onAddSort: () => void;
  onUpdateSort: (sortId: string, updates: Partial<SortConfig>) => void;
  onRemoveSort: (sortId: string) => void;
  onReorderSort: (fromIndex: number, toIndex: number) => void;
  onOpenFilterModal?: (columnId: string) => void;
  selectedRoutineId?: string | null;
  onSaveAsRoutine?: () => void;
  onUpdateRoutine?: () => void;
  onSave: () => void;
  onClearAll: () => void;
  hasAnyActive: boolean;
  onClose: () => void;
  hasDraftChanges: boolean;
  hasUnsavedChanges: boolean;
  onAddFilter: () => void;
  onUpdateFilterValues: (filterId: string, values: (string | number)[]) => void;
  onRemoveFilter: (filterId: string) => void;
  chipsNotInRoutine: { sorts: Set<string>; filters: Set<string> };
  scopeFilters?: Array<{ id: string; filterId: string; values: (string | number)[] }>;
  currentScopeName?: string;
}

const MainView: React.FC<MainViewProps> = ({
  draftSorting,
  draftFilters,
  sortableColumns,
  filterDefinitions,
  columns,
  dismissedTip,
  onDismissTip,
  onAddSort,
  onUpdateSort,
  onRemoveSort,
  onReorderSort,
  onOpenFilterModal,
  selectedRoutineId,
  onSaveAsRoutine,
  onUpdateRoutine,
  onSave,
  onClearAll,
  hasAnyActive,
  onClose,
  hasDraftChanges,
  hasUnsavedChanges,
  onAddFilter,
  onUpdateFilterValues,
  onRemoveFilter,
  chipsNotInRoutine,
  scopeFilters = [],
  currentScopeName,
}) => {
  const selectedRoutine = selectedRoutineId ? getRoutine(selectedRoutineId) : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Hero Header with Gradient */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
        <div className="relative px-6 pt-6 pb-5 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                <Filter className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Sorting & Filters
              </h3>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-6 py-5 space-y-6 min-w-0">
          <Accordion type="multiple" defaultValue={['active-routine', 'sorting', 'filters']} className="w-full min-w-0">
            {/* ACTIVE SCOPE Section - Always visible, collapsed by default */}
            <AccordionItem value="active-scope" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-gradient-to-br from-[#31C7AD]/10 to-[#2063F0]/10">
                    <Target className="h-3.5 w-3.5 text-[#31C7AD]" />
                  </div>
                  <span className="text-sm font-medium">
                    {currentScopeName ? `ACTIVE SCOPE: ${currentScopeName}` : 'ACTIVE SCOPE: None'}
                  </span>
                  {scopeFilters && scopeFilters.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-xs text-muted-foreground ml-1 bg-muted/60 border-border/60">
                      {scopeFilters.filter((f) => f.values && f.values.length > 0).length}
                    </Badge>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-1 p-0.5 rounded hover:bg-muted/50 cursor-help">
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-medium text-foreground">Scope filters</span> are applied automatically to all views and cannot be modified here. To change them, edit your scope settings.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3 pb-4 min-w-0">
                {scopeFilters && scopeFilters.length > 0 ? (
                  <ScopeFiltersContent
                    scopeFilters={scopeFilters}
                    filterDefinitions={filterDefinitions}
                    columns={columns}
                  />
                ) : (
                  <div className="text-xs text-muted-foreground pl-4">
                    No scope filters active
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            <Separator className="my-6" />
            
            {/* ACTIVE ROUTINE Section - Always visible, expanded by default, contains Sorting and Filters */}
            <AccordionItem value="active-routine" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-gradient-to-br from-[#2063F0]/10 to-[#2063F0]/5">
                    <Zap className="h-3.5 w-3.5 text-[#2063F0]" />
                  </div>
                  <span className="text-sm font-medium">
                    {selectedRoutine ? `ACTIVE ROUTINE: ${selectedRoutine.name}` : 'ACTIVE ROUTINE: None'}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3 pb-4 min-w-0">
                <div className="pl-4 border-l-2 border-[#2063F0]/20">
                  {/* Nested Accordion for Sorting and Filters */}
                  <Accordion type="multiple" defaultValue={['sorting', 'filters']} className="w-full min-w-0">
                    {/* Sorting Section - Nested under Routine */}
                    <SortingSection
                      draftSorting={draftSorting}
                      sortableColumns={sortableColumns}
                      dismissedTip={dismissedTip}
                      onDismissTip={onDismissTip}
                      onAddSort={onAddSort}
                      onUpdateSort={onUpdateSort}
                      onRemoveSort={onRemoveSort}
                      onReorderSort={onReorderSort}
                      sortsNotInRoutine={chipsNotInRoutine.sorts}
                    />
                    
                    {/* User/Routine Filters Section - Nested under Routine */}
                    <FiltersSection
                      draftFilters={draftFilters}
                      filterDefinitions={filterDefinitions}
                      columns={columns}
                      onAddFilter={onAddFilter}
                      onUpdateFilterValues={onUpdateFilterValues}
                      onRemoveFilter={onRemoveFilter}
                      onOpenFilterModal={onOpenFilterModal}
                      filtersNotInRoutine={chipsNotInRoutine.filters}
                    />
                  </Accordion>
                </div>
              </AccordionContent>
            </AccordionItem>
            <Separator className="my-6" />
          </Accordion>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/20 shrink-0 gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            disabled={!hasAnyActive}
            className="h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            Clear all
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Segmented Control: Default action based on routine status */}
          {(onSaveAsRoutine || onUpdateRoutine) && (
            <div className="flex items-center shadow-sm">
              {/* Main Button (left segment) - Default action */}
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-r-none border-r h-9 border-border/60"
                disabled={!hasUnsavedChanges}
                onClick={() => {
                  onSave();
                  if (selectedRoutineId && onUpdateRoutine) {
                    onUpdateRoutine();
                  } else if (onSaveAsRoutine) {
                    onSaveAsRoutine();
                  }
                }}
              >
                {selectedRoutineId ? 'Update routine' : 'Create routine'}
              </Button>
              {/* Dropdown Trigger (right segment) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-l-none px-2 h-9"
                    disabled={!hasUnsavedChanges}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]">
                  {selectedRoutineId && onUpdateRoutine && (
                    <DropdownMenuItem 
                      onClick={() => {
                        onSave();
                        onUpdateRoutine();
                      }}
                      disabled={!hasUnsavedChanges}
                    >
                      Update current routine
                    </DropdownMenuItem>
                  )}
                  {onSaveAsRoutine && (
                    <DropdownMenuItem 
                      onClick={() => {
                        onSave();
                        onSaveAsRoutine();
                      }}
                      disabled={!hasUnsavedChanges}
                    >
                      {selectedRoutineId ? 'Save as new routine' : 'Create routine'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {/* Apply Button - variant="default" (1st Priority) */}
          <Button 
            variant="default" 
            size="sm" 
            onClick={onSave} 
            disabled={!hasDraftChanges}
            className="h-9"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

// Scope Filters Content Component (content only, without AccordionItem wrapper)
interface ScopeFiltersContentProps {
  scopeFilters: Array<{ id: string; filterId: string; values: (string | number)[] }>;
  filterDefinitions: FilterDefinition[];
  columns: ColumnDef<any>[];
}

const ScopeFiltersContent: React.FC<ScopeFiltersContentProps> = ({
  scopeFilters,
  filterDefinitions,
  columns,
}) => {
  // Filter out filters with empty values
  const validFilters = scopeFilters.filter((filter) => filter.values && filter.values.length > 0);
  
  const getFilterDef = (filterId: string): FilterDefinition | undefined => {
    return filterDefinitions.find((f) => f.id === filterId);
  };

  if (validFilters.length === 0) {
    return (
      <div className="text-xs text-muted-foreground pl-4">
        No scope filters active
      </div>
    );
  }

  return (
    <div className="space-y-2.5 w-full min-w-0 overflow-hidden">
      {validFilters.map((filter) => {
        const filterDef = getFilterDef(filter.filterId);
        const displayValues = getFilterDisplayValues(filter, filterDef);
        const columnLabel = getColumnLabel(filter.filterId, columns);
        
        return (
          <div
            key={filter.id}
            className="group relative rounded-lg border border-[#31C7AD]/20 bg-gradient-to-r from-[#31C7AD]/5 via-transparent to-transparent p-3.5 transition-all hover:border-[#31C7AD]/30 hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              {/* Lock Icon */}
              <div className="p-1.5 rounded-md bg-[#31C7AD]/10 shrink-0 mt-0.5">
                <Lock className="h-3.5 w-3.5 text-[#31C7AD]" />
              </div>
              
              {/* Filter Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    {columnLabel}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="h-5 px-1.5 text-xs font-medium border-[#31C7AD]/40 text-[#31C7AD] bg-[#31C7AD]/5"
                  >
                    Scope
                  </Badge>
                </div>
                
                {/* Filter Values */}
                {displayValues.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {displayValues.map((value, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-background border border-border/60 text-foreground"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No values selected</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// SortRow component is now in src/components/sorting-filters/SortRow.tsx

// FilterRow component is now in src/components/sorting-filters/FilterRow.tsx

// Add Filter View Component
export interface AddFilterViewProps {
  filterSearch: string;
  onFilterSearchChange: (value: string) => void;
  filteredFilterDefs: FilterDefinition[];
  groupedFilters: {
    favorites: FilterDefinition[];
    general: FilterDefinition[];
    consumedParts: FilterDefinition[];
    producedParts: FilterDefinition[];
  };
  onSelectFilter: (filterDef: FilterDefinition) => void;
  onToggleFavorite: (filterId: string) => void;
  onOpenFilterModal?: (columnId: string) => void;
  getColumnIdFromFilterId: (filterId: string) => string | null;
  onBack: () => void;
  onClose: () => void;
  hideHeader?: boolean; // Option to hide the internal header
}

export const AddFilterView: React.FC<AddFilterViewProps> = ({
  filterSearch,
  onFilterSearchChange,
  filteredFilterDefs,
  groupedFilters,
  onSelectFilter,
  onToggleFavorite,
  onOpenFilterModal,
  getColumnIdFromFilterId,
  onBack,
  onClose,
  hideHeader = false,
}) => {
  const handleStarClick = (e: React.MouseEvent, filterId: string) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleFavorite(filterId);
  };

  const handleFilterClick = (filterDef: FilterDefinition) => {
    // Map filter ID to column ID and open the filter modal
    const columnId = getColumnIdFromFilterId(filterDef.id);
    if (columnId && onOpenFilterModal) {
      onOpenFilterModal(columnId);
    } else {
      // Fallback: use onSelectFilter if no column mapping
      onSelectFilter(filterDef);
    }
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header - Only show if not hidden */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-sm">Ajouter un filtre</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className={`px-4 py-3 ${hideHeader ? '' : 'border-b'} shrink-0`}>
        <div className="flex items-center border rounded-md px-3 bg-background">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            placeholder="Rechercher un filtre…"
            value={filterSearch}
            onChange={(e) => onFilterSearchChange(e.target.value)}
            className="flex h-9 w-full rounded-md bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Filter List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Command className="rounded-lg border-0 h-full flex flex-col">
          <CommandList className="h-full overflow-y-auto !max-h-none">
            {filterSearch ? (
              // Search results
              <>
                <CommandEmpty>Aucun filtre trouvé.</CommandEmpty>
                <CommandGroup>
                  {filteredFilterDefs.map((filterDef) => (
                    <CommandItem
                      key={filterDef.id}
                      onSelect={() => handleFilterClick(filterDef)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Star
                        className={cn(
                          'h-4 w-4 shrink-0 cursor-pointer',
                          filterDef.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                        )}
                        onClick={(e) => handleStarClick(e, filterDef.id)}
                      />
                      <span className="flex-1">{filterDef.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : (
              // Grouped view
              <>
                {groupedFilters.favorites.length > 0 && (
                  <CommandGroup heading="FAVORIS">
                    {groupedFilters.favorites.map((filterDef) => (
                      <CommandItem
                        key={filterDef.id}
                        onSelect={() => handleFilterClick(filterDef)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Star 
                          className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400 cursor-pointer" 
                          onClick={(e) => handleStarClick(e, filterDef.id)}
                        />
                        <span className="flex-1">{filterDef.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {groupedFilters.general.length > 0 && (
                  <CommandGroup heading="GÉNÉRAL">
                    {groupedFilters.general.map((filterDef) => (
                      <CommandItem
                        key={filterDef.id}
                        onSelect={() => handleFilterClick(filterDef)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Star 
                          className="h-4 w-4 shrink-0 text-muted-foreground cursor-pointer" 
                          onClick={(e) => handleStarClick(e, filterDef.id)}
                        />
                        <span className="flex-1">{filterDef.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {groupedFilters.consumedParts.length > 0 && (
                  <CommandGroup heading="PIÈCES CONSOMMÉES">
                    {groupedFilters.consumedParts.map((filterDef) => (
                      <CommandItem
                        key={filterDef.id}
                        onSelect={() => handleFilterClick(filterDef)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Star 
                          className="h-4 w-4 shrink-0 text-muted-foreground cursor-pointer" 
                          onClick={(e) => handleStarClick(e, filterDef.id)}
                        />
                        <span className="flex-1">{filterDef.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {groupedFilters.producedParts.length > 0 && (
                  <CommandGroup heading="PIÈCES PRODUITES">
                    {groupedFilters.producedParts.map((filterDef) => (
                      <CommandItem
                        key={filterDef.id}
                        onSelect={() => handleFilterClick(filterDef)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Star 
                          className="h-4 w-4 shrink-0 text-muted-foreground cursor-pointer" 
                          onClick={(e) => handleStarClick(e, filterDef.id)}
                        />
                        <span className="flex-1">{filterDef.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </div>
    </div>
  );
};

