/**
 * Sorting & Filters Popover Component
 * Single source of truth for table sorting and filtering
 * Syncs bidirectionally with TanStack Table state
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterChip } from '@/components/ui/filter-chip';
import { SortChip } from '@/components/ui/sort-chip';
import {
  X,
  Plus,
  GripVertical,
  ArrowLeft,
  Info,
  Star,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';

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
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'main' | 'add-filter'>('main');
  const [draftSorting, setDraftSorting] = useState<SortConfig[]>([]);
  const [draftFilters, setDraftFilters] = useState<FilterConfig[]>([]);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [dismissedTip, setDismissedTip] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  // Initialize draft state from table state
  // Note: We reset draft state when popover opens to ensure it reflects current table state.
  // Closing without Save will discard draft changes (standard UX pattern for configuration panels).
  // This prevents accidental changes and makes the "Save" action explicit.
  useEffect(() => {
    const sortConfigs: SortConfig[] = sorting.map((sort, index) => ({
      id: `sort-${index}`,
      columnId: sort.id,
      direction: sort.desc ? 'desc' : 'asc',
    }));
    setDraftSorting(sortConfigs);

    const filterConfigs: FilterConfig[] = columnFilters.map((filter) => ({
      id: `filter-${filter.id}`,
      filterId: filter.id,
      values: Array.isArray(filter.value) ? filter.value : [filter.value].filter(Boolean),
    }));
    setDraftFilters(filterConfigs);
    setHasDraftChanges(false);
  }, [sorting, columnFilters, open]);

  // Helper to recursively find column by ID and get its label
  const getColumnLabel = (columnId: string): string => {
    const findColumn = (cols: ColumnDef<any>[]): ColumnDef<any> | null => {
      for (const col of cols) {
        if (col.id === columnId) {
          return col;
        }
        if ('columns' in col && Array.isArray(col.columns)) {
          const found = findColumn(col.columns);
          if (found) return found;
        }
      }
      return null;
    };

    const column = findColumn(columns);
    if (!column) return columnId;

    // Extract header text
    if (typeof column.header === 'string') {
      return column.header;
    }
    if (typeof column.header === 'function') {
      // For function headers, try to get a readable name from the column definition
      return column.id || columnId;
    }
    return column.id || columnId;
  };

  // Get sortable columns
  const sortableColumns = useMemo(() => {
    const getSortableColumns = (cols: ColumnDef<any>[]): Array<{ id: string; label: string }> => {
      const result: Array<{ id: string; label: string }> = [];
      for (const col of cols) {
        if (col.id && col.enableSorting !== false) {
          result.push({
            id: col.id,
            label: getColumnLabel(col.id),
          });
        }
        if ('columns' in col && Array.isArray(col.columns)) {
          result.push(...getSortableColumns(col.columns));
        }
      }
      return result;
    };
    return getSortableColumns(columns);
  }, [columns]);

  // Get filter definition by ID
  const getFilterDef = (filterId: string) => {
    return filterDefinitions.find((f) => f.id === filterId);
  };

  // Group filter definitions
  const groupedFilters = useMemo(() => {
    const favorites = filterDefinitions.filter((f) => f.isFavorite);
    const general = filterDefinitions.filter((f) => f.category === 'general');
    const consumedParts = filterDefinitions.filter((f) => f.category === 'consumed-parts');
    const producedParts = filterDefinitions.filter((f) => f.category === 'produced-parts');

    return { favorites, general, consumedParts, producedParts };
  }, [filterDefinitions]);

  // Filter search results
  const filteredFilterDefs = useMemo(() => {
    if (!filterSearch) return filterDefinitions;
    const searchLower = filterSearch.toLowerCase();
    return filterDefinitions.filter(
      (f) => f.label.toLowerCase().includes(searchLower) || f.id.toLowerCase().includes(searchLower)
    );
  }, [filterDefinitions, filterSearch]);

  // Apply draft changes to table
  const handleSave = () => {
    // Convert draft sorting to TanStack format
    const newSorting: SortingState = draftSorting.map((sort) => ({
      id: sort.columnId,
      desc: sort.direction === 'desc',
    }));
    onSortingChange(newSorting);

    // Convert draft filters to TanStack format
    const newFilters: ColumnFiltersState = draftFilters.map((filter) => ({
      id: filter.filterId,
      value: filter.values.length === 1 ? filter.values[0] : filter.values,
    }));
    onColumnFiltersChange(newFilters);

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

  // Map filter definition ID to column ID
  const getColumnIdFromFilterId = (filterId: string): string | null => {
    const mapping: Record<string, string> = {
      'part-name': 'partName',
      'part-number': 'partNumber',
      'type': 'type',
      'delivery-status': 'deliveryStatus',
      'plant': 'plant',
      'supplier': 'supplier',
      'buyer-codes': 'buyerCodes', // Generic buyer codes - might need specific column
      'escalation-level': 'escalationLevel',
      'otd-status': 'otdStatus',
      'open-quantity': 'openQuantity',
      'price': 'price',
      'inventory-value': 'inventoryValue',
      'consumed-part-buyer-codes': 'consumedPartBuyerCodes', // Might not exist as column
      'produced-part-buyer-codes': 'producedPartBuyerCodes', // Might not exist as column
    };
    return mapping[filterId] || null;
  };

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

  // Get filter display values
  const getFilterDisplayValues = (filter: FilterConfig): string[] => {
    const def = getFilterDef(filter.filterId);
    if (!def) return filter.values.map(String);

    return filter.values.map((val) => {
      if (def.options) {
        const option = def.options.find((opt) => opt.value === val);
        return option?.label || String(val);
      }
      return String(val);
    });
  };

  const hasActiveSorts = draftSorting.length > 0;
  const hasActiveFilters = draftFilters.length > 0;
  const hasAnyActive = hasActiveSorts || hasActiveFilters;

  // Calculate active counts from table state (for trigger badge)
  const activeSortCount = sorting.length;
  const activeFilterCount = columnFilters.length;
  const totalActiveCount = activeSortCount + activeFilterCount;


  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
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
        className="w-[560px] max-w-[90vw] p-0 flex flex-col !top-4 !bottom-4 !left-4 !right-auto !h-[calc(100vh-32px)] !max-h-[calc(100vh-32px)] rounded-lg [&>button]:hidden"
        style={{
          top: '16px',
          bottom: '16px',
          left: '16px',
          right: 'auto',
          height: 'calc(100vh - 32px)',
          maxHeight: 'calc(100vh - 32px)',
          width: '560px',
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
            getFilterDef={getFilterDef}
            getFilterColumnLabel={getColumnLabel}
            getFilterDisplayValues={getFilterDisplayValues}
            onSave={handleSave}
            onClearAll={handleClearAll}
            hasAnyActive={hasAnyActive}
            onClose={() => setOpen(false)}
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
  hasDraftChanges: boolean;
  dismissedTip: boolean;
  onDismissTip: () => void;
  onAddSort: () => void;
  onUpdateSort: (sortId: string, updates: Partial<SortConfig>) => void;
  onRemoveSort: (sortId: string) => void;
  onReorderSort: (fromIndex: number, toIndex: number) => void;
  onAddFilter: () => void;
  onUpdateFilterValues: (filterId: string, values: (string | number)[]) => void;
  onRemoveFilter: (filterId: string) => void;
  getFilterDef: (filterId: string) => FilterDefinition | undefined;
  getFilterColumnLabel: (columnId: string) => string;
  getFilterDisplayValues: (filter: FilterConfig) => string[];
  onSave: () => void;
  onClearAll: () => void;
  hasAnyActive: boolean;
  onClose: () => void;
}

const MainView: React.FC<MainViewProps> = ({
  draftSorting,
  draftFilters,
  sortableColumns,
  hasDraftChanges,
  dismissedTip,
  onDismissTip,
  onAddSort,
  onUpdateSort,
  onRemoveSort,
  onReorderSort,
  onAddFilter,
  onUpdateFilterValues,
  onRemoveFilter,
  getFilterDef,
  getFilterColumnLabel,
  getFilterDisplayValues,
  onSave,
  onClearAll,
  hasAnyActive,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">Sorting & Filters</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 min-h-0">
        <div className="py-4 space-y-4">
          {/* Current Sorting Section */}
          <Accordion type="multiple" defaultValue={['sorting', 'filters']} className="w-full">
            <AccordionItem value="sorting" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">CURRENT SORTING</span>
                  {draftSorting.length > 0 && (
                    <Badge className="h-5 px-1.5 text-xs text-white ml-1" style={{ backgroundColor: '#31C7AD' }}>
                      {draftSorting.length}
                    </Badge>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tip: Shift + click to multi-sort</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                {!dismissedTip && (
                  <div className="mb-3 p-2 bg-muted rounded-md flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      Tip: Shift + click to multi-sort
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 shrink-0"
                      onClick={onDismissTip}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {draftSorting.length === 0 ? (
                  <div className="border-2 border-dashed rounded-md p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">No sorting yet</p>
                    <Button variant="default" size="sm" onClick={onAddSort} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add sort
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" onClick={onAddSort} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add sort
                    </Button>
                    {draftSorting.map((sort, index) => (
                      <SortRow
                        key={sort.id}
                        sort={sort}
                        index={index}
                        sortableColumns={sortableColumns}
                        onUpdate={onUpdateSort}
                        onRemove={onRemoveSort}
                        onReorder={onReorderSort}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <Separator />

            {/* Current Filters Section */}
            <AccordionItem value="filters" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">CURRENT FILTERS</span>
                  {draftFilters.length > 0 && (
                    <Badge className="h-5 px-1.5 text-xs text-white ml-1" style={{ backgroundColor: '#31C7AD' }}>
                      {draftFilters.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                {draftFilters.length === 0 ? (
                  <div className="border-2 border-dashed rounded-md p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">No filter yet</p>
                    <Button variant="default" size="sm" onClick={onAddFilter} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add filter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button variant="default" size="sm" onClick={onAddFilter} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add filter
                    </Button>
                    {draftFilters.map((filter) => (
                      <FilterRow
                        key={filter.id}
                        filter={filter}
                        columnLabel={getFilterColumnLabel(filter.filterId)}
                        filterDef={getFilterDef(filter.filterId)}
                        displayValues={getFilterDisplayValues(filter)}
                        onUpdateValues={onUpdateFilterValues}
                        onRemove={onRemoveFilter}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          disabled={!hasAnyActive}
          className="text-muted-foreground"
        >
          Clear all
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={onSave} disabled={!hasDraftChanges}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

// Sort Row Component
interface SortRowProps {
  sort: SortConfig;
  index: number;
  sortableColumns: { id: string; label: string }[];
  onUpdate: (sortId: string, updates: Partial<SortConfig>) => void;
  onRemove: (sortId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const SortRow: React.FC<SortRowProps> = ({
  sort,
  index,
  sortableColumns,
  onUpdate,
  onRemove,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Select
        value={sort.columnId}
        onValueChange={(value) => onUpdate(sort.id, { columnId: value })}
      >
        <SelectTrigger className="flex-1 h-8">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent>
          {sortableColumns.map((col) => (
            <SelectItem key={col.id} value={col.id}>
              {col.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SortChip
        label=""
        direction={sort.direction}
        position={index + 1}
        showPosition={true}
        showDragHandle={false}
        onToggleDirection={() => onUpdate(sort.id, { direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
        onRemove={() => onRemove(sort.id)}
        className="flex-1"
      />
    </div>
  );
};

// Filter Row Component
interface FilterRowProps {
  filter: FilterConfig;
  columnLabel: string;
  filterDef: FilterDefinition | undefined;
  displayValues: string[];
  onUpdateValues: (filterId: string, values: (string | number)[]) => void;
  onRemove: (filterId: string) => void;
}

const FilterRow: React.FC<FilterRowProps> = ({
  filter,
  columnLabel,
  filterDef,
  displayValues,
  onUpdateValues,
  onRemove,
}) => {
  const handleRemoveValue = (value: string | number) => {
    const newValues = filter.values.filter((v) => v !== value);
    onUpdateValues(filter.id, newValues);
  };

  return (
    <FilterChip
      label={columnLabel}
      values={filter.values}
      displayValues={displayValues}
      options={filterDef?.options?.map((opt) => ({ value: opt.value, label: opt.label }))}
      maxVisible={2}
      onRemove={() => onRemove(filter.id)}
      onRemoveValue={handleRemoveValue}
      onUpdateValues={(values) => onUpdateValues(filter.id, values)}
      enableInlineEdit={!!filterDef?.options}
      showEditButton={false}
    />
  );
};

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

