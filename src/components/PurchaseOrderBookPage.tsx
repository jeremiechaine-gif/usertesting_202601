import React, { useMemo, useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnFiltersState,
  type SortingState,
  type ColumnResizeMode,
  type ColumnSizingState,
} from '@tanstack/react-table';
import { mockData } from '../lib/mockData';
import { columns } from '../lib/columns';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ColumnHeader } from './ColumnHeader';
// Lazy load heavy modals to reduce initial bundle size
const SortingAndFiltersPopover = lazy(() => import('./SortingAndFiltersPopover').then(m => ({ default: m.SortingAndFiltersPopover })));
const ColumnFilterModal = lazy(() => import('./ColumnFilterModal').then(m => ({ default: m.ColumnFilterModal })));
import { filterDefinitions } from '@/lib/filterDefinitions';
import { ScopeDropdown } from './ScopeDropdown';
import { PlanDropdown } from './PlanDropdown';
import { RoutineDropdown } from './RoutineDropdown';
import { GroupByDropdown } from './GroupByDropdown';
import { useScope } from '@/contexts/ScopeContext';
import { getRoutine, updateRoutine, getPelicoViewDisplayName } from '@/lib/routines';
import { RoutineModal } from './RoutineModal';
import { cn } from '@/lib/utils';
import { getColumnIdFromFilterId } from './sorting-filters/utils';
import { Search, Bell, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Menu } from 'lucide-react';
import { ColumnsPopover } from './ColumnsPopover';

export const PurchaseOrderBookPage: React.FC<{ onNavigate?: (page: string) => void; onLogout?: () => void }> = ({ onNavigate, onLogout }) => {
  // Use ScopeContext for global scope management
  const { currentScopeId, setCurrentScopeId, getScopeFilters, currentScope } = useScope();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  // Column sizing state for resizing
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  // Separate scope filters (applied to table but not shown in modal) from user/routine filters
  const [scopeFilters, setScopeFilters] = useState<ColumnFiltersState>([]);
  const [userFilters, setUserFilters] = useState<ColumnFiltersState>([]);
  const [routineFilters, setRoutineFilters] = useState<ColumnFiltersState>([]); // Filters from the currently selected routine
  // Combined filters for table (scope + user)
  const columnFilters = useMemo(() => {
    // Combine scope filters and user filters
    // User filters override scope filters for the same column
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
  const [globalFilter, setGlobalFilter] = useState('');
  // Debounce global filter to avoid excessive table filtering on every keystroke
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  const [selectedPlan, setSelectedPlan] = useState<'erp' | 'prod' | null>('erp');
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterModalColumnId, setFilterModalColumnId] = useState<string | null>(null);
  
  // Memoized handler for opening filter modal
  const handleOpenFilterModal = useCallback((columnId: string) => {
    setFilterModalColumnId(columnId);
    setFilterModalOpen(true);
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedGroupBy, setSelectedGroupBy] = useState<string | null>(null);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [routineModalMode, setRoutineModalMode] = useState<'create' | 'update'>('create');
  const [highlightedColumnId, setHighlightedColumnId] = useState<string | null>(null);
  
  // Track if scope is overridden by routine (for future UI indicator)
  const [_scopeOverridden, setScopeOverridden] = useState(false);

  const data = useMemo(() => mockData, []);
  
  // Detect unsaved changes: compare current view state with active routine
  // Also detect if there are any sorts or filters when no routine is selected
  const hasUnsavedChanges = useMemo(() => {
    // If no routine selected, check if there are any sorts or filters
    if (!selectedRoutineId) {
      return sorting.length > 0 || userFilters.length > 0;
    }
    
    const routine = getRoutine(selectedRoutineId);
    if (!routine) return false;
    
    // Compare sorting
    const sortingMatches = JSON.stringify(sorting) === JSON.stringify(routine.sorting);
    
    // Compare filters (need to normalize for comparison)
    // Only compare user filters, not scope filters
    const normalizeFilters = (filters: ColumnFiltersState) => {
      return filters.map(f => ({
        id: f.id,
        value: typeof f.value === 'object' && f.value !== null 
          ? JSON.stringify(f.value) 
          : f.value
      })).sort((a, b) => a.id.localeCompare(b.id));
    };
    const currentUserFiltersNormalized = normalizeFilters(userFilters);
    const routineFiltersNormalized = normalizeFilters(routine.filters);
    const filtersMatch = JSON.stringify(currentUserFiltersNormalized) === JSON.stringify(routineFiltersNormalized);
    
    // Compare groupBy
    const groupByMatches = selectedGroupBy === routine.groupBy;
    
    return !sortingMatches || !filtersMatch || !groupByMatches;
  }, [selectedRoutineId, sorting, userFilters, selectedGroupBy]);
  
  // Handler to save as new routine (memoized)
  const handleSaveAsRoutine = useCallback(() => {
    setRoutineModalMode('create');
    setRoutineModalOpen(true);
  }, []);
  

  // Apply scope filters (always applied to table but not shown in modal)
  useEffect(() => {
    const scopeFiltersFromContext = getScopeFilters();
    setScopeFilters(scopeFiltersFromContext);
  }, [currentScopeId, getScopeFilters]);

  // Check for pending routine from navigation (e.g., from "View" button)
  useEffect(() => {
    const pendingRoutineId = sessionStorage.getItem('pendingRoutineId');
    if (pendingRoutineId && !selectedRoutineId) {
      sessionStorage.removeItem('pendingRoutineId');
      setSelectedRoutineId(pendingRoutineId);
    }
  }, [selectedRoutineId]);

  // Apply routine configuration when routine changes
  useEffect(() => {
    if (selectedRoutineId) {
      const routine = getRoutine(selectedRoutineId);
      if (routine) {
        // Apply routine configuration
        setSorting(routine.sorting);
        setSelectedGroupBy(routine.groupBy || null);
        
        // Normalize filter column IDs from routine (convert 'part-name' to 'partName', etc.)
        const normalizedFilters = routine.filters.map((filter: any) => {
          // If filter.id looks like a filter definition ID (contains '-'), convert it
          if (filter.id && filter.id.includes('-')) {
            const columnId = getColumnIdFromFilterId(filter.id);
            if (columnId) {
              return { ...filter, id: columnId };
            }
          }
          return filter;
        });
        
        // Set user filters from routine (scope filters are separate and already applied)
        setUserFilters(normalizedFilters);
        // Store routine filters for comparison (to show blue indicator for routine filters)
        setRoutineFilters(normalizedFilters);
        setScopeOverridden(false);
      }
    } else {
      // No routine selected, clear user filters
      setUserFilters([]);
      setRoutineFilters([]);
      setScopeOverridden(false);
    }
  }, [selectedRoutineId]);

  // Scope filters are already handled in the first useEffect above
  // User filters are handled in the routine useEffect above

  // Handler for column filters change from table
  const handleColumnFiltersChange = useCallback((updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
    const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
    // When filters change from table (e.g., column header), update user filters
    // Remove scope filters from the incoming filters to get only user filters
    const scopeFilterIds = new Set(scopeFilters.map((f: any) => f.id));
    const userOnlyFilters = newFilters.filter((f: any) => !scopeFilterIds.has(f.id));
    setUserFilters(userOnlyFilters);
  }, [columnFilters, scopeFilters]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter,
      columnSizing, // Add column sizing state
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: setGlobalFilter,
    onColumnSizingChange: setColumnSizing, // Add column sizing handler
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
      size: 150, // Default size for columns without explicit size
    },
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
  });


  // Handler to update current routine (memoized, defined after table)
  const handleUpdateRoutine = useCallback(() => {
    if (!selectedRoutineId) return;
    const routine = getRoutine(selectedRoutineId);
    if (!routine) return;
    
    // Update routine with current view state (only user filters, not scope filters)
    updateRoutine(selectedRoutineId, {
      filters: userFilters,
      sorting,
      groupBy: selectedGroupBy,
      pageSize: table.getState().pagination.pageSize,
    });
    
    // Force re-render by updating routine selection
    setSelectedRoutineId(null);
    setTimeout(() => setSelectedRoutineId(selectedRoutineId), 0);
  }, [selectedRoutineId, userFilters, sorting, selectedGroupBy, table]);

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {!sidebarCollapsed && (
        <Sidebar 
          activeItem="supply" 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(true)}
          onNavigate={onNavigate}
          activeRoutineId={selectedRoutineId}
          onLogout={onLogout}
          onRoutineClick={(routineId) => {
            // Apply routine to table
            setSelectedRoutineId(routineId);
            const routine = getRoutine(routineId);
            if (routine) {
              setSorting(routine.sorting);
              // Convert routine filters to user filters (excluding scope filters)
              setUserFilters(routine.filters);
              if (routine.groupBy) {
                setSelectedGroupBy(routine.groupBy);
              }
            }
            // Navigate to supply page if not already there
            if (onNavigate) {
              onNavigate('supply');
            }
          }}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Main Header with Gradient */}
        <div className="relative border-b bg-background shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/5 via-[#2063F0]/5 to-transparent pointer-events-none" />
          <div className="relative px-6 py-3">
            {/* Top Header Row */}
            <div className="flex items-center justify-between mb-3">
              {/* Left Side */}
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
                <PlanDropdown
                  selectedPlan={selectedPlan}
                  onPlanSelect={setSelectedPlan}
                />
                <ScopeDropdown
                  selectedScopeId={currentScopeId}
                  onScopeSelect={setCurrentScopeId}
                  onScopeFiltersChange={() => {}} // Handled by context
                />
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-[#31C7AD]/10 transition-colors">
                  <Bell className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Page Title */}
            <div className="mb-3">
              {selectedRoutineId ? (() => {
                const routine = getRoutine(selectedRoutineId);
                return routine ? (
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {routine.name}
                    </h1>
                    <Badge
                      variant="outline"
                      className="text-xs h-6 px-2.5 rounded-full bg-pink-500/10 text-pink-600 border-pink-500/30 font-medium shrink-0"
                    >
                      {getPelicoViewDisplayName(routine.pelicoView)}
                    </Badge>
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Purchase Order Book</h1>
                );
              })() : (
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Purchase Order Book</h1>
              )}
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div className="px-6 py-4 bg-gradient-to-b from-muted/30 to-muted/50 border-b shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RoutineDropdown
              selectedRoutineId={selectedRoutineId}
              onRoutineSelect={setSelectedRoutineId}
              currentFilters={userFilters}
              currentSorting={sorting}
              currentGroupBy={selectedGroupBy}
              currentPageSize={table.getState().pagination.pageSize}
              hasUnsavedChanges={hasUnsavedChanges}
              onUpdateRoutine={handleUpdateRoutine}
              onSaveAsRoutine={handleSaveAsRoutine}
            />
            <SortingAndFiltersPopover
              sorting={sorting}
              columnFilters={userFilters}
              onSortingChange={setSorting}
              onColumnFiltersChange={setUserFilters}
              columns={columns}
              filterDefinitions={filterDefinitions}
              selectedRoutineId={selectedRoutineId}
              onSaveAsRoutine={handleSaveAsRoutine}
              onUpdateRoutine={handleUpdateRoutine}
              onOpenFilterModal={handleOpenFilterModal}
              scopeFilters={currentScope && currentScope.filters ? currentScope.filters.filter((f) => f.values && f.values.length > 0) : []}
              currentScopeName={currentScope?.name}
              routineFilters={routineFilters}
            />
          </div>
          <div className="flex items-center gap-2">
            <GroupByDropdown
              selectedGroupBy={selectedGroupBy}
              onGroupBySelect={setSelectedGroupBy}
            />
            <ColumnsPopover 
              table={table} 
              columns={columns}
              highlightedColumnId={highlightedColumnId}
              onHighlightChange={setHighlightedColumnId}
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 pb-4">
          <div className="inline-block min-w-full align-middle">
            <table
              className="min-w-full divide-y divide-border/60"
              style={{ 
                width: table.getCenterTotalSize() || '100%',
                tableLayout: 'fixed', // Required for column resizing to work
                borderCollapse: 'separate', // Changed from border-collapse to separate for resizing
                borderSpacing: 0, // Maintain visual appearance
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
                          data-column-id={!isGroupHeader ? header.column.id : undefined}
                          className={cn(
                            'px-4 text-left text-sm font-medium text-muted-foreground border-r border-border/40 group',
                            // Disable transition during resize for smooth dragging
                            !header.column.getIsResizing() && 'transition-colors',
                            isGroupHeader ? 'py-1.5' : 'py-3.5',
                            bgColor,
                            'break-words', // Allow text to wrap in headers
                            'overflow-wrap-anywhere', // Break long words if needed
                            header.column.getCanSort() && !isGroupHeader && 'hover:bg-[#31C7AD]/10 cursor-pointer',
                            header.column.getCanResize() && !isGroupHeader && 'hover:border-r-[#31C7AD]/40',
                            !isGroupHeader && highlightedColumnId === header.column.id && 'bg-[#31C7AD]/10 border-r-2 border-[#31C7AD]'
                          )}
                          style={{
                            width: `${header.getSize()}px`, // Explicit px unit
                            minWidth: `${header.column.columnDef.minSize || 50}px`,
                            maxWidth: header.column.columnDef.maxSize ? `${header.column.columnDef.maxSize}px` : undefined,
                            position: 'relative',
                            wordWrap: 'break-word', // Allow wrapping
                            overflowWrap: 'break-word', // Modern property
                            // Force width update on resize - disable transition during resize
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
                              routineFilters={routineFilters}
                              onSortingChange={setSorting}
                              onColumnFiltersChange={(filters) => {
                                // When filters change from column header, update user filters
                                // Remove scope filters from the incoming filters to get only user filters
                                const scopeFilterIds = new Set(scopeFilters.map((f: any) => f.id));
                                const userOnlyFilters = filters.filter((f: any) => !scopeFilterIds.has(f.id));
                                setUserFilters(userOnlyFilters);
                              }}
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
                                
                                // Store initial sizes of ALL columns (including defaults) to prevent them from changing
                                const initialSizesSnapshot: ColumnSizingState = { ...columnSizing };
                                
                                // Capture current size of all resizable columns (even if not in columnSizing state)
                                table.getAllColumns().forEach((col) => {
                                  if (col.getCanResize() && col.id !== columnId) {
                                    // Use current size from column, or preserve existing state value
                                    if (!(col.id in initialSizesSnapshot)) {
                                      initialSizesSnapshot[col.id] = col.getSize();
                                    }
                                  }
                                });
                                
                                e.stopPropagation();
                                e.preventDefault();
                                
                                // Custom resize handler that only resizes the target column
                                const startX = e.clientX;
                                const startSize = currentSize;
                                
                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  const deltaX = moveEvent.clientX - startX;
                                  const newSize = Math.max(minSize, Math.min(maxSize, startSize + deltaX));
                                  
                                  // Update only this column's size, preserve all others from snapshot
                                  setColumnSizing((prev) => {
                                    const updated: ColumnSizingState = {};
                                    
                                    // Preserve all other columns' sizes from snapshot
                                    Object.keys(initialSizesSnapshot).forEach((colId) => {
                                      if (colId !== columnId) {
                                        updated[colId] = initialSizesSnapshot[colId];
                                      }
                                    });
                                    
                                    // Also preserve any columns that were added to state after snapshot
                                    // (shouldn't happen during resize, but safety check)
                                    Object.keys(prev).forEach((colId) => {
                                      if (colId !== columnId && !(colId in updated)) {
                                        updated[colId] = prev[colId];
                                      }
                                    });
                                    
                                    // Set new size ONLY for the resized column
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
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                const handler = header.getResizeHandler();
                                if (handler) {
                                  handler(e);
                                }
                              }}
                              className={cn(
                                'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none z-30',
                                'bg-transparent hover:bg-[#31C7AD]/40 transition-colors',
                                header.column.getIsResizing() && 'bg-[#31C7AD]'
                              )}
                              style={{
                                userSelect: 'none',
                                touchAction: 'none',
                                pointerEvents: 'auto',
                              }}
                              title={`Resize ${header.column.id} (${header.column.getSize()}px)`}
                            >
                              {/* Visual indicator line */}
                              <div
                                className={cn(
                                  'absolute right-0 top-0 h-full w-0.5 transition-all',
                                  header.column.getIsResizing() 
                                    ? 'bg-[#31C7AD] w-0.5' 
                                    : 'bg-transparent group-hover:bg-[#31C7AD]/30'
                                )}
                              />
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              {/* Body */}
              <tbody className="bg-background divide-y divide-border/40">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={table.getAllColumns().length} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="h-8 w-8 opacity-50" />
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs">
                          {debouncedGlobalFilter || columnFilters.length > 0
                            ? 'Try adjusting your filters or search terms'
                            : 'No data available'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-all duration-200',
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                        'hover:bg-[#31C7AD]/5 hover:shadow-sm',
                        row.getIsSelected() && 'bg-[#2063F0]/5 hover:bg-[#2063F0]/10'
                      )}
                      style={{
                        height: 'auto', // Allow row height to adjust to content
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          data-column-id={cell.column.id}
                          className={cn(
                            'px-4 py-3 text-sm border-r border-border/40 transition-colors',
                            'break-words', // Allow text to wrap
                            'overflow-wrap-anywhere', // Break long words if needed
                            highlightedColumnId === cell.column.id && 'bg-[#31C7AD]/10 border-r-2 border-[#31C7AD]'
                          )}
                          style={{
                            width: `${cell.column.getSize()}px`, // Explicit px unit
                            minWidth: `${cell.column.columnDef.minSize || 50}px`,
                            maxWidth: cell.column.columnDef.maxSize ? `${cell.column.columnDef.maxSize}px` : undefined,
                            wordWrap: 'break-word', // Allow wrapping
                            overflowWrap: 'break-word', // Modern property
                            // Force width update on resize
                            ...(cell.column.getIsResizing() && {
                              transition: 'none', // Disable transition during resize for smooth dragging
                            }),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="h-4" /> {/* Spacer for bottom padding */}
          </div>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-gradient-to-t from-muted/30 to-background border-t shadow-inner flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent transition-colors">
              <span className="text-base">Σ</span>
              Show Page Totals
            </Button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Page Size:</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[100px] border-border/60 hover:border-[#31C7AD]/40 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40">
              <span className="text-sm font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of <span className="font-semibold text-[#2063F0]">{table.getFilteredRowModel().rows.length}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/60 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD] transition-all disabled:opacity-50"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD] transition-all disabled:opacity-50"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm font-semibold text-foreground min-w-[80px] text-center">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD] transition-all disabled:opacity-50"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD] transition-all disabled:opacity-50"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Column Filter Modal */}
      {filterModalColumnId && (
        <Suspense fallback={null}>
          <ColumnFilterModal
          open={filterModalOpen}
          onOpenChange={setFilterModalOpen}
          columnId={filterModalColumnId}
          columnLabel={(columns.find((col) => col.id === filterModalColumnId)?.header as string) || filterModalColumnId}
          category={(() => {
            // Find the column definition to get its group
            const findColumnGroup = (columnId: string): string | undefined => {
              for (const col of columns) {
                if ('columns' in col && Array.isArray(col.columns)) {
                  const found = col.columns.find((c) => c.id === columnId);
                  if (found) {
                    return typeof col.header === 'string' ? col.header : undefined;
                  }
                } else if (col.id === columnId) {
                  // Check if it's in a group by looking at surrounding columns
                  return undefined; // Ungrouped
                }
              }
              return undefined;
            };
            return findColumnGroup(filterModalColumnId);
          })()}
          columnType={(() => {
            // Detect column type from data
            if (!data.length) return 'text';
            const sampleValue = (data[0] as any)[filterModalColumnId];
            if (typeof sampleValue === 'number') return 'number';
            if (typeof sampleValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sampleValue)) return 'date';
            return 'text';
          })()}
          options={(() => {
            const values = new Set<string | number>();
            data.forEach((row) => {
              const value = (row as any)[filterModalColumnId];
              if (value !== undefined && value !== null) {
                values.add(value);
              }
            });
            return Array.from(values)
              .map((value) => ({
                label: String(value),
                value,
              }))
              .sort((a, b) => String(a.value).localeCompare(String(b.value)));
          })()}
          selectedValues={(() => {
            const filter = userFilters.find((f) => f.id === filterModalColumnId);
            if (!filter) return [];
            if (Array.isArray(filter.value)) {
              return filter.value;
            }
            if (typeof filter.value === 'object' && filter.value !== null && 'values' in filter.value) {
              return (filter.value as any).values || [];
            }
            return [filter.value].filter(Boolean);
          })()}
          condition={(() => {
            const filter = userFilters.find((f) => f.id === filterModalColumnId);
            if (!filter) return 'is';
            if (typeof filter.value === 'object' && filter.value !== null && 'condition' in filter.value) {
              return (filter.value as any).condition === 'isNot' ? 'isNot' : 'is';
            }
            return 'is';
          })()}
          onApply={(values, condition) => {
            // Prevent any potential event bubbling that might trigger header click
            const newFilters = userFilters.filter((f) => f.id !== filterModalColumnId);
            if (values.length > 0) {
              newFilters.push({
                id: filterModalColumnId,
                value: condition === 'is' ? values : { condition, values },
              });
            }
            // Use setTimeout to ensure modal closes before state update
            // This prevents any click events from bubbling to header
            setTimeout(() => {
              setUserFilters(newFilters);
            }, 0);
          }}
        />
        </Suspense>
      )}
      
      {/* Routine Modal */}
      {routineModalOpen && (
        <RoutineModal
          open={routineModalOpen}
          onOpenChange={setRoutineModalOpen}
          routine={routineModalMode === 'update' && selectedRoutineId ? getRoutine(selectedRoutineId) : null}
          onSave={() => {
            setRoutineModalOpen(false);
            // Refresh routine if updating
            if (routineModalMode === 'update' && selectedRoutineId) {
              setSelectedRoutineId(null);
              setTimeout(() => setSelectedRoutineId(selectedRoutineId), 0);
            }
          }}
          currentFilters={userFilters}
          currentSorting={sorting}
          currentGroupBy={selectedGroupBy}
          currentPageSize={table.getState().pagination.pageSize}
        />
      )}
    </div>
  );
};

