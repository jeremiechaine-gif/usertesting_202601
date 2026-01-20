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
import { columns as poBookColumns } from '@/lib/columns';
import { mockData as poBookMockData } from '@/lib/mockData';
import { columns as woBookColumns } from '@/lib/woBookColumns';
import { mockData as woBookMockData } from '@/lib/woBookMockData';
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
  
  // Load columns and data based on selected view
  const { columns, mockData } = useMemo(() => {
    if (view.pelicoViewPage === 'wo-book') {
      return { columns: woBookColumns, mockData: woBookMockData };
    }
    // Default to PO Book columns for other views
    return { columns: poBookColumns, mockData: poBookMockData };
  }, [view.pelicoViewPage]);
  
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
    getRowId: (row: any) => row.id,
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
    // Debug: Log the columnId received
    console.log('[Step3ConfigureRoutine] handleOpenFilterModal called with columnId:', columnId);
    console.log('[Step3ConfigureRoutine] mockData length:', mockData?.length);
    console.log('[Step3ConfigureRoutine] columns:', columns);
    
    const filterDef = filterDefinitionsWithFavorites.find(def => {
      const defColumnId = getColumnIdFromFilterId(def.id);
      return defColumnId === columnId;
    });
    
    // Find column by id or accessorKey (including nested columns)
    // TanStack Table columns can be in different formats:
    // 1. Direct column definition: { id: 'materialCoverage', accessorKey: 'materialCoverage', ... }
    // 2. Nested in group: { id: 'status', columns: [{ id: 'materialCoverage', ... }] }
    // 3. TanStack Table header structure: { columnDef: { id: 'materialCoverage', ... } }
    const findColumn = (cols: any[]): any => {
      for (const col of cols) {
        // Check if this column matches by id
        if (col.id === columnId) {
          return col;
        }
        // Check accessorKey if it exists (for columnHelper.accessor columns)
        if (col.accessorKey === columnId) {
          return col;
        }
        // Check columnDef for accessorKey (TanStack Table header structure)
        if (col.columnDef) {
          if (col.columnDef.id === columnId || col.columnDef.accessorKey === columnId) {
            return col.columnDef;
          }
        }
        // Recursively search nested columns (for grouped columns)
        if ('columns' in col && Array.isArray(col.columns)) {
          const found = findColumn(col.columns);
          if (found) return found;
        }
        // Also check columnDef.columns for nested structure
        if (col.columnDef && col.columnDef.columns && Array.isArray(col.columnDef.columns)) {
          const found = findColumn(col.columnDef.columns);
          if (found) return found;
        }
      }
      return null;
    };
    
    // Try to find column in the columns array
    const column = findColumn(columns);
    console.log('[Step3ConfigureRoutine] Found column:', column);
    console.log('[Step3ConfigureRoutine] Column accessorKey:', column?.accessorKey);
    console.log('[Step3ConfigureRoutine] Column id:', column?.id);
    console.log('[Step3ConfigureRoutine] Column structure:', JSON.stringify(column, null, 2));
    
    // Also try to get column from table if available (TanStack Table structure)
    // This is a fallback in case the column structure is different
    let tableColumn = null;
    try {
      // Access table instance if available (might not be in scope here)
      // For now, we'll rely on findColumn
    } catch (e) {
      console.warn('[Step3ConfigureRoutine] Could not access table:', e);
    }
    
    const columnLabel = column?.header?.toString() || filterDef?.label || columnId;
    
    // Extract options from filter definition if available, otherwise extract from mock data
    let options: Array<{ label: string; value: string | number }> = [];
    if (filterDef && filterDef.options) {
      console.log('[Step3ConfigureRoutine] Using filter definition options:', filterDef.options);
      options = filterDef.options;
    } else {
      // Extract unique values from mock data for this column
      // Determine the data key to use: prefer accessorKey, then id, then columnId
      let dataKey: string | undefined = undefined;
      
      // Try to get accessorKey from column definition
      if (column) {
        // For TanStack Table columns created with columnHelper.accessor, accessorKey is the first parameter
        // This is the key used to access data in the row object
        dataKey = column.accessorKey || column.id;
        // Also check columnDef if it exists (TanStack Table structure)
        if (!dataKey && column.columnDef) {
          dataKey = column.columnDef.accessorKey || column.columnDef.id;
        }
      }
      // If still not found, use columnId as fallback (it should match the data key)
      // In woBookColumns, columnHelper.accessor('materialCoverage', { id: 'materialCoverage' })
      // means both accessorKey and id are 'materialCoverage', which matches the data key
      if (!dataKey) {
        dataKey = columnId;
      }
      
      // Final fallback: if columnId is the same as what we'd expect for the data key, use it directly
      // This handles the case where columnId is already the correct data key (e.g., 'materialCoverage')
      
      console.log('[Step3ConfigureRoutine] Using dataKey:', dataKey);
      
      const values = new Set<string | number>();
      if (Array.isArray(mockData) && mockData.length > 0) {
        console.log('[Step3ConfigureRoutine] Processing', mockData.length, 'rows');
        let foundCount = 0;
        let notFoundCount = 0;
        
        mockData.forEach((row: any, index: number) => {
          // Try to get value using the determined dataKey
          let value = dataKey ? row[dataKey] : undefined;
          
          // If not found, try columnId directly as additional fallback
          if (value === undefined && dataKey !== columnId) {
            value = row[columnId];
          }
          
          // If still not found, try camelCase conversion (e.g., "Material coverage" -> "materialCoverage")
          if (value === undefined && columnId.includes(' ')) {
            const camelCaseKey = columnId
              .split(' ')
              .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join('');
            value = row[camelCaseKey];
          }
          
          // Additional fallback: try to find the key by matching the columnId (case-insensitive)
          if (value === undefined) {
            const rowKeys = Object.keys(row);
            const matchingKey = rowKeys.find(key => 
              key.toLowerCase() === columnId.toLowerCase() || 
              key.toLowerCase().replace(/\s+/g, '') === columnId.toLowerCase().replace(/\s+/g, '')
            );
            if (matchingKey) {
              value = row[matchingKey];
            }
          }
          
          if (value !== undefined && value !== null) {
            values.add(value);
            foundCount++;
            if (index < 3) {
              console.log(`[Step3ConfigureRoutine] Row ${index}: found value "${value}" using key "${dataKey}"`);
            }
          } else {
            notFoundCount++;
            if (index < 3) {
              console.log(`[Step3ConfigureRoutine] Row ${index}: value not found. Row keys:`, Object.keys(row));
            }
          }
        });
        
        console.log('[Step3ConfigureRoutine] Found values:', foundCount, 'Not found:', notFoundCount);
        console.log('[Step3ConfigureRoutine] Unique values:', Array.from(values));
        
        if (values.size > 0) {
          options = Array.from(values)
            .map((value) => ({
              label: String(value),
              value,
            }))
            .sort((a, b) => String(a.value).localeCompare(String(b.value)));
        } else {
          console.warn('[Step3ConfigureRoutine] No values found! Sample row keys:', Object.keys(mockData[0] || {}));
        }
      } else {
        console.warn('[Step3ConfigureRoutine] mockData is not an array or is empty:', mockData);
      }
    }
    
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
  };

  const handleFilterModalApply = (values: (string | number)[], condition: string) => {
    if (!filterModalColumnId) return;
    
    // Try to find filterDef first (for columns with predefined filter definitions)
    const filterDef = filterDefinitionsWithFavorites.find(def => {
      const defColumnId = getColumnIdFromFilterId(def.id);
      return defColumnId === filterModalColumnId;
    });
    
    // Create filter directly with columnId if no filterDef exists (for dynamic columns like Material coverage)
    if (values.length > 0) {
      // Remove existing filter for this column
      const newUserFilters = userFilters.filter(f => f.id !== filterModalColumnId);
      
      // Add new filter
      newUserFilters.push({
        id: filterModalColumnId,
        value: values.length === 1 ? values[0] : values,
      });
      
      onFiltersChange(newUserFilters);
    } else {
      // Remove filter if no values selected
      const newUserFilters = userFilters.filter(f => f.id !== filterModalColumnId);
      onFiltersChange(newUserFilters);
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
              Nom de la routine <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Input
                id="routine-name"
                placeholder="Ex: Suivi critique des fournisseurs"
                value={routineName}
                onChange={(e) => onRoutineNameChange?.(e.target.value)}
                className="flex-1 min-w-0"
              />
            </div>
          </div>

          {/* Routine Description */}
          <div className="space-y-2">
            <Label htmlFor="routine-description" className="text-sm font-semibold">
              Description <span className="text-muted-foreground text-xs">(Optionnel)</span>
            </Label>
            <Textarea
              id="routine-description"
              placeholder="Ex: Utilisez cette routine lors des points quotidiens pour prioriser les actions fournisseurs"
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
                Objectif <span className="text-muted-foreground text-xs">(Optionnel)</span>
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
                    <SelectValue placeholder="Sélectionner un objectif" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Anticipate', 'Monitor', 'Correct', 'Prioritize', 'Report'] as Objective[]).map((obj) => {
                      const objectiveLabels: Record<Objective, string> = {
                        'Anticipate': 'Anticiper',
                        'Monitor': 'Surveiller',
                        'Correct': 'Corriger',
                        'Prioritize': 'Prioriser',
                        'Report': 'Rapporter',
                      };
                      return (
                        <SelectItem key={obj} value={obj}>
                          {objectiveLabels[obj] || obj}
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="__custom__" className="text-[#2063F0] font-medium">
                      <Plus className="h-3 w-3 inline mr-1" />
                      Créer un nouvel objectif
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Saisir un objectif personnalisé"
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
        <div className="flex flex-col sm:flex-row items-start gap-3 p-4 sm:p-5 rounded-lg border border-[#2063F0]/20 dark:border-[#2063F0]/30 bg-gradient-to-br from-[#2063F0]/5 dark:from-[#2063F0]/10 to-transparent w-full max-w-full overflow-x-hidden">
          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-[#2063F0] dark:text-[#60A5FA] mt-0.5 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-foreground">Configurez la vue de votre routine</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="font-medium text-[#2063F0] dark:text-[#60A5FA] shrink-0">•</span>
                <span className="min-w-0">Utilisez les sections <strong className="text-foreground">Tri & Filtres</strong> ci-dessous pour ajouter des filtres et des règles de tri</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-medium text-[#2063F0] dark:text-[#60A5FA] shrink-0">•</span>
                <span className="min-w-0">Cliquez sur les en-têtes de colonnes dans la table d'aperçu pour trier ou filtrer directement</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-medium text-[#2063F0] dark:text-[#60A5FA] shrink-0">•</span>
                <span className="min-w-0">L'aperçu de la table se met à jour en temps réel pendant que vous configurez votre routine</span>
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
                className="text-xs shrink-0 bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 border-0 px-3 py-1.5 whitespace-nowrap"
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
                                onFilterClick={handleOpenFilterModal}
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
            <strong className="text-foreground dark:text-foreground">Note :</strong> Vous pouvez toujours modifier les filtres, le tri et les autres paramètres après avoir créé la routine. 
            Plusieurs routines peuvent exister par vue, vous pouvez donc créer différentes configurations pour différents besoins.
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

