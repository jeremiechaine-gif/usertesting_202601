/**
 * Create Routine View Component
 * Integrated view (not modal) for creating routines with view selection and table configuration
 * Displays selected view as a table with sorting and filtering capabilities
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowLeft,
  CheckCircle2,
  Target,
  Info,
  Filter,
  ArrowUpDown,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createRoutine } from '@/lib/routines';
import { getCurrentUserId } from '@/lib/users';
import { mockData } from '@/lib/mockData';
import { columns } from '@/lib/columns';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { ColumnHeader } from '@/components/ColumnHeader';
import { SortingAndFiltersPopover } from '@/components/SortingAndFiltersPopover';
import { ColumnFilterModal } from '@/components/ColumnFilterModal';
import { ColumnsPopover } from '@/components/ColumnsPopover';
import { getColumnIdFromFilterId, getColumnLabel } from '@/components/sorting-filters/utils';
import {
  PELICO_VIEWS,
  getRecommendedViewsForPersona,
  getViewsByIntent,
  mapPersonaToEnglish,
  type PelicoViewDefinition,
} from '@/lib/onboarding/pelicoViews';
import type { Objective } from '@/lib/onboarding/types';
import { Step1ChooseView } from './CreateRoutineWizard/Step1ChooseView';

export type CreateRoutineStep = 'choose-view' | 'configure-table';

interface CreateRoutineViewProps {
  teamId: string;
  teamPersona?: string;
  onClose: () => void;
  onRoutineCreated: (routineId: string) => void;
  currentStep?: CreateRoutineStep;
  onStepChange?: (step: CreateRoutineStep) => void;
  onSaveRequest?: () => void; // Expose save function to parent
  routineName?: string; // Expose routine name for validation
  onRoutineNameChange?: (name: string) => void; // Callback to update routine name in parent
}

export const CreateRoutineView: React.FC<CreateRoutineViewProps> = ({
  teamId,
  teamPersona,
  onClose,
  onRoutineCreated,
  currentStep: externalCurrentStep,
  onStepChange,
  onSaveRequest,
  routineName: externalRoutineName,
  onRoutineNameChange,
}) => {
  const [internalCurrentStep, setInternalCurrentStep] = useState<CreateRoutineStep>('choose-view');
  const currentStep = externalCurrentStep ?? internalCurrentStep;
  
  const setCurrentStep = (step: CreateRoutineStep) => {
    if (onStepChange) {
      onStepChange(step);
    } else {
      setInternalCurrentStep(step);
    }
  };
  const [selectedView, setSelectedView] = useState<PelicoViewDefinition | null>(null);
  const [showAllViews, setShowAllViews] = useState(false);
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterModalColumnId, setFilterModalColumnId] = useState<string | null>(null);
  const [highlightedColumnId, setHighlightedColumnId] = useState<string | null>(null);
  
  // Routine save state
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [selectedObjective, setSelectedObjective] = useState<Objective | string>('');
  const [customObjective, setCustomObjective] = useState('');
  const [showCustomObjectiveInput, setShowCustomObjectiveInput] = useState(false);

  // Map French persona to English and get recommended views
  const teamPersonaEnglish = teamPersona ? mapPersonaToEnglish(teamPersona) : null;
  const recommendedViews = teamPersonaEnglish ? getRecommendedViewsForPersona(teamPersonaEnglish) : [];
  const viewsByIntent = getViewsByIntent();

  // Table data - using mockData for now (can be extended to support different views)
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
        pageSize: 100,
      },
    },
  });

  // Suggest objective based on view intent
  const suggestObjectiveFromView = (view: PelicoViewDefinition): Objective => {
    const intentToObjective: Record<string, Objective> = {
      'resolve-blockers': 'Correct',
      'execute-operations': 'Monitor',
      'anticipate-risks': 'Anticipate',
      'manage-customer-commitments': 'Monitor',
      'investigate-causes-impacts': 'Monitor',
    };
    return intentToObjective[view.intent] || 'Monitor';
  };

  const handleViewSelect = (view: PelicoViewDefinition) => {
    setSelectedView(view);
    setCurrentStep('configure-table');
    // Suggest objective when view is selected
    const suggested = suggestObjectiveFromView(view);
    setSelectedObjective(suggested);
  };

  const handleSave = React.useCallback(() => {
    if (!selectedView || !routineName.trim()) return;

    const currentUserId = getCurrentUserId();
    const objectives: Objective[] = selectedObjective && !showCustomObjectiveInput 
      ? [selectedObjective as Objective]
      : customObjective.trim() 
      ? [customObjective.trim() as Objective]
      : [];
    
    const routine = createRoutine({
      name: routineName.trim(),
      description: routineDescription.trim() || undefined,
      filters: columnFilters,
      sorting,
      pelicoView: selectedView.pelicoViewPage,
      scopeMode: 'scope-aware',
      createdBy: currentUserId,
      teamIds: [teamId],
      objectives: objectives.length > 0 ? objectives : undefined,
    });

    onRoutineCreated(routine.id);
    onClose();
  }, [selectedView, routineName, routineDescription, columnFilters, sorting, teamId, selectedObjective, customObjective, showCustomObjectiveInput, onRoutineCreated, onClose]);

  // Sync internal step when external step changes
  React.useEffect(() => {
    if (externalCurrentStep) {
      setInternalCurrentStep(externalCurrentStep);
    }
  }, [externalCurrentStep]);

  // Expose save function to parent via window (temporary solution)
  // This allows the footer in SimpleOnboardingWizard to call handleSave
  React.useEffect(() => {
    (window as any).__createRoutineViewHandleSave = handleSave;
    return () => {
      delete (window as any).__createRoutineViewHandleSave;
    };
  }, [handleSave]);

  const handleOpenFilterModal = (columnId: string) => {
    setFilterModalColumnId(columnId);
    setFilterModalOpen(true);
  };

  const stepLabels = {
    'choose-view': 'Choose View',
    'configure-table': 'Configure',
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header with breadcrumb */}
      <div className="shrink-0 border-b border-border bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent">
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-3 text-xs">
            <span className="text-muted-foreground">Routines</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-[#2063F0] font-medium">Create Routine</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">{stepLabels[currentStep]}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Create Routine</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {currentStep === 'choose-view' && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 max-w-full sm:max-w-2xl lg:max-w-4xl mx-auto w-full">
              <Step1ChooseView
                recommendedViews={recommendedViews}
                allViews={PELICO_VIEWS}
                viewsByIntent={viewsByIntent}
                showAllViews={showAllViews}
                onToggleShowAll={() => setShowAllViews(!showAllViews)}
                onViewSelect={handleViewSelect}
                hasPersona={!!teamPersonaEnglish}
                personaName={teamPersona || undefined}
              />
            </div>
          </ScrollArea>
        )}

        {currentStep === 'configure-table' && selectedView && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Routine Name and Description */}
            <div className="shrink-0 px-4 sm:px-6 pt-4 pb-4 bg-muted/30 space-y-4">
              {/* Routine Name with Pelico View Badge */}
              <div className="space-y-2">
                <Label htmlFor="routine-name" className="text-sm font-semibold">
                  Routine Name <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <Input
                    id="routine-name"
                    placeholder="e.g., Critical supplier follow-ups"
                    value={routineName}
                    onChange={(e) => {
                      setRoutineName(e.target.value);
                      if (onRoutineNameChange) {
                        onRoutineNameChange(e.target.value);
                      }
                    }}
                    className="flex-1 min-w-0"
                  />
                </div>
              </div>

              {/* Routine Description */}
              <div className="space-y-2">
                <Label htmlFor="routine-description" className="text-sm font-semibold">
                  Description <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Textarea
                  id="routine-description"
                  placeholder="e.g., Use this routine during daily standups to prioritize supplier actions"
                  value={routineDescription}
                  onChange={(e) => setRoutineDescription(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Objective Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="routine-objective" className="text-sm font-semibold">
                  Objective <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                {!showCustomObjectiveInput ? (
                  <Select
                    value={selectedObjective}
                    onValueChange={(value) => {
                      if (value === '__custom__') {
                        setShowCustomObjectiveInput(true);
                        setSelectedObjective('');
                      } else {
                        setSelectedObjective(value);
                      }
                    }}
                  >
                    <SelectTrigger id="routine-objective" className="w-full">
                      <SelectValue placeholder="Select objective" />
                    </SelectTrigger>
                    <SelectContent>
                      {(['Anticipate', 'Monitor', 'Correct', 'Prioritize', 'Report'] as Objective[]).map((obj) => (
                        <SelectItem key={obj} value={obj}>
                          {obj}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-[#2063F0] font-medium">
                        <Plus className="h-3 w-3 inline mr-1" />
                        Create new
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter custom objective"
                      value={customObjective}
                      onChange={(e) => setCustomObjective(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customObjective.trim()) {
                          e.preventDefault();
                          setShowCustomObjectiveInput(false);
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCustomObjectiveInput(false);
                        setCustomObjective('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* UX Guidance Banner */}
            <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-border">
              <div className="flex flex-col sm:flex-row items-start gap-3 p-4 sm:p-5 rounded-lg border border-[#2063F0]/20 bg-gradient-to-br from-[#2063F0]/5 to-transparent">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-[#2063F0] mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">Configure your routine view</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <span className="font-medium text-[#2063F0] shrink-0">•</span>
                      <span className="min-w-0">Use the <strong>Sorting & Filters</strong> button below to add filters and sorting rules</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-medium text-[#2063F0] shrink-0">•</span>
                      <span className="min-w-0">Click on column headers to sort or filter directly from the table</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-medium text-[#2063F0] shrink-0">•</span>
                      <span className="min-w-0">The table preview updates in real-time as you configure your routine</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table toolbar */}
            <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Badge 
                  variant="outline" 
                  className="text-xs shrink-0 bg-pink-500/10 text-pink-600 border-0 px-3 py-1.5 whitespace-nowrap"
                >
                  {selectedView.name}
                </Badge>
                <SortingAndFiltersPopover
                  sorting={sorting}
                  columnFilters={columnFilters}
                  onSortingChange={setSorting}
                  onColumnFiltersChange={setColumnFilters}
                  columns={columns}
                  filterDefinitions={filterDefinitions}
                  onOpenFilterModal={handleOpenFilterModal}
                />
              </div>
              <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end sm:justify-start">
                <ColumnsPopover 
                  table={table} 
                  columns={columns}
                  highlightedColumnId={highlightedColumnId}
                  onHighlightChange={setHighlightedColumnId}
                />
              </div>
            </div>

            {/* Table */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 sm:px-6 py-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                              style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                            >
                              {header.isPlaceholder ? null : (
                                <ColumnHeader
                                  header={header}
                                  columnId={header.column.id}
                                  sorting={sorting}
                                  columnFilters={columnFilters}
                                  userFilters={columnFilters}
                                  scopeFilters={[]}
                                  onSortingChange={setSorting}
                                  onColumnFiltersChange={setColumnFilters}
                                  onFilterClick={handleOpenFilterModal}
                                >
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                </ColumnHeader>
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y divide-border">
                      {table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
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

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length
                    )}{' '}
                    of {table.getFilteredRowModel().rows.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}

      </div>

      {/* Filter Modal */}
      {filterModalOpen && filterModalColumnId && (() => {
        const filterDef = filterDefinitions.find(def => {
          const defColumnId = getColumnIdFromFilterId(def.id);
          return defColumnId === filterModalColumnId;
        });
        
        if (!filterDef) return null;
        
        const options = filterDef.options || [];
        const existingFilter = columnFilters.find(f => f.id === filterModalColumnId);
        const selectedValues = existingFilter?.value 
          ? Array.isArray(existingFilter.value) 
            ? existingFilter.value 
            : [existingFilter.value]
          : [];
        
        const columnLabel = getColumnLabel(filterModalColumnId, columns) || filterDef.label;
        
        return (
          <ColumnFilterModal
            open={filterModalOpen}
            onOpenChange={setFilterModalOpen}
            columnId={filterModalColumnId}
            columnLabel={columnLabel}
            options={options}
            selectedValues={selectedValues}
            onApply={(values, condition) => {
              const newFilters = columnFilters.filter(f => f.id !== filterModalColumnId);
              if (values.length > 0) {
                newFilters.push({
                  id: filterModalColumnId,
                  value: values.length === 1 ? values[0] : values,
                });
              }
              setColumnFilters(newFilters);
              setFilterModalOpen(false);
              setFilterModalColumnId(null);
            }}
          />
        );
      })()}
    </div>
  );
};

