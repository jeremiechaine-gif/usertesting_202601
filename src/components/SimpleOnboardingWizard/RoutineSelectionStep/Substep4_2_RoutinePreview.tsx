/**
 * Substep 4.2: Routine Preview
 * Shows a preview of the routine with ability to modify filters and sorting
 */

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { type ColumnFiltersState, type SortingState } from '@tanstack/react-table';
import { mockData } from '@/lib/mockData';
import { columns } from '@/lib/columns';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type { RoutineLibraryEntry } from '@/lib/onboarding/types';
import { RoutinePreviewTable } from '@/components/RoutinePreviewTable';
import { useScope } from '@/contexts/ScopeContext';

// Lazy load ColumnFilterModal
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
  
  // Scope context for scope filters
  const { getScopeFilters } = useScope();
  const scopeFilters = useMemo(() => getScopeFilters(), [getScopeFilters]);

  const data = useMemo(() => mockData, []);

  const handleOpenFilterModal = useCallback((columnId: string) => {
    setFilterModalColumnId(columnId);
    setFilterModalOpen(true);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-3 border-b border-border bg-background">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <h3 className="text-lg font-semibold mb-2">Preview: {routine.label}</h3>
            {routine.description && (
              <p className="text-sm text-muted-foreground">{routine.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Table Preview */}
      <RoutinePreviewTable
        data={data}
        columns={columns}
        sorting={sorting}
        columnFilters={columnFilters}
        onSortingChange={setSorting}
        onColumnFiltersChange={setColumnFilters}
        viewName={routine.pelicoViews && routine.pelicoViews.length > 0 ? routine.pelicoViews[0] : undefined}
        scopeFilters={scopeFilters}
        userFilters={columnFilters.filter(f => !scopeFilters.some(sf => sf.id === f.id))}
        routineFilters={[]}
        onOpenFilterModal={handleOpenFilterModal}
        maxHeight="400px"
        maxRows={10}
        showRowCountMessage={true}
      />

      {/* Info Message */}
      <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20">
        <p className="text-xs text-muted-foreground">
          <strong>Note :</strong> Ceci est un aperçu avec des données d'exemple. Vous pouvez modifier les filtres et le tri avant d'ajouter la routine à votre équipe.
        </p>
      </div>

      {/* Filter Modal */}
      {filterModalOpen && filterModalColumnId && (
        <Suspense fallback={null}>
          <ColumnFilterModal
            open={filterModalOpen}
            onOpenChange={setFilterModalOpen}
            columnId={filterModalColumnId}
            columnLabel={filterModalColumnId}
            options={[]}
            selectedValues={[]}
            onApply={(values, condition) => {
              // Handle filter apply
              setColumnFilters(prev => {
                const newFilters = prev.filter(f => f.id !== filterModalColumnId);
                if (values.length > 0) {
                  newFilters.push({ id: filterModalColumnId, value: values });
                }
                return newFilters;
              });
            }}
          />
        </Suspense>
      )}
    </div>
  );
};
