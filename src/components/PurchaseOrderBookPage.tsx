import React, { useMemo, useState } from 'react';
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
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SortingAndFiltersPopover } from './SortingAndFiltersPopover';
import { ColumnHeader } from './ColumnHeader';
import { ColumnFilterModal } from './ColumnFilterModal';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { ScopeDropdown } from './ScopeDropdown';
import { cn } from '@/lib/utils';
import { Search, Bell, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Menu, Link as LinkIcon, ChevronDown, Save } from 'lucide-react';

export const PurchaseOrderBookPage: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeTab, setActiveTab] = useState('purchase-order-book');
  const [planMode, setPlanMode] = useState<'erp' | 'prod'>('erp');
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterModalColumnId, setFilterModalColumnId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);

  const data = useMemo(() => mockData, []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
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


  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {!sidebarCollapsed && (
        <Sidebar 
          activeItem="supply" 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(true)}
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
        <div className="border-b bg-background">
          <div className="px-6 py-4">
            {/* Top Header Row */}
            <div className="flex items-center justify-between mb-4">
              {/* Left Side */}
              <div className="flex items-center gap-4">
                {sidebarCollapsed && (
                  <Button 
                    variant="ghost" 
                    className="h-8 px-3 gap-2"
                    onClick={() => setSidebarCollapsed(false)}
                  >
                    <Menu className="w-4 h-4" />
                    <span className="text-sm">Menu</span>
                  </Button>
                )}
                {/* Logo placeholder - teal bird-like icon */}
                <div className="w-6 h-6 rounded bg-[#31C7AD] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Supply</h1>
                <div className="h-6 w-px bg-border" />
                <ScopeDropdown
                  selectedScopeId={selectedScopeId}
                  onScopeSelect={setSelectedScopeId}
                  onScopeFiltersChange={(filters: ColumnFiltersState) => {
                    setColumnFilters(filters);
                  }}
                />
              </div>

              {/* Center - Search */}
              <div className="flex-1 max-w-md mx-8">
                <div className="relative flex items-center">
                  <InputWithIcon
                    placeholder="Search..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    startAdornment={<Search className="w-4 h-4 text-muted-foreground" />}
                    className="pr-20"
                  />
                  <div className="absolute right-2 flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border rounded bg-background">
                    <span>⌘</span>
                    <span>K</span>
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3">
                {/* ERP Plan / Production Plan Toggle */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={planMode === 'erp' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPlanMode('erp')}
                    className={planMode === 'erp' ? 'bg-background text-[#2063F0] shadow-sm' : 'text-muted-foreground'}
                  >
                    ERP Plan
                  </Button>
                  <Button
                    variant={planMode === 'prod' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPlanMode('prod')}
                    className={planMode === 'prod' ? 'bg-background text-[#2063F0] shadow-sm' : 'text-muted-foreground'}
                  >
                    Production Plan
                  </Button>
                </div>

                <div className="h-6 w-px bg-border" />

                {/* Routine Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-sm">
                      Routine: No routine Available
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>No routine available</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Save/Download Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
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
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <LinkIcon className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Copy Link</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-border" />

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bell className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto p-0 bg-transparent border-b border-transparent">
                <TabsTrigger 
                  value="purchase-order-book" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-[#2063F0] data-[state=active]:border-b-2 data-[state=active]:border-[#2063F0] rounded-none px-4 py-2"
                >
                  Purchase Order Book
                </TabsTrigger>
                <TabsTrigger 
                  value="line-of-balance" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-[#2063F0] data-[state=active]:border-b-2 data-[state=active]:border-[#2063F0] rounded-none px-4 py-2"
                >
                  Line of Balance
                </TabsTrigger>
                <TabsTrigger 
                  value="planning" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-[#2063F0] data-[state=active]:border-b-2 data-[state=active]:border-[#2063F0] rounded-none px-4 py-2"
                >
                  Planning
                  <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="opportunities" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-[#2063F0] data-[state=active]:border-b-2 data-[state=active]:border-[#2063F0] rounded-none px-4 py-2"
                >
                  Opportunities
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Table Controls */}
        <div className="px-6 py-3.5 bg-muted/50 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select value="none" onValueChange={() => {}}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Group by None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Group by None</SelectItem>
              </SelectContent>
            </Select>
            <SortingAndFiltersPopover
              sorting={sorting}
              columnFilters={columnFilters}
              onSortingChange={setSorting}
              onColumnFiltersChange={setColumnFilters}
              columns={columns}
              filterDefinitions={filterDefinitions}
              onOpenFilterModal={(columnId) => {
                setFilterModalColumnId(columnId);
                setFilterModalOpen(true);
              }}
            />
          </div>
          <Button variant="ghost" size="sm">Columns</Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <div className="inline-block min-w-full align-middle">
            <table
              className="min-w-full divide-y divide-[var(--color-table-border)] border-collapse"
              style={{ width: table.getCenterTotalSize() || '100%' }}
            >
              {/* Header */}
              <thead className="bg-muted/50 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta as { headerTint?: 'green' | 'purple' } | undefined;
                      const headerTint = meta?.headerTint;
                      const bgColor = headerTint === 'green' 
                        ? 'bg-green-50 dark:bg-green-950/20' 
                        : headerTint === 'purple'
                        ? 'bg-purple-50 dark:bg-purple-950/20'
                        : 'bg-muted/50';
                      
                      const colSpan = header.colSpan || 1;
                      const isGroupHeader = header.subHeaders && header.subHeaders.length > 0;

                      return (
                        <th
                          key={header.id}
                          colSpan={colSpan}
                          className={cn(
                            'px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-r transition-colors',
                            bgColor,
                            header.column.getCanSort() && !isGroupHeader && 'hover:bg-muted cursor-pointer'
                          )}
                          style={{
                            width: header.getSize(),
                            position: 'relative',
                          }}
                        >
                          {header.isPlaceholder ? null : isGroupHeader ? (
                            <div className="flex items-center gap-2">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                          ) : (
                            <ColumnHeader
                              header={header}
                              columnId={header.column.id}
                              sorting={sorting}
                              columnFilters={columnFilters}
                              onSortingChange={setSorting}
                              onColumnFiltersChange={setColumnFilters}
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
              <tbody className="bg-background divide-y">
                {table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'transition-colors duration-150',
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/30',
                      'hover:bg-muted',
                      row.getIsSelected() && 'bg-primary/5 hover:bg-primary/10'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm border-r"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-background border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <span>Σ</span>
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
                <SelectTrigger className="w-[100px]">
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
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of <span className="font-semibold">{table.getFilteredRowModel().rows.length}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm font-medium text-foreground min-w-[80px] text-center">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
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
            const filter = columnFilters.find((f) => f.id === filterModalColumnId);
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
            const filter = columnFilters.find((f) => f.id === filterModalColumnId);
            if (!filter) return 'is';
            if (typeof filter.value === 'object' && filter.value !== null && 'condition' in filter.value) {
              return (filter.value as any).condition === 'isNot' ? 'isNot' : 'is';
            }
            return 'is';
          })()}
          onApply={(values, condition) => {
            // Prevent any potential event bubbling that might trigger header click
            const newFilters = columnFilters.filter((f) => f.id !== filterModalColumnId);
            if (values.length > 0) {
              newFilters.push({
                id: filterModalColumnId,
                value: condition === 'is' ? values : { condition, values },
              });
            }
            // Use setTimeout to ensure modal closes before state update
            // This prevents any click events from bubbling to header
            setTimeout(() => {
              setColumnFilters(newFilters);
            }, 0);
          }}
        />
      )}
    </div>
  );
};

