import React, { useMemo, useState, useEffect, useCallback, Suspense, lazy } from 'react';
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
} from '@tanstack/react-table';
import { mockData } from '../lib/mockData';
import { columns } from '../lib/columns';
import { Sidebar } from './Sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { getRoutine, updateRoutine } from '@/lib/routines';
import { RoutineModal } from './RoutineModal';
import { cn } from '@/lib/utils';
import { Search, Bell, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Menu, Link as LinkIcon, ChevronDown, Save } from 'lucide-react';

export const PurchaseOrderBookPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  // Use ScopeContext for global scope management
  const { currentScopeId, setCurrentScopeId, getScopeFilters } = useScope();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  // Separate scope filters (applied to table but not shown in modal) from user/routine filters
  const [scopeFilters, setScopeFilters] = useState<ColumnFiltersState>([]);
  const [userFilters, setUserFilters] = useState<ColumnFiltersState>([]);
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
  const [activeTab, setActiveTab] = useState('purchase-order-book');
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

  // Apply routine configuration when routine changes
  useEffect(() => {
    if (selectedRoutineId) {
      const routine = getRoutine(selectedRoutineId);
      if (routine) {
        // Apply routine configuration
        setSorting(routine.sorting);
        setSelectedGroupBy(routine.groupBy || null);
        
        // Set user filters from routine (scope filters are separate and already applied)
        setUserFilters(routine.filters);
        setScopeOverridden(false);
      }
    } else {
      // No routine selected, clear user filters
      setUserFilters([]);
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
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: true,
    columnResizeMode,
    enableColumnResizing: true,
    defaultColumn: {
      minSize: 50,
      maxSize: 500,
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
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Banner */}
        <div className="bg-muted px-6 py-2.5 text-sm border-b">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
            <span className="font-medium">This is a test banner. You're on a test environment.</span>
          </div>
        </div>

        {/* Main Header */}
        <div className="border-b bg-background shadow-sm">
          <div className="px-6 py-5">
            {/* Top Header Row */}
            <div className="flex items-center justify-between mb-5">
              {/* Left Side */}
              <div className="flex items-center gap-4">
                {sidebarCollapsed && (
                  <Button 
                    variant="ghost" 
                    className="h-9 px-3 gap-2 hover:bg-[#31C7AD]/10"
                    onClick={() => setSidebarCollapsed(false)}
                  >
                    <Menu className="w-4 h-4" />
                    <span className="text-sm">Menu</span>
                  </Button>
                )}
                {/* Pelico small logo */}
                <img 
                  src="/images/Pelico-small-logo.svg" 
                  alt="Pelico" 
                  className="w-6 h-6 shrink-0"
                />
                <h1 className="text-2xl font-bold tracking-tight">Supply</h1>
                <div className="h-7 w-px bg-border/60" />
                <PlanDropdown
                  selectedPlan={selectedPlan}
                  onPlanSelect={setSelectedPlan}
                />
                <ScopeDropdown
                  selectedScopeId={currentScopeId}
                  onScopeSelect={setCurrentScopeId}
                  onScopeFiltersChange={() => {}} // Handled by context
                />
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
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-2">

                {/* Save/Download Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3 hover:bg-muted/80 transition-colors">
                      <Save className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Save</DropdownMenuItem>
                    <DropdownMenuItem>Download</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Link Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3 hover:bg-muted/80 transition-colors">
                      <LinkIcon className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Copy Link</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-border/60" />

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted/80 transition-colors">
                  <Bell className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto p-0 bg-transparent border-b border-border/50">
                <TabsTrigger 
                  value="purchase-order-book" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-[#2063F0] data-[state=active]:border-b-2 data-[state=active]:border-[#2063F0] data-[state=active]:shadow-sm hover:bg-muted/30 transition-all rounded-none px-5 py-2.5 text-sm font-medium"
                >
                  Purchase Order Book
                </TabsTrigger>
                <TabsTrigger 
                  value="line-of-balance" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-[#2063F0] data-[state=active]:border-b-2 data-[state=active]:border-[#2063F0] data-[state=active]:shadow-sm hover:bg-muted/30 transition-all rounded-none px-5 py-2.5 text-sm font-medium"
                >
                  Line of Balance
                </TabsTrigger>
                <TabsTrigger 
                  value="planning" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-[#2063F0] data-[state=active]:border-b-2 data-[state=active]:border-[#2063F0] data-[state=active]:shadow-sm hover:bg-muted/30 transition-all rounded-none px-5 py-2.5 text-sm font-medium"
                >
                  Planning
                  <Badge variant="secondary" className="ml-2 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">Beta</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="opportunities" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-[#2063F0] data-[state=active]:border-b-2 data-[state=active]:border-[#2063F0] data-[state=active]:shadow-sm hover:bg-muted/30 transition-all rounded-none px-5 py-2.5 text-sm font-medium"
                >
                  Opportunities
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Table Controls */}
        <div className="px-6 py-4 bg-gradient-to-b from-muted/30 to-muted/50 border-b shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 h-9 px-3 py-2 hover:bg-accent hover:border-[#31C7AD]/30 transition-all"
              onClick={() => {
                // TODO: Open search functionality
                setGlobalFilter('');
              }}
            >
              <Search className="w-4 h-4" />
            </Button>
            <GroupByDropdown
              selectedGroupBy={selectedGroupBy}
              onGroupBySelect={setSelectedGroupBy}
            />
            <Button variant="outline" size="sm" className="gap-2 h-9 px-3 py-2 hover:bg-accent hover:border-[#31C7AD]/30 transition-all">Columns</Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 pb-4">
          <div className="inline-block min-w-full align-middle">
            <table
              className="min-w-full divide-y divide-border/60 border-collapse"
              style={{ width: table.getCenterTotalSize() || '100%' }}
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
                            'px-4 text-left text-sm font-medium text-muted-foreground border-r border-border/40 transition-colors',
                            isGroupHeader ? 'py-1.5' : 'py-3.5',
                            bgColor,
                            header.column.getCanSort() && !isGroupHeader && 'hover:bg-[#31C7AD]/10 cursor-pointer'
                          )}
                          style={{
                            width: header.getSize(),
                            position: 'relative',
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
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={cn(
                                'absolute right-0 top-0 h-full w-0.5 bg-transparent hover:bg-primary cursor-col-resize transition-colors',
                                header.column.getIsResizing() && 'bg-primary'
                              )}
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              {/* Body */}
              <tbody className="bg-background divide-y divide-border/40">
                {table.getRowModel().rows.map((row, index) => (
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
                        className="px-4 py-3 text-sm border-r border-border/40"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
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

