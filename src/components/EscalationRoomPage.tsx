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
import { mockData } from '../lib/escalationRoomMockData';
import { columns } from '../lib/escalationRoomColumns';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColumnHeader } from './ColumnHeader';
// Lazy load heavy modals to reduce initial bundle size
const SortingAndFiltersPopover = lazy(() => import('./SortingAndFiltersPopover').then(m => ({ default: m.SortingAndFiltersPopover })));
const ColumnFilterModal = lazy(() => import('./ColumnFilterModal').then(m => ({ default: m.ColumnFilterModal })));
import { filterDefinitions } from '@/lib/filterDefinitions';
import { ScopeDropdown } from './ScopeDropdown';
import { PlanDropdown } from './PlanDropdown';
import { GroupByDropdown } from './GroupByDropdown';
import { useScope } from '@/contexts/ScopeContext';
import { getRoutine, updateRoutine, getPelicoViewDisplayName } from '@/lib/routines';
import { RoutineModal } from './RoutineModal';
import { cn } from '@/lib/utils';
import { getColumnIdFromFilterId } from './sorting-filters/utils';
import { Search, Bell, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ColumnsPopover } from './ColumnsPopover';

export const EscalationRoomPage: React.FC<{ onNavigate?: (page: string) => void; onLogout?: () => void }> = ({ onNavigate, onLogout }) => {
  const { currentScopeId, setCurrentScopeId, getScopeFilters, currentScope } = useScope();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [scopeFilters, setScopeFilters] = useState<ColumnFiltersState>([]);
  const [userFilters, setUserFilters] = useState<ColumnFiltersState>([]);
  const [routineFilters, setRoutineFilters] = useState<ColumnFiltersState>([]); // Filters from the currently selected routine
  const columnFilters = useMemo(() => {
    const combined: ColumnFiltersState = [...scopeFilters];
    userFilters.forEach(userFilter => {
      const existingIndex = combined.findIndex(f => f.id === userFilter.id);
      if (existingIndex >= 0) {
        combined[existingIndex] = userFilter;
      } else {
        combined.push(userFilter);
      }
    });
    return combined;
  }, [scopeFilters, userFilters]);
  const [globalFilter, setGlobalFilter] = useState('');
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  const [selectedPlan, setSelectedPlan] = useState<'erp' | 'prod' | null>('erp');
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterModalColumnId, setFilterModalColumnId] = useState<string | null>(null);
  
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

  const data = useMemo(() => mockData, []);
  
  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRoutineId) {
      return sorting.length > 0 || userFilters.length > 0;
    }
    
    const routine = getRoutine(selectedRoutineId);
    if (!routine) return false;
    
    const sortingMatches = JSON.stringify(sorting) === JSON.stringify(routine.sorting);
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
    const groupByMatches = selectedGroupBy === routine.groupBy;
    
    return !sortingMatches || !filtersMatch || !groupByMatches;
  }, [selectedRoutineId, sorting, userFilters, selectedGroupBy]);
  
  const handleSaveAsRoutine = useCallback(() => {
    setRoutineModalMode('create');
    setRoutineModalOpen(true);
  }, []);

  useEffect(() => {
    const scopeFiltersFromContext = getScopeFilters();
    setScopeFilters(scopeFiltersFromContext);
  }, [currentScopeId, getScopeFilters]);

  useEffect(() => {
    const pendingRoutineId = sessionStorage.getItem('pendingRoutineId');
    if (pendingRoutineId && !selectedRoutineId) {
      sessionStorage.removeItem('pendingRoutineId');
      setSelectedRoutineId(pendingRoutineId);
    }
  }, [selectedRoutineId]);

  useEffect(() => {
    if (selectedRoutineId) {
      const routine = getRoutine(selectedRoutineId);
      if (routine) {
        setSorting(routine.sorting);
        setSelectedGroupBy(routine.groupBy || null);
        
        const normalizedFilters = routine.filters.map((filter: any) => {
          if (filter.id && filter.id.includes('-')) {
            const columnId = getColumnIdFromFilterId(filter.id);
            if (columnId) {
              return { ...filter, id: columnId };
            }
          }
          return filter;
        });
        
        setUserFilters(normalizedFilters);
        // Store routine filters for comparison (to show blue indicator for routine filters)
        setRoutineFilters(normalizedFilters);
      }
    } else {
      setUserFilters([]);
      setRoutineFilters([]);
    }
  }, [selectedRoutineId]);

  const handleColumnFiltersChange = useCallback((updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
    const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
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
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: setGlobalFilter,
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

  const handleUpdateRoutine = useCallback(() => {
    if (!selectedRoutineId) return;
    const routine = getRoutine(selectedRoutineId);
    if (!routine) return;
    
    updateRoutine(selectedRoutineId, {
      filters: userFilters,
      sorting,
      groupBy: selectedGroupBy,
      pageSize: table.getState().pagination.pageSize,
    });
    
    setSelectedRoutineId(null);
    setTimeout(() => setSelectedRoutineId(selectedRoutineId), 0);
  }, [selectedRoutineId, userFilters, sorting, selectedGroupBy, table]);

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {!sidebarCollapsed && (
        <Sidebar 
          activeItem="escalation" 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(true)}
          onNavigate={onNavigate}
          activeRoutineId={selectedRoutineId}
          onLogout={onLogout}
          onRoutineClick={(routineId) => {
            setSelectedRoutineId(routineId);
            const routine = getRoutine(routineId);
            if (routine) {
              setSorting(routine.sorting);
              setUserFilters(routine.filters);
              if (routine.groupBy) {
                setSelectedGroupBy(routine.groupBy);
              }
            }
            if (onNavigate) {
              onNavigate('escalation');
            }
          }}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="relative bg-background shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/5 via-[#2063F0]/5 to-transparent pointer-events-none" />
          <div className="relative px-6 py-5">
            <div className="flex items-center justify-between mb-5">
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
                  onScopeFiltersChange={() => {}}
                />
              </div>

              <div className="flex items-center gap-2">
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
                    <h1 className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {routine.name}
                    </h1>
                    <Badge
                      variant="secondary"
                      className="text-xs h-6 px-2.5 rounded-full bg-pink-500/10 text-pink-600 border-pink-500/30 font-medium shrink-0"
                    >
                      {getPelicoViewDisplayName(routine.pelicoView)}
                    </Badge>
                  </div>
                ) : (
                  <h1 className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Escalation Room</h1>
                );
              })() : (
                <h1 className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Escalation Room</h1>
              )}
            </div>
          </div>
        </div>

        {/* Table with wrapper structure matching Step3ConfigureRoutine */}
        <div className="flex-1 flex flex-col overflow-hidden px-6 py-4 min-h-0">
          <div className="border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
          {/* Header with controls */}
          <div className="p-4 bg-muted/30 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Suspense fallback={<div>Loading...</div>}>
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
              </Suspense>
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

          {/* Table container */}
          <div className="flex-1 overflow-auto">
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
                            !header.column.getIsResizing() && 'transition-colors',
                            isGroupHeader ? 'py-1.5' : 'py-3.5',
                            bgColor,
                            'break-words',
                            'overflow-wrap-anywhere',
                            header.column.getCanSort() && !isGroupHeader && 'hover:bg-[#31C7AD]/10 cursor-pointer',
                            header.column.getCanResize() && !isGroupHeader && 'hover:border-r-[#31C7AD]/40',
                            !isGroupHeader && highlightedColumnId === header.column.id && 'bg-[#31C7AD]/10 border-r-2 border-[#31C7AD]'
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
                              routineFilters={routineFilters}
                              onSortingChange={setSorting}
                              onColumnFiltersChange={(filters) => {
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
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

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
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          data-column-id={cell.column.id}
                          className={cn(
                            'px-4 py-3 text-sm border-r border-border/40 transition-colors',
                            'break-words',
                            'overflow-wrap-anywhere',
                            highlightedColumnId === cell.column.id && 'bg-[#31C7AD]/10 border-r-2 border-[#31C7AD]'
                          )}
                          style={{
                            width: `${cell.column.getSize()}px`,
                            minWidth: `${cell.column.columnDef.minSize || 50}px`,
                            maxWidth: cell.column.columnDef.maxSize ? `${cell.column.columnDef.maxSize}px` : undefined,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            ...(cell.column.getIsResizing() && {
                              transition: 'none',
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
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-muted/30 border-t flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2.5 gap-1.5 text-xs hover:bg-accent/50 transition-all"
              >
                <span className="text-base">Σ</span>
                <span className="font-medium">Show Page Totals</span>
              </Button>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md border border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="First page"
                  title="First page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Previous page"
                  title="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <div className="px-2.5 py-1 min-w-[45px] text-center">
                  <span className="text-xs font-semibold text-foreground">
                    {table.getState().pagination.pageIndex + 1}
                  </span>
                  <span className="text-xs text-muted-foreground mx-0.5">/</span>
                  <span className="text-xs text-muted-foreground">
                    {table.getPageCount()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Next page"
                  title="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  aria-label="Last page"
                  title="Last page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )} of {table.getFilteredRowModel().rows.length}</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {filterModalColumnId && (
        <Suspense fallback={null}>
          <ColumnFilterModal
          open={filterModalOpen}
          onOpenChange={setFilterModalOpen}
          columnId={filterModalColumnId}
          columnLabel={(columns.find((col) => col.id === filterModalColumnId)?.header as string) || filterModalColumnId}
          category={(() => {
            const findColumnGroup = (columnId: string): string | undefined => {
              for (const col of columns) {
                if ('columns' in col && Array.isArray(col.columns)) {
                  const found = col.columns.find((c) => c.id === columnId);
                  if (found) {
                    return typeof col.header === 'string' ? col.header : undefined;
                  }
                } else if (col.id === columnId) {
                  return undefined;
                }
              }
              return undefined;
            };
            return findColumnGroup(filterModalColumnId);
          })()}
          columnType={(() => {
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
            const newFilters = userFilters.filter((f) => f.id !== filterModalColumnId);
            if (values.length > 0) {
              newFilters.push({
                id: filterModalColumnId,
                value: condition === 'is' ? values : { condition, values },
              });
            }
            setTimeout(() => {
              setUserFilters(newFilters);
            }, 0);
          }}
        />
        </Suspense>
      )}
      
      {routineModalOpen && (
        <RoutineModal
          open={routineModalOpen}
          onOpenChange={setRoutineModalOpen}
          routine={routineModalMode === 'update' && selectedRoutineId ? getRoutine(selectedRoutineId) : null}
          onSave={() => {
            setRoutineModalOpen(false);
            if (routineModalMode === 'update' && selectedRoutineId) {
              setSelectedRoutineId(null);
              setTimeout(() => setSelectedRoutineId(selectedRoutineId), 0);
            }
          }}
          currentFilters={userFilters}
          currentSorting={sorting}
          currentGroupBy={selectedGroupBy}
          currentPageSize={table.getState().pagination.pageSize}
          currentPelicoView={routineModalMode === 'create' ? 'escalation' : undefined}
        />
      )}
    </div>
  );
};

