/**
 * Step 3: Configure the Routine
 * Let users apply filters, sorting, and view-specific settings
 */

import React, { useState, useMemo, Suspense, lazy } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Filter, ArrowUpDown, Info } from 'lucide-react';
import type { PelicoViewDefinition } from '@/lib/onboarding/pelicoViews';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { columns } from '@/lib/columns';
import { SortingSection } from '@/components/sorting-filters/SortingSection';
import { FiltersSection } from '@/components/sorting-filters/FiltersSection';
import { tableStateToDraftSorting, tableStateToDraftFilters, draftSortingToTableState, draftFiltersToTableState } from '@/components/sorting-filters/stateAdapters';
import { getSortableColumns, getColumnIdFromFilterId, groupFilterDefinitions, filterSearchResults } from '@/components/sorting-filters/utils';
import type { SortConfig, FilterConfig, FilterDefinition } from '@/components/SortingAndFiltersPopover';
import { AddFilterView } from '@/components/SortingAndFiltersPopover';

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

