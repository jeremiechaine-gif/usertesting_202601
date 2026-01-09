/**
 * Substep 4.2: Routine Preview
 * Shows a preview of the routine with ability to modify filters and sorting
 */

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender, type ColumnFiltersState, type SortingState } from '@tanstack/react-table';
import { mockData } from '@/lib/mockData';
import { columns } from '@/lib/columns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Settings2 } from 'lucide-react';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type { RoutineLibraryEntry } from '@/lib/onboarding/types';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Lazy load heavy modals
const SortingAndFiltersPopover = lazy(() => import('@/components/SortingAndFiltersPopover').then(m => ({ default: m.SortingAndFiltersPopover })));
const ColumnFilterModal = lazy(() => import('@/components/ColumnFilterModal').then(m => ({ default: m.ColumnFilterModal })));

interface Substep4_2_RoutinePreviewProps {
  routineId: string;
  teamId: string;
  onBack: () => void;
  onAddRoutine: (filters: ColumnFiltersState, sorting: SortingState) => void;
}

/**
 * Convert RoutineLibraryEntry filters to ColumnFiltersState
 * Simplified version for preview
 */
function convertRoutineFiltersToColumnFilters(routine: RoutineLibraryEntry): ColumnFiltersState {
  const filters: ColumnFiltersState = [];
  if (routine.filters) {
    routine.filters.forEach(filter => {
      const { columnId, condition, values, dateExpression } = filter;
      
      // Handle date expressions
      if (dateExpression) {
        const today = new Date();
        const match = dateExpression.toLowerCase().match(/(\d+)\s*(week|month|day)s?\s*ago/);
        if (match) {
          const amount = parseInt(match[1], 10);
          const unit = match[2];
          const date = new Date(today);
          
          switch (unit) {
            case 'day':
              date.setDate(date.getDate() - amount);
              break;
            case 'week':
              date.setDate(date.getDate() - (amount * 7));
              break;
            case 'month':
              date.setMonth(date.getMonth() - amount);
              break;
          }
          
          filters.push({
            id: columnId,
            value: {
              condition: condition || 'lessThan',
              date: date.toISOString().split('T')[0],
            },
          });
        }
      } else if (condition && condition !== 'is') {
        filters.push({
          id: columnId,
          value: {
            condition,
            values,
          },
        });
      } else {
        filters.push({
          id: columnId,
          value: values.length === 1 ? values[0] : values,
        });
      }
    });
  }
  return filters;
}

export const Substep4_2_RoutinePreview: React.FC<Substep4_2_RoutinePreviewProps> = ({
  routineId,
  teamId,
  onBack,
  onAddRoutine,
}) => {
  // Get routine from library
  const routine = ROUTINE_LIBRARY.find(r => r.id === routineId);
  
  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Routine introuvable</p>
        <Button variant="secondary" onClick={onBack} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  // Initialize filters and sorting from routine
  const initialFilters = useMemo(() => convertRoutineFiltersToColumnFilters(routine), [routine]);
  const initialSorting: SortingState = []; // Routines from library don't have sorting by default

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterModalColumnId, setFilterModalColumnId] = useState<string | null>(null);

  const data = useMemo(() => mockData, []);

  // Table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: true,
    initialState: {
      pagination: {
        pageSize: 10, // Show fewer rows in preview
      },
    },
  });

  const handleOpenFilterModal = useCallback((columnId: string) => {
    setFilterModalColumnId(columnId);
    setFilterModalOpen(true);
  }, []);

  const handleAddRoutine = useCallback(() => {
    onAddRoutine(columnFilters, sorting);
  }, [columnFilters, sorting, onAddRoutine]);

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const totalRowCount = table.getRowCount();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-6 border-b border-border bg-background">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h3 className="text-lg font-semibold">Aperçu : {routine.label}</h3>
            </div>
            {routine.description && (
              <p className="text-sm text-muted-foreground">{routine.description}</p>
            )}
          </div>
        </div>

        {/* Routine Metadata */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="secondary" className="text-xs">
            {routine.frequency}
          </Badge>
          {routine.pelicoViews && routine.pelicoViews.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-pink-500/10 text-pink-600 border-pink-500/30">
              {routine.pelicoViews[0]}
            </Badge>
          )}
          {routine.objectives && routine.objectives.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {routine.objectives[0]}
            </Badge>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Suspense fallback={<div className="h-9 w-32 bg-muted animate-pulse rounded" />}>
              <SortingAndFiltersPopover
                sorting={sorting}
                columnFilters={columnFilters}
                onSortingChange={setSorting}
                onColumnFiltersChange={setColumnFilters}
                columns={columns}
                filterDefinitions={filterDefinitions}
                onOpenFilterModal={handleOpenFilterModal}
              />
            </Suspense>
            <div className="text-xs text-muted-foreground">
              {filteredRowCount} ligne{filteredRowCount > 1 ? 's' : ''} sur {totalRowCount}
            </div>
          </div>
          <Button onClick={handleAddRoutine} className="gap-2">
            <Check className="h-4 w-4" />
            Ajouter cette routine
          </Button>
        </div>
      </div>

      {/* Preview Table */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="rounded-lg border border-border overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm"
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

          {/* Info Message */}
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20">
            <p className="text-xs text-muted-foreground">
              <strong>Note :</strong> Ceci est un aperçu avec des données d'exemple. Vous pouvez modifier les filtres et le tri avant d'ajouter la routine à votre équipe.
            </p>
          </div>
        </div>
      </ScrollArea>

      {/* Filter Modal */}
      {filterModalOpen && filterModalColumnId && (
        <Suspense fallback={null}>
          <ColumnFilterModal
            open={filterModalOpen}
            onOpenChange={setFilterModalOpen}
            columnId={filterModalColumnId}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
          />
        </Suspense>
      )}
    </div>
  );
};
