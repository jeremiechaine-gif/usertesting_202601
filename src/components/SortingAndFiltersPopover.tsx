/**
 * Sorting & Filters Popover Component
 * Single source of truth for table sorting and filtering
 * Syncs bidirectionally with TanStack Table state
 */

import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
// Import refactored modules
import { useSortingFiltersState } from './sorting-filters/hooks/useSortingFiltersState';
import { draftSortingToTableState, draftFiltersToTableState } from './sorting-filters/stateAdapters';
import { getSortableColumns, groupFilterDefinitions, filterSearchResults, getColumnIdFromFilterId } from './sorting-filters/utils';
import { SortingSection } from './sorting-filters/SortingSection';
import { FiltersSection } from './sorting-filters/FiltersSection';

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
  hasUnsavedChanges?: boolean;
  
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
  hasUnsavedChanges = false,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'main' | 'add-filter'>('main');
  const [dismissedTip, setDismissedTip] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

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

  // Get sortable columns (memoized)
  const sortableColumns = useMemo(() => getSortableColumns(columns), [columns]);

  // Group filter definitions (memoized)
  const groupedFilters = useMemo(() => groupFilterDefinitions(filterDefinitions), [filterDefinitions]);

  // Filter search results (memoized)
  const filteredFilterDefs = useMemo(
    () => filterSearchResults(filterDefinitions, filterSearch),
    [filterDefinitions, filterSearch]
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

  // Calculate active counts from table state (for trigger badge)
  const activeSortCount = sorting.length;
  const activeFilterCount = columnFilters.length;
  const totalActiveCount = activeSortCount + activeFilterCount;


  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2 h-auto px-3 py-1.5">
      <Filter className="w-4 h-4" />
      Sorting and filters
      {totalActiveCount > 0 && (
        <Badge className="h-5 px-1.5 text-xs text-white ml-1" style={{ backgroundColor: '#31C7AD' }}>
          {totalActiveCount}
        </Badge>
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
        className="w-[800px] max-w-[90vw] p-0 flex flex-col !top-4 !bottom-4 !left-4 !right-auto !h-[calc(100vh-32px)] !max-h-[calc(100vh-32px)] rounded-lg [&>button]:hidden"
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
            filterDefinitions={filterDefinitions}
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
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={handleSave}
            onClearAll={handleClearAll}
            hasAnyActive={hasAnyActive}
            onClose={() => setOpen(false)}
            columns={columns}
          />
        ) : (
          <AddFilterView
            filterSearch={filterSearch}
            onFilterSearchChange={setFilterSearch}
            filteredFilterDefs={filteredFilterDefs}
            groupedFilters={groupedFilters}
            onSelectFilter={handleAddFilter}
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
  hasUnsavedChanges?: boolean;
  onSave: () => void;
  onClearAll: () => void;
  hasAnyActive: boolean;
  onClose: () => void;
  hasDraftChanges: boolean;
  onAddFilter: () => void;
  onUpdateFilterValues: (filterId: string, values: (string | number)[]) => void;
  onRemoveFilter: (filterId: string) => void;
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
  hasUnsavedChanges = false,
  onSave,
  onClearAll,
  hasAnyActive,
  onClose,
  hasDraftChanges,
  onAddFilter,
  onUpdateFilterValues,
  onRemoveFilter,
}) => {
  const selectedRoutine = selectedRoutineId ? getRoutine(selectedRoutineId) : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">Sorting & Filters</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Routine Section */}
      {selectedRoutine && (
        <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">Active Routine:</span>
            <span className="text-sm font-medium truncate max-w-[600px]" title={selectedRoutine.name}>
              {selectedRoutine.name}
            </span>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-4 min-h-0">
        <div className="py-4 space-y-4">
          <Accordion type="multiple" defaultValue={['sorting', 'filters']} className="w-full">
            <SortingSection
              draftSorting={draftSorting}
              sortableColumns={sortableColumns}
              dismissedTip={dismissedTip}
              onDismissTip={onDismissTip}
              onAddSort={onAddSort}
              onUpdateSort={onUpdateSort}
              onRemoveSort={onRemoveSort}
              onReorderSort={onReorderSort}
            />
            <Separator />
            <FiltersSection
              draftFilters={draftFilters}
              filterDefinitions={filterDefinitions}
              columns={columns}
              onAddFilter={onAddFilter}
              onUpdateFilterValues={onUpdateFilterValues}
              onRemoveFilter={onRemoveFilter}
              onOpenFilterModal={onOpenFilterModal}
            />
          </Accordion>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            disabled={!hasAnyActive}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs" style={{ backgroundColor: '#FFF3CD', color: '#856404', borderColor: '#FFE69C' }}>
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {(onSaveAsRoutine || onUpdateRoutine) ? (
            <div className="flex items-center">
              {/* Main Apply Button (left segment) */}
              <Button 
                variant="default" 
                size="sm" 
                className="bg-[#2063F0] hover:bg-[#1a54d8] rounded-r-none border-r border-r-[#1a54d8]"
                disabled={!hasDraftChanges}
                onClick={onSave}
              >
                Apply
              </Button>
              {/* Dropdown Trigger (right segment) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-[#2063F0] hover:bg-[#1a54d8] rounded-l-none px-2"
                    disabled={!hasDraftChanges}
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
                      disabled={!hasDraftChanges}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Update current routine
                    </DropdownMenuItem>
                  )}
                  {onSaveAsRoutine && (
                    <DropdownMenuItem 
                      onClick={() => {
                        onSave();
                        onSaveAsRoutine();
                      }}
                      disabled={!hasDraftChanges}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {selectedRoutineId ? 'Save as new routine' : 'Save as routine'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button variant="default" size="sm" onClick={onSave} disabled={!hasDraftChanges} className="bg-[#2063F0] hover:bg-[#1a54d8]">
              Apply
            </Button>
          )}
        </div>
      </div>
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
  onBack: () => void;
  onClose: () => void;
}

export const AddFilterView: React.FC<AddFilterViewProps> = ({
  filterSearch,
  onFilterSearchChange,
  filteredFilterDefs,
  groupedFilters,
  onSelectFilter,
  onBack,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold text-sm">Add filter</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter List */}
      <div className="flex-1 min-h-0 flex flex-col">
        <Command className="rounded-lg border-0 h-full flex flex-col">
          <div className="px-4 py-3 border-b shrink-0">
            <div className="flex items-center border rounded-md px-3 bg-background">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search filter…"
                value={filterSearch}
                onChange={(e) => onFilterSearchChange(e.target.value)}
                className="flex h-9 w-full rounded-md bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <CommandList className="flex-1 min-h-0 overflow-auto">
            {filterSearch ? (
              // Search results
              <>
                <CommandEmpty>No filters found.</CommandEmpty>
                <CommandGroup>
                  {filteredFilterDefs.map((filterDef) => (
                    <CommandItem
                      key={filterDef.id}
                      onSelect={() => onSelectFilter(filterDef)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Star
                        className={cn(
                          'h-4 w-4 shrink-0',
                          filterDef.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                        )}
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
                  <CommandGroup heading="FAVORITES">
                    {groupedFilters.favorites.map((filterDef) => (
                      <CommandItem
                        key={filterDef.id}
                        onSelect={() => onSelectFilter(filterDef)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Star className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400" />
                        <span className="flex-1">{filterDef.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {groupedFilters.general.length > 0 && (
                  <CommandGroup heading="GENERAL">
                    {groupedFilters.general.map((filterDef) => (
                      <CommandItem
                        key={filterDef.id}
                        onSelect={() => onSelectFilter(filterDef)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Star className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1">{filterDef.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {groupedFilters.consumedParts.length > 0 && (
                  <CommandGroup heading="CONSUMED PARTS">
                    {groupedFilters.consumedParts.map((filterDef) => (
                      <CommandItem
                        key={filterDef.id}
                        onSelect={() => onSelectFilter(filterDef)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Star className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1">{filterDef.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {groupedFilters.producedParts.length > 0 && (
                  <CommandGroup heading="PRODUCED PARTS">
                    {groupedFilters.producedParts.map((filterDef) => (
                      <CommandItem
                        key={filterDef.id}
                        onSelect={() => onSelectFilter(filterDef)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Star className="h-4 w-4 shrink-0 text-muted-foreground" />
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

