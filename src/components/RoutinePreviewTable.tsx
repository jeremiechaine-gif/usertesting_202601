/**
 * RoutinePreviewTable Component
 * Reusable table component with toolbar, filters, sorting, and column management
 * Used for displaying routine previews with consistent styling
 */

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnFiltersState,
  type SortingState,
  type ColumnSizingState,
  type Table,
  type ColumnDef,
  type OnChangeFn,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { ColumnHeader } from '@/components/ColumnHeader';
import { ColumnsPopover } from '@/components/ColumnsPopover';
import { cn } from '@/lib/utils';
import { filterDefinitions } from '@/lib/filterDefinitions';

// Lazy load heavy modals
const SortingAndFiltersPopover = lazy(() => import('@/components/SortingAndFiltersPopover').then(m => ({ default: m.SortingAndFiltersPopover })));

interface RoutinePreviewTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  onSortingChange: OnChangeFn<SortingState>;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  viewName?: string; // Name to display in the badge (e.g., "Escalation Room")
  scopeFilters?: ColumnFiltersState;
  userFilters?: ColumnFiltersState;
  routineFilters?: ColumnFiltersState;
  onOpenFilterModal?: (columnId: string) => void;
  maxHeight?: string; // Default: "400px"
  maxRows?: number; // Default: 10
  showRowCountMessage?: boolean; // Default: true
}

export function RoutinePreviewTable<TData>({
  data,
  columns,
  sorting,
  columnFilters,
  onSortingChange,
  onColumnFiltersChange,
  viewName,
  scopeFilters = [],
  userFilters = [],
  routineFilters = [],
  onOpenFilterModal,
  maxHeight = '400px',
  maxRows = 10,
  showRowCountMessage = true,
}: RoutinePreviewTableProps<TData>) {
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [highlightedColumnId, setHighlightedColumnId] = useState<string | null>(null);

  // Table instance
  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnSizing,
    },
    onSortingChange: onSortingChange,
    onColumnFiltersChange: onColumnFiltersChange,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    defaultColumn: {
      minSize: 50,
      maxSize: 300,
      size: 150,
    },
    initialState: {
      pagination: {
        pageSize: maxRows,
      },
    },
  });

  const handleOpenFilterModal = useCallback((columnId: string) => {
    if (onOpenFilterModal) {
      onOpenFilterModal(columnId);
    }
  }, [onOpenFilterModal]);

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const totalRowCount = table.getRowCount();

  return (
    <div className="p-4">
      {/* Table Preview - Container Principal */}
      <div 
        className="border rounded-lg overflow-hidden flex flex-col w-full" 
        style={{ maxWidth: '100%', overflowX: 'hidden', width: '100%' }}
      >
        {/* Toolbar - Barre d'outils en haut */}
        <div 
          className="p-3 sm:p-4 bg-muted/30 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2 shrink-0 w-full" 
          style={{ maxWidth: '100%', overflowX: 'hidden' }}
        >
          {/* Section gauche : Badge + SortingAndFiltersPopover */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
            {viewName && (
              <Badge 
                variant="secondary" 
                className="text-xs shrink-0 bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 border-0 px-3 py-1.5 whitespace-nowrap"
              >
                {viewName}
              </Badge>
            )}
            <Suspense fallback={<div className="h-9 w-32 bg-muted animate-pulse rounded" />}>
              <SortingAndFiltersPopover
                sorting={sorting}
                columnFilters={columnFilters}
                onSortingChange={onSortingChange}
                onColumnFiltersChange={onColumnFiltersChange}
                columns={columns}
                filterDefinitions={filterDefinitions}
                onOpenFilterModal={handleOpenFilterModal}
                scopeFilters={scopeFilters as any}
              />
            </Suspense>
          </div>
          
          {/* Section droite : ColumnsPopover */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end sm:justify-start min-w-0">
            <ColumnsPopover 
              table={table as Table<any>} 
              columns={columns}
              highlightedColumnId={highlightedColumnId}
              onHighlightChange={setHighlightedColumnId}
            />
          </div>
        </div>

        {/* Table container - Conteneur de la table avec scroll */}
        <div 
          className="overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full" 
          style={{ maxWidth: '100%', width: '100%', maxHeight }}
        >
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
                            routineFilters={routineFilters}
                            onSortingChange={onSortingChange}
                            onColumnFiltersChange={onColumnFiltersChange}
                            onFilterClick={(columnId) => {
                              handleOpenFilterModal(columnId);
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
              {table.getRowModel().rows.slice(0, maxRows).map((row) => (
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
          
          {/* Message si plus de maxRows lignes */}
          {showRowCountMessage && table.getRowModel().rows.length > maxRows && (
            <div className="p-4 text-center text-xs text-muted-foreground border-t">
              Showing first {maxRows} of {table.getRowModel().rows.length} rows
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
