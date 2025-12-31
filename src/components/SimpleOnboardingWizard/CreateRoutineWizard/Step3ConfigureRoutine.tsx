/**
 * Step 3: Configure the Routine
 * Let users apply filters, sorting, and view-specific settings
 */

import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Filter, ArrowUpDown, Info } from 'lucide-react';
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
import { SortingSection } from '@/components/sorting-filters/SortingSection';
import { FiltersSection } from '@/components/sorting-filters/FiltersSection';
import { tableStateToDraftSorting, tableStateToDraftFilters, draftSortingToTableState, draftFiltersToTableState } from '@/components/sorting-filters/stateAdapters';
import { getSortableColumns, getColumnIdFromFilterId, groupFilterDefinitions, filterSearchResults } from '@/components/sorting-filters/utils';
import type { SortConfig, FilterConfig, FilterDefinition } from '@/components/SortingAndFiltersPopover';
import { AddFilterView } from '@/components/SortingAndFiltersPopover';
import { useScope } from '@/contexts/ScopeContext';
import { ColumnHeader } from '@/components/ColumnHeader';
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
}

export const Step3ConfigureRoutine: React.FC<Step3ConfigureRoutineProps> = ({
  view,
  filters,
  sorting,
  onFiltersChange,
  onSortingChange,
  onNext,
  onBack,
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
      maxSize: 800,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Configure Your Routine</h3>
        <p className="text-sm text-muted-foreground">
          Set up filters to define your scope and sorting to prioritize what matters most.
        </p>
      </div>

      {/* Explanation */}
      <div className="p-4 rounded-lg border border-[#2063F0]/20 bg-gradient-to-br from-[#2063F0]/5 to-transparent">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-[#2063F0] mt-0.5 shrink-0" />
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium mb-1">Filters define scope</p>
              <p className="text-xs text-muted-foreground">
                Filters narrow down the data you see. For example, show only orders from specific suppliers or parts with certain statuses.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Sorting defines priority</p>
              <p className="text-xs text-muted-foreground">
                Sorting determines the order of your data. The most important items appear first based on your sorting criteria.
              </p>
            </div>
          </div>
        </div>
      </div>

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

      {/* Table Preview */}
      {!showAddFilterView && (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 bg-muted/30 border-b">
            <h4 className="text-sm font-semibold">Preview</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Configure filters and sorting below, or interact directly with the table columns.
            </p>
          </div>
          <div className="overflow-auto max-h-[400px]">
            <div className="inline-block min-w-full align-middle">
              <table
                className="min-w-full divide-y divide-border/60"
                style={{ 
                  width: table.getCenterTotalSize() || '100%',
                  tableLayout: 'fixed',
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
                              width: `${header.getSize()}px`,
                              minWidth: `${header.column.columnDef.minSize || 50}px`,
                              maxWidth: header.column.columnDef.maxSize ? `${header.column.columnDef.maxSize}px` : undefined,
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
                            width: `${cell.column.getSize()}px`,
                            minWidth: `${cell.column.columnDef.minSize || 50}px`,
                            maxWidth: cell.column.columnDef.maxSize ? `${cell.column.columnDef.maxSize}px` : undefined,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {table.getRowModel().rows.length > 10 && (
              <div className="p-4 text-center text-xs text-muted-foreground border-t">
                Showing first 10 of {table.getRowModel().rows.length} rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Sections */}
      {!showAddFilterView && (
        <div className="border rounded-lg overflow-hidden">
          <Accordion type="multiple" defaultValue={['sorting', 'filters']} className="w-full">
            {/* Sorting Section - Uses its own AccordionItem */}
            <SortingSection
              draftSorting={draftSorting}
              sortableColumns={sortableColumns}
              dismissedTip={dismissedTip}
              onDismissTip={() => setDismissedTip(true)}
              onAddSort={handleAddSort}
              onUpdateSort={handleUpdateSort}
              onRemoveSort={handleRemoveSort}
              onReorderSort={handleReorderSort}
            />

            {/* Filters Section - Uses its own AccordionItem */}
            <FiltersSection
              draftFilters={draftFilters}
              filterDefinitions={filterDefinitionsWithFavorites}
              columns={columns}
              onAddFilter={handleAddFilterClick}
              onUpdateFilterValues={handleUpdateFilterValues}
              onRemoveFilter={handleRemoveFilter}
              onOpenFilterModal={handleOpenFilterModal}
            />
          </Accordion>
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

