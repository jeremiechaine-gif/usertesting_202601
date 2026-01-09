/**
 * Step 3: Configure the Routine
 * Let users apply filters, sorting, and view-specific settings
 */

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Plus, X } from 'lucide-react';
import type { Objective } from '@/lib/onboarding/types';
import type { PelicoViewDefinition } from '@/lib/onboarding/pelicoViews';
import type { ColumnFiltersState, SortingState, ColumnSizingState, ColumnResizeMode } from '@tanstack/react-table';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { columns } from '@/lib/columns';
import { mockData } from '@/lib/mockData';
import { tableStateToDraftSorting, tableStateToDraftFilters, draftSortingToTableState, draftFiltersToTableState } from '@/components/sorting-filters/stateAdapters';
import { getSortableColumns, getColumnIdFromFilterId, groupFilterDefinitions, filterSearchResults } from '@/components/sorting-filters/utils';
import type { SortConfig, FilterConfig, FilterDefinition } from '@/components/SortingAndFiltersPopover';
import { AddFilterView } from '@/components/SortingAndFiltersPopover';
import { useScope } from '@/contexts/ScopeContext';
import { ColumnHeader } from '@/components/ColumnHeader';
import { SortingAndFiltersPopover } from '@/components/SortingAndFiltersPopover';
import { ColumnsPopover } from '@/components/ColumnsPopover';
import { cn } from '@/lib/utils';

// Lazy load ColumnFilterModal
const ColumnFilterModal = lazy(() => import('@/components/ColumnFilterModal').then(m => ({ default: m.ColumnFilterModal })));

interface Step3ConfigureRoutineProps {
  view: PelicoViewDefinition;
  filters: ColumnFiltersState;
  sorting: SortingState;
  onFiltersChange: (filters: ColumnFiltersState) => void;
  onSortingChange: (sorting: SortingState) => void;
  onNext: () => void;
  onBack: () => void;
  // Optional props for routine name/description
  routineName?: string;
  routineDescription?: string;
  onRoutineNameChange?: (name: string) => void;
  onRoutineDescriptionChange?: (description: string) => void;
  // Optional props for objective
  selectedObjective?: Objective | string;
  customObjective?: string;
  showCustomObjectiveInput?: boolean;
  onObjectiveChange?: (objective: Objective | string) => void;
  onCustomObjectiveChange?: (objective: string) => void;
  onShowCustomObjectiveInputChange?: (show: boolean) => void;
}

export const Step3ConfigureRoutine: React.FC<Step3ConfigureRoutineProps> = ({
  view,
  filters,
  sorting,
  onFiltersChange,
  onSortingChange,
  onNext,
  onBack,
  routineName = '',
  routineDescription = '',
  onRoutineNameChange,
  onRoutineDescriptionChange,
  selectedObjective = '',
  customObjective = '',
  showCustomObjectiveInput = false,
  onObjectiveChange,
  onCustomObjectiveChange,
  onShowCustomObjectiveInputChange,
}) => {
  // Scope context for scope filters
  const { getScopeFilters, currentScope } = useScope();
  
  // Scope filters (read-only, applied to table)
  const scopeFilters = useMemo(() => getScopeFilters(), [getScopeFilters]);
  
  // User filters (from wizard state, can be modified)
  const userFilters = useMemo(() => filters, [filters]);
  
  // Combined filters for table (scope + user)
  const columnFilters = useMemo(() => {
    const combined: ColumnFiltersState = [...scopeFilters];
    userFilters.forEach(userFilter => {
      const existingIndex = combined.findIndex(f => f.id === userFilter.id);
      if (existingIndex >= 0) {
        // User filter overrides scope filter for same column
        combined[existingIndex] = userFilter;
      } else {
        // Add new user filter
        combined.push(userFilter);
      }
    });
    return combined;
  }, [scopeFilters, userFilters]);
  
  // Table state
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterModalColumnId, setFilterModalColumnId] = useState<string | null>(null);
  const [filterModalColumnLabel, setFilterModalColumnLabel] = useState<string>('');
  const [filterModalOptions, setFilterModalOptions] = useState<Array<{ label: string; value: string | number }>>([]);
  const [filterModalSelectedValues, setFilterModalSelectedValues] = useState<(string | number)[]>([]);
  const [filterModalCondition, setFilterModalCondition] = useState<string>('is');
  const [showAddFilterView, setShowAddFilterView] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [sessionFavorites, setSessionFavorites] = useState<Set<string>>(
    new Set(filterDefinitions.filter(f => f.isFavorite).map(f => f.id))
  );
  const [dismissedTip, setDismissedTip] = useState(false);
  const [highlightedColumnId, setHighlightedColumnId] = useState<string | null>(null);
  
  // Handle column filters change from table (e.g., column header)
  const handleColumnFiltersChange = useCallback((updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
    const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
    // Remove scope filters from the incoming filters to get only user filters
    const scopeFilterIds = new Set(scopeFilters.map((f: any) => f.id));
    const userOnlyFilters = newFilters.filter((f: any) => !scopeFilterIds.has(f.id));
    onFiltersChange(userOnlyFilters);
  }, [columnFilters, scopeFilters, onFiltersChange]);
  
  // Handle sorting change from table
  const handleSortingChange = useCallback((updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    onSortingChange(newSorting);
  }, [sorting, onSortingChange]);
  
  // Create table instance
  const table = useReactTable({
    data: mockData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnSizing,
    },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: true,
    columnResizeMode,
    enableColumnResizing: true,
    defaultColumn: {
      minSize: 50,
      maxSize: 300,
      size: 150,
    },
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
  });

  // Convert table state to draft state
  const draftSorting = useMemo(() => tableStateToDraftSorting(sorting), [sorting]);
  const draftFilters = useMemo(() => tableStateToDraftFilters(filters), [filters]);

  const sortableColumns = useMemo(() => getSortableColumns(columns), []);

  // Group filter definitions with favorites
  const filterDefinitionsWithFavorites = useMemo(() => {
    return filterDefinitions.map(def => ({
      ...def,
      isFavorite: sessionFavorites.has(def.id) || def.isFavorite || false,
    }));
  }, [sessionFavorites]);

  // Filter search results
  const filteredFilterDefs = useMemo(() => {
    return filterSearchResults(filterDefinitionsWithFavorites, filterSearch);
  }, [filterDefinitionsWithFavorites, filterSearch]);

  // Group filters
  const groupedFilters = useMemo(() => {
    return groupFilterDefinitions(filterDefinitionsWithFavorites);
  }, [filterDefinitionsWithFavorites]);

  // Handlers for sorting
  const handleAddSort = () => {
    const newSort: SortConfig = {
      id: `sort-${Date.now()}`,
      columnId: sortableColumns[0]?.id || '',
      direction: 'asc',
    };
    const newDraftSorting = [...draftSorting, newSort];
    const newSorting = draftSortingToTableState(newDraftSorting);
    onSortingChange(newSorting);
  };

  const handleUpdateSort = (sortId: string, updates: Partial<SortConfig>) => {
    const newDraftSorting = draftSorting.map(s => 
      s.id === sortId ? { ...s, ...updates } : s
    );
    const newSorting = draftSortingToTableState(newDraftSorting);
    onSortingChange(newSorting);
  };

  const handleRemoveSort = (sortId: string) => {
    const newDraftSorting = draftSorting.filter(s => s.id !== sortId);
    const newSorting = draftSortingToTableState(newDraftSorting);
    onSortingChange(newSorting);
  };

  const handleReorderSort = (fromIndex: number, toIndex: number) => {
    const newDraftSorting = [...draftSorting];
    const [removed] = newDraftSorting.splice(fromIndex, 1);
    newDraftSorting.splice(toIndex, 0, removed);
    const newSorting = draftSortingToTableState(newDraftSorting);
    onSortingChange(newSorting);
  };

  // Handlers for filters
  const handleAddFilterClick = () => {
    setShowAddFilterView(true);
  };

  const handleSelectFilter = (filterDef: FilterDefinition) => {
    const columnId = getColumnIdFromFilterId(filterDef.id);
    if (columnId) {
      // Find column to get label and options
      const column = columns.find((c: any) => c.id === columnId || c.accessorKey === columnId);
      const columnLabel = column?.header?.toString() || filterDef.label;
      
      // Get options from filter definition or mock data
      const options = filterDef.options || [];
      
      // Check if filter already exists
      const existingFilter = draftFilters.find(f => f.filterId === filterDef.id);
      
      setFilterModalColumnId(columnId);
      setFilterModalColumnLabel(columnLabel);
      setFilterModalOptions(options);
      setFilterModalSelectedValues(existingFilter?.values || []);
      setFilterModalCondition('is');
      setShowAddFilterView(false);
      setFilterModalOpen(true);
    }
  };

  const handleUpdateFilterValues = (filterId: string, values: (string | number)[]) => {
    const newDraftFilters = draftFilters.map(f =>
      f.id === filterId ? { ...f, values } : f
    );
    const newFilters = draftFiltersToTableState(newDraftFilters);
    onFiltersChange(newFilters);
  };

  const handleRemoveFilter = (filterId: string) => {
    const newDraftFilters = draftFilters.filter(f => f.id !== filterId);
    const newFilters = draftFiltersToTableState(newDraftFilters);
    onFiltersChange(newFilters);
  };

  const handleOpenFilterModal = (columnId: string) => {
    const filterDef = filterDefinitionsWithFavorites.find(def => {
      const defColumnId = getColumnIdFromFilterId(def.id);
      return defColumnId === columnId;
    });
    
    if (filterDef) {
      const column = columns.find((c: any) => c.id === columnId || c.accessorKey === columnId);
      const columnLabel = column?.header?.toString() || filterDef.label;
      const options = filterDef.options || [];
      const existingFilter = draftFilters.find(f => {
        const fColumnId = getColumnIdFromFilterId(f.filterId);
        return fColumnId === columnId;
      });
      
      setFilterModalColumnId(columnId);
      setFilterModalColumnLabel(columnLabel);
      setFilterModalOptions(options);
      setFilterModalSelectedValues(existingFilter?.values || []);
      setFilterModalCondition('is');
      setFilterModalOpen(true);
    } else {
      // If no filter definition found, still open modal with basic info
      const column = columns.find((c: any) => c.id === columnId || c.accessorKey === columnId);
      const columnLabel = column?.header?.toString() || columnId;
      
      setFilterModalColumnId(columnId);
      setFilterModalColumnLabel(columnLabel);
      setFilterModalOptions([]);
      setFilterModalSelectedValues([]);
      setFilterModalCondition('is');
      setFilterModalOpen(true);
    }
  };

  const handleFilterModalApply = (values: (string | number)[], condition: string) => {
    if (!filterModalColumnId) return;
    
    const filterDef = filterDefinitionsWithFavorites.find(def => {
      const defColumnId = getColumnIdFromFilterId(def.id);
      return defColumnId === filterModalColumnId;
    });
    
    if (filterDef && values.length > 0) {
      const existingFilter = draftFilters.find(f => {
        const fColumnId = getColumnIdFromFilterId(f.filterId);
        return fColumnId === filterModalColumnId;
      });
      
      let newDraftFilters: FilterConfig[];
      if (existingFilter) {
        newDraftFilters = draftFilters.map(f =>
          f.id === existingFilter.id ? { ...f, values } : f
        );
      } else {
        newDraftFilters = [...draftFilters, {
          id: `filter-${Date.now()}`,
          filterId: filterDef.id,
          values,
        }];
      }
      
      const newFilters = draftFiltersToTableState(newDraftFilters);
      onFiltersChange(newFilters);
    }
    
    setFilterModalOpen(false);
    setFilterModalColumnId(null);
  };

  return (
    <div 
      className="space-y-4 sm:space-y-6 min-w-0 max-w-full w-full overflow-x-hidden"
      style={{ maxWidth: '100%', width: '100%', overflowX: 'hidden' }}
      ref={(el) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > window.innerWidth * 0.8) {
            console.warn('Step3ConfigureRoutine width issue:', rect.width, 'parent:', el.parentElement?.getBoundingClientRect().width);
          }
        }
      }}
    >
      {/* Routine Name and Description */}
      {(onRoutineNameChange || onRoutineDescriptionChange) && (
        <div className="space-y-4 p-4 sm:p-6 rounded-lg bg-muted/30 w-full max-w-full overflow-x-hidden">
          {/* Routine Name with Pelico View Badge */}
          <div className="space-y-2">
            <Label htmlFor="routine-name" className="text-sm font-semibold">
              Routine Name <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Input
                id="routine-name"
                placeholder="e.g., Critical supplier follow-ups"
                value={routineName}
                onChange={(e) => onRoutineNameChange?.(e.target.value)}
                className="flex-1 min-w-0"
              />
            </div>
          </div>

          {/* Routine Description */}
          <div className="space-y-2">
            <Label htmlFor="routine-description" className="text-sm font-semibold">
              Description <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Textarea
              id="routine-description"
              placeholder="e.g., Use this routine during daily standups to prioritize supplier actions"
              value={routineDescription}
              onChange={(e) => onRoutineDescriptionChange?.(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Objective Dropdown */}
          {(onObjectiveChange || onCustomObjectiveChange) && (
            <div className="space-y-2">
              <Label htmlFor="routine-objective" className="text-sm font-semibold">
                Objective <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              {!showCustomObjectiveInput ? (
                <Select
                  value={selectedObjective}
                  onValueChange={(value) => {
                    if (value === '__custom__') {
                      onShowCustomObjectiveInputChange?.(true);
                      onObjectiveChange?.('');
                    } else {
                      onObjectiveChange?.(value);
                    }
                  }}
                >
                  <SelectTrigger id="routine-objective" className="w-full">
                    <SelectValue placeholder="Select objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Anticipate', 'Monitor', 'Correct', 'Prioritize', 'Report'] as Objective[]).map((obj) => (
                      <SelectItem key={obj} value={obj}>
                        {obj}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-[#2063F0] font-medium">
                      <Plus className="h-3 w-3 inline mr-1" />
                      Create new
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter custom objective"
                    value={customObjective}
                    onChange={(e) => onCustomObjectiveChange?.(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customObjective.trim()) {
                        e.preventDefault();
                        onShowCustomObjectiveInputChange?.(false);
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onShowCustomObjectiveInputChange?.(false);
                      onCustomObjectiveChange?.('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Filter View */}
      {showAddFilterView && (
        <div className="border rounded-lg overflow-hidden">
          <AddFilterView
            filterSearch={filterSearch}
            onFilterSearchChange={setFilterSearch}
            filteredFilterDefs={filteredFilterDefs}
            groupedFilters={groupedFilters}
            onSelectFilter={handleSelectFilter}
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
            onOpenFilterModal={handleOpenFilterModal}
            getColumnIdFromFilterId={getColumnIdFromFilterId}
            onBack={() => setShowAddFilterView(false)}
            onClose={() => setShowAddFilterView(false)}
            hideHeader={false}
          />
        </div>
      )}

      {/* UX Guidance Banner */}
      {!showAddFilterView && (
        <div className="flex flex-col sm:flex-row items-start gap-3 p-4 sm:p-5 rounded-lg border border-[#2063F0]/20 bg-gradient-to-br from-[#2063F0]/5 to-transparent w-full max-w-full overflow-x-hidden">
          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-[#2063F0] mt-0.5 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-foreground">Configure your routine view</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="font-medium text-[#2063F0] shrink-0">•</span>
                <span className="min-w-0">Use the <strong>Sorting & Filters</strong> sections below to add filters and sorting rules</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-medium text-[#2063F0] shrink-0">•</span>
                <span className="min-w-0">Click on column headers in the preview table to sort or filter directly</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-medium text-[#2063F0] shrink-0">•</span>
                <span className="min-w-0">The table preview updates in real-time as you configure your routine</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Preview */}
      {!showAddFilterView && (
        <div className="border rounded-lg overflow-hidden flex flex-col w-full" style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}>
          {/* Toolbar */}
          <div className="p-3 sm:p-4 bg-muted/30 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2 shrink-0 w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
              <Badge 
                variant="secondary" 
                className="text-xs shrink-0 bg-pink-500/10 text-pink-600 border-0 px-3 py-1.5 whitespace-nowrap"
              >
                {view.name}
              </Badge>
              <SortingAndFiltersPopover
                sorting={sorting}
                columnFilters={userFilters}
                onSortingChange={handleSortingChange}
                onColumnFiltersChange={handleColumnFiltersChange}
                columns={columns}
                filterDefinitions={filterDefinitions}
                onOpenFilterModal={handleOpenFilterModal}
                scopeFilters={[]}
              />
            </div>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end sm:justify-start min-w-0">
              <ColumnsPopover 
                table={table} 
                columns={columns}
                highlightedColumnId={highlightedColumnId}
                onHighlightChange={setHighlightedColumnId}
              />
            </div>
          </div>

          {/* Table container */}
          <div className="overflow-x-auto overflow-y-auto max-h-[400px] flex-1 min-h-0 w-full" style={{ maxWidth: '100%', width: '100%' }}>
            <table
              className="divide-y divide-border/60 w-full"
              style={{ 
                width: '100%',
                maxWidth: '100%',
                tableLayout: 'auto',
                borderCollapse: 'separate',
                borderSpacing: 0,
              }}
            >
                {/* Header */}
                <thead className="bg-muted/40 sticky top-0 z-10 shadow-sm border-b border-border/60">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef.meta as { headerTint?: 'green' | 'purple' } | undefined;
                        const headerTint = meta?.headerTint;
                        const bgColor = headerTint === 'green' 
                          ? 'bg-green-50 dark:bg-green-950/20' 
                          : headerTint === 'purple'
                          ? 'bg-purple-50 dark:bg-purple-950/20'
                          : 'bg-muted/40';
                        
                        const colSpan = header.colSpan || 1;
                        const isGroupHeader = header.subHeaders && header.subHeaders.length > 0;

                        return (
                          <th
                            key={header.id}
                            colSpan={colSpan}
                            className={cn(
                              'px-4 text-left text-sm font-medium text-muted-foreground border-r border-border/40 group',
                              !header.column.getIsResizing() && 'transition-colors',
                              isGroupHeader ? 'py-1.5' : 'py-3.5',
                              bgColor,
                              'break-words',
                              'overflow-wrap-anywhere',
                              header.column.getCanSort() && !isGroupHeader && 'hover:bg-[#31C7AD]/10 cursor-pointer',
                              header.column.getCanResize() && !isGroupHeader && 'hover:border-r-[#31C7AD]/40'
                            )}
                            style={{
                              width: 'auto',
                              minWidth: `${Math.min(header.column.columnDef.minSize || 50, 150)}px`,
                              maxWidth: `${Math.min(header.column.columnDef.maxSize || 300, 300)}px`,
                              position: 'relative',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              ...(header.column.getIsResizing() && {
                                transition: 'none',
                              }),
                            }}
                          >
                            {header.isPlaceholder ? null : isGroupHeader ? (
                              <div className="flex items-center gap-2 text-[10px] uppercase">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </div>
                            ) : (
                              <ColumnHeader
                                header={header}
                                columnId={header.column.id}
                                sorting={sorting}
                                columnFilters={columnFilters}
                                userFilters={userFilters}
                                scopeFilters={scopeFilters}
                                routineFilters={[]} // No routine selected during creation
                                onSortingChange={handleSortingChange}
                                onColumnFiltersChange={handleColumnFiltersChange}
                                onFilterClick={(columnId) => {
                                  setFilterModalColumnId(columnId);
                                  setFilterModalOpen(true);
                                }}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </ColumnHeader>
                            )}
                            {header.column.getCanResize() && !isGroupHeader && (
                              <div
                                data-resize-handle
                                onMouseDown={(e) => {
                                  const columnId = header.column.id;
                                  const currentSize = header.column.getSize();
                                  const minSize = header.column.columnDef.minSize || 50;
                                  const maxSize = header.column.columnDef.maxSize || 800;
                                  
                                  const initialSizesSnapshot: ColumnSizingState = { ...columnSizing };
                                  
                                  table.getAllColumns().forEach((col) => {
                                    if (col.getCanResize() && col.id !== columnId) {
                                      if (!(col.id in initialSizesSnapshot)) {
                                        initialSizesSnapshot[col.id] = col.getSize();
                                      }
                                    }
                                  });
                                  
                                  e.stopPropagation();
                                  e.preventDefault();
                                  
                                  const startX = e.clientX;
                                  const startSize = currentSize;
                                  
                                  const handleMouseMove = (moveEvent: MouseEvent) => {
                                    const deltaX = moveEvent.clientX - startX;
                                    const newSize = Math.max(minSize, Math.min(maxSize, startSize + deltaX));
                                    
                                    setColumnSizing((prev) => {
                                      const updated: ColumnSizingState = {};
                                      
                                      Object.keys(initialSizesSnapshot).forEach((colId) => {
                                        if (colId !== columnId) {
                                          updated[colId] = initialSizesSnapshot[colId];
                                        }
                                      });
                                      
                                      Object.keys(prev).forEach((colId) => {
                                        if (colId !== columnId && !(colId in updated)) {
                                          updated[colId] = prev[colId];
                                        }
                                      });
                                      
                                      updated[columnId] = newSize;
                                      
                                      return updated;
                                    });
                                  };
                                  
                                  const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                  };
                                  
                                  document.addEventListener('mousemove', handleMouseMove);
                                  document.addEventListener('mouseup', handleMouseUp);
                                }}
                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#31C7AD]/40 transition-colors"
                                style={{
                                  touchAction: 'none',
                                }}
                              />
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                {/* Body */}
                <tbody className="bg-background divide-y divide-border/60">
                  {table.getRowModel().rows.slice(0, 10).map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-foreground border-r border-border/40"
                          style={{
                            width: 'auto',
                            minWidth: `${Math.min(cell.column.columnDef.minSize || 50, 150)}px`,
                            maxWidth: `${Math.min(cell.column.columnDef.maxSize || 300, 300)}px`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            {table.getRowModel().rows.length > 10 && (
              <div className="p-4 text-center text-xs text-muted-foreground border-t">
                Showing first 10 of {table.getRowModel().rows.length} rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optional Settings */}
      {!showAddFilterView && (
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> You can always edit filters, sorting, and other settings after creating the routine. 
            Multiple routines can exist per view, so you can create different configurations for different needs.
          </p>
        </div>
      )}

      {/* Filter Modal */}
      {filterModalOpen && filterModalColumnId && (
        <Suspense fallback={<div>Loading filter modal...</div>}>
          <ColumnFilterModal
            open={filterModalOpen}
            onOpenChange={setFilterModalOpen}
            columnId={filterModalColumnId}
            columnLabel={filterModalColumnLabel}
            options={filterModalOptions}
            selectedValues={filterModalSelectedValues}
            condition={filterModalCondition}
            onApply={handleFilterModalApply}
          />
        </Suspense>
      )}
    </div>
  );
};

