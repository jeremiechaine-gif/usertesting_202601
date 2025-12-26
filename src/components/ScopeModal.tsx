/**
 * Scope Modal Component
 * Create or edit a scope with name, description, and filters
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterChip } from '@/components/ui/filter-chip';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, Target, ArrowLeft, Search, Info, Filter, HelpCircle } from 'lucide-react';
import { createScope, updateScope, type Scope, type ScopeFilter } from '@/lib/scopes';
import { validateScope } from '@/lib/validation/scopeValidation';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { getColumnIdFromFilterId } from './sorting-filters/utils';
import { useToast } from '@/components/ui/toast';
import { useDebounce } from '@/lib/hooks/useDebounce';
// Lazy load heavy components to reduce bundle size
const AddFilterView = lazy(() => import('./SortingAndFiltersPopover').then(m => ({ default: m.AddFilterView })));
const ColumnFilterModal = lazy(() => import('./ColumnFilterModal').then(m => ({ default: m.ColumnFilterModal })));

interface ScopeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope?: Scope | null;
  onSave: () => void;
  title?: string; // Custom title for the modal (default: "Define Your Scope" or "Edit Scope")
  saveButtonText?: string; // Custom text for the save button (default: "Create Scope" or "Update Scope")
}

export const ScopeModal: React.FC<ScopeModalProps> = ({
  open,
  onOpenChange,
  scope,
  onSave,
  title,
  saveButtonText,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState<ScopeFilter[]>([]);
  // Layer navigation: 1 = form, 2 = filter list, 3 = filter detail
  const [currentLayer, setCurrentLayer] = useState<1 | 2 | 3>(1);
  const [filterSearch, setFilterSearch] = useState('');
  const [configuringFilterId, setConfiguringFilterId] = useState<string | null>(null); // ID du filtre en cours de configuration (nouveau ou existant)
  const [configuringFilterDef, setConfiguringFilterDef] = useState<typeof filterDefinitions[0] | null>(null); // Définition du filtre en cours de configuration
  // Layer 3 state for filter configuration
  const [layer3SearchQuery, setLayer3SearchQuery] = useState('');
  const [layer3SelectedValues, setLayer3SelectedValues] = useState<(string | number)[]>([]);
  const [layer3Condition, setLayer3Condition] = useState<string>('is');
  const [layer3DisplaySelectedOnly, setLayer3DisplaySelectedOnly] = useState(false);
  // Debounce search query for Layer 3 (must be at component level, not conditional)
  const debouncedLayer3SearchQuery = useDebounce(layer3SearchQuery, 300);
  // Info section visibility
  const [showScopeInfo, setShowScopeInfo] = useState(true);
  // Session-only favorites state
  const [sessionFavorites, setSessionFavorites] = useState<Set<string>>(
    new Set(filterDefinitions.filter(f => f.isFavorite).map(f => f.id))
  );
  const { showToast } = useToast();

  useEffect(() => {
    if (scope) {
      setName(scope.name);
      setDescription(scope.description || '');
      setFilters(scope.filters);
    } else {
      setName('');
      setDescription('');
      setFilters([]);
    }
    setCurrentLayer(1);
    setFilterSearch('');
    setConfiguringFilterId(null);
    setConfiguringFilterDef(null);
    // Reset info section visibility
    setShowScopeInfo(true);
  }, [scope, open]);

  const handleSave = () => {
    // Validate scope data
    const validation = validateScope({
      name,
      description,
      filters,
    });

    if (!validation.isValid) {
      // Show first error (could be enhanced to show all errors)
      alert(validation.errors[0] || 'Invalid scope data');
      return;
    }

    try {
      // Check if scope exists and has a valid ID (not empty or temp ID)
      if (scope && scope.id && !scope.id.startsWith('temp-')) {
        updateScope(scope.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          filters,
        });
      } else {
        const createdScope = createScope({
          name: name.trim(),
          description: description.trim() || undefined,
          filters,
          isGlobal: true, // Make scope globally available
        });
        console.log('[ScopeModal] Scope created:', { id: createdScope.id, name: createdScope.name, isGlobal: createdScope.isGlobal });
      }

      onSave();
    } catch (error) {
      console.error('Error saving scope:', error);
      alert('Failed to save scope. Please try again.');
    }
  };

  // Handle opening filter modal (same behavior as SortingAndFiltersPopover)
  const handleOpenFilterModal = (columnId: string) => {
    // Find the filter definition that maps to this column
    const filterDef = filterDefinitions.find(f => {
      const mappedColumnId = getColumnIdFromFilterId(f.id);
      return mappedColumnId === columnId;
    });
    
    if (!filterDef) return;
    
    // Check if filter already exists
    const existingFilter = filters.find(f => f.filterId === filterDef.id);
    
    if (existingFilter) {
      // Edit existing filter - pre-fill values
      setConfiguringFilterId(existingFilter.id);
      setConfiguringFilterDef(filterDef);
      // Initialize Layer 3 state with existing values
      setLayer3SelectedValues(existingFilter.values);
      setLayer3Condition(existingFilter.condition || (filterDef.type === 'number' ? 'equals' : filterDef.type === 'date' ? 'equals' : 'is'));
    } else {
      // New filter - create temporary ID
      const tempId = `temp-${Date.now()}`;
      setConfiguringFilterId(tempId);
      setConfiguringFilterDef(filterDef);
      // Initialize Layer 3 state with empty values
      setLayer3SelectedValues([]);
      setLayer3Condition(filterDef.type === 'number' ? 'equals' : filterDef.type === 'date' ? 'equals' : 'is');
    }
    
    // Reset Layer 3 search and display state
    setLayer3SearchQuery('');
    setLayer3DisplaySelectedOnly(false);
    
    // Navigate to Layer 3
    setCurrentLayer(3);
  };

  const handleAddFilter = (filterDef: typeof filterDefinitions[0]) => {
    // Check if this filter maps to a column - if so, open the column filter modal
    const columnId = getColumnIdFromFilterId(filterDef.id);
    if (columnId) {
      handleOpenFilterModal(columnId);
      return;
    }

    // Otherwise, for filters that don't map to columns, add directly
    // Check if filter already exists
    if (filters.some((f) => f.filterId === filterDef.id)) {
      // If exists, navigate to Layer 3 for editing
      const existingFilter = filters.find(f => f.filterId === filterDef.id);
      if (existingFilter) {
        setConfiguringFilterId(existingFilter.id);
        setConfiguringFilterDef(filterDef);
        // Initialize Layer 3 state with existing values
        setLayer3SelectedValues(existingFilter.values);
        setLayer3Condition(existingFilter.condition || (filterDef.type === 'number' ? 'equals' : filterDef.type === 'date' ? 'equals' : 'is'));
        setLayer3SearchQuery('');
        setLayer3DisplaySelectedOnly(false);
        setCurrentLayer(3);
      }
      return;
    }

    // For filters without column mapping and without options, we'll need a different approach
    // For now, add with empty values (user can edit later)
    const newFilter: ScopeFilter = {
      id: `filter-${Date.now()}`,
      filterId: filterDef.id,
      values: [],
    };

    setFilters([...filters, newFilter]);
    setCurrentLayer(1);
    setFilterSearch('');
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilters(filters.filter((f) => f.id !== filterId));
  };


  const getFilterDef = (filterId: string) => {
    return filterDefinitions.find((f) => f.id === filterId);
  };

  const getFilterLabel = (filterId: string) => {
    const def = getFilterDef(filterId);
    return def?.label || filterId;
  };

  // Update filter definitions with session favorites
  const filterDefinitionsWithFavorites = filterDefinitions.map(f => ({
    ...f,
    isFavorite: sessionFavorites.has(f.id),
    category: sessionFavorites.has(f.id) ? 'favorites' : f.category,
  }));

  // Group filters for AddFilterView - same structure as in SortingAndFiltersPopover
  const groupedFilters: {
    favorites: typeof filterDefinitions;
    general: typeof filterDefinitions;
    consumedParts: typeof filterDefinitions;
    producedParts: typeof filterDefinitions;
  } = {
    favorites: filterDefinitionsWithFavorites.filter((def) => def.isFavorite),
    general: filterDefinitionsWithFavorites.filter((def) => !def.isFavorite && (!def.category || def.category === 'general')),
    consumedParts: filterDefinitionsWithFavorites.filter((def) => def.category === 'consumed-parts'),
    producedParts: filterDefinitionsWithFavorites.filter((def) => def.category === 'produced-parts'),
  };

  const filteredFilterDefs = filterDefinitionsWithFavorites.filter((def) =>
    def.label.toLowerCase().includes(filterSearch.toLowerCase())
  );

  // Layer 3: Filter options for the current filter being configured
  // This useMemo must be at component level to respect Rules of Hooks
  const layer3FilteredOptions = React.useMemo(() => {
    // Only calculate when we're on Layer 3 and have a filter definition
    if (currentLayer !== 3 || !configuringFilterDef) {
      return [];
    }

    const options = configuringFilterDef.options || [];
    let filtered = options;

    // Apply search filter (using debounced value)
    if (debouncedLayer3SearchQuery) {
      const query = debouncedLayer3SearchQuery.toLowerCase();
      filtered = filtered.filter((opt) =>
        opt.label.toLowerCase().includes(query) || String(opt.value).toLowerCase().includes(query)
      );
    }

    // Apply "Display Selected Only" filter
    if (layer3DisplaySelectedOnly) {
      filtered = filtered.filter((opt) => layer3SelectedValues.includes(opt.value));
    }

    return filtered;
  }, [currentLayer, configuringFilterDef, debouncedLayer3SearchQuery, layer3DisplaySelectedOnly, layer3SelectedValues]);

  // Determine modal title - Unified style for all cases
  const modalTitle = title || (scope ? 'Edit Scope' : 'Define Your Scope');
  
  // Determine subtitle based on current layer
  const getSubtitle = () => {
    if (currentLayer === 1) {
      return scope ? 'Update scope details and filters' : (
        <>
          A scope is your <strong className="text-foreground">personal data perimeter</strong>. 
          It filters what you see by default, showing only the plants, parts, or suppliers 
          that are relevant to your daily work.
        </>
      );
    } else if (currentLayer === 2) {
      return 'Add Filter';
    } else if (currentLayer === 3 && configuringFilterDef) {
      return `Configure ${configuringFilterDef.label}`;
    }
    return '';
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentLayer === 3) {
      // Layer 3 → Layer 2
      setConfiguringFilterId(null);
      setConfiguringFilterDef(null);
      // Reset Layer 3 state
      setLayer3SearchQuery('');
      setLayer3SelectedValues([]);
      setLayer3Condition('is');
      setLayer3DisplaySelectedOnly(false);
      setCurrentLayer(2);
    } else if (currentLayer === 2) {
      // Layer 2 → Layer 1
      setFilterSearch('');
      setCurrentLayer(1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogDescription className="sr-only">
          {scope ? 'Edit scope' : 'Create a new scope with custom filters'}
        </DialogDescription>
        {/* Unified Guided Mode Header with Hero Section */}
        <div className="shrink-0">
          <div className="bg-gradient-to-br from-[#31C7AD]/10 via-[#31C7AD]/5 to-transparent px-6 py-3 border-b">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#31C7AD] to-[#2ab89a] shadow-lg shrink-0">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <DialogTitle className="text-2xl font-bold">
                  {modalTitle}
                </DialogTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full hover:bg-muted/50 p-1 transition-colors shrink-0"
                        aria-label="Information about scope"
                      >
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                      <TooltipContent className="max-w-sm bg-slate-950 text-slate-50 border border-slate-800 shadow-lg">
                        <p className="text-sm leading-relaxed">
                          {scope ? (
                            'Update scope details and filters'
                          ) : (
                            <>
                              A scope is your <strong className="text-slate-50">personal data perimeter</strong>. 
                              It filters what you see by default, showing only the plants, parts, or suppliers 
                              that are relevant to your daily work.
                            </>
                          )}
                        </p>
                      </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          
          {/* Step navigation bar for Layer 2 and 3 */}
          {(currentLayer === 2 || currentLayer === 3) && (
            <div className="px-6 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold text-foreground">
                  {currentLayer === 2 
                    ? 'Add Filter' 
                    : currentLayer === 3 && configuringFilterDef 
                      ? `Configure ${configuringFilterDef.label}` 
                      : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-4">
            {/* Back button for Layer 2 and 3 - displayed in header subtitle area */}
            {/* The back button is now handled in the subtitle area, not here */}

            {/* Layer 1: Form (Name, Description, Filters list) */}
            {currentLayer === 1 && (
              <>
                {/* Info Section */}
                {showScopeInfo && (
                  <div className="relative rounded-lg border border-[#31C7AD]/20 bg-gradient-to-r from-[#31C7AD]/5 via-[#31C7AD]/3 to-transparent p-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setShowScopeInfo(false)}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Close information"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-start gap-3 pr-6">
                      <div className="p-1.5 rounded-md bg-[#31C7AD]/10 shrink-0 mt-0.5">
                        <Info className="h-4 w-4 text-[#31C7AD]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-foreground">
                          {scope ? (
                            'Update scope details and filters'
                          ) : (
                            <>
                              A scope is your <strong className="text-foreground font-semibold">personal data perimeter</strong>. 
                              It filters what you see by default, showing only the plants, parts, or suppliers 
                              that are relevant to your daily work.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="scope-name" className="text-sm font-semibold">
                    Scope Name <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Give your scope a memorable name that clearly describes its purpose
                  </p>
                  <Input
                    id="scope-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g., "My Lyon Plant" or "Strategic Suppliers"'
                    className="h-10"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="scope-description" className="text-sm font-semibold">
                    Description
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Add details about what this scope covers and when to use it
                  </p>
                  <Textarea
                    id="scope-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='e.g., "All parts and suppliers for Lyon manufacturing plant"'
                    rows={3}
                  />
                </div>

                {/* Filters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-semibold">
                        Filters <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Define which data you want to see (plants, suppliers, part types, etc.)
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentLayer(2)}
                      className="shrink-0"
                    >
                      <X className="mr-2 h-4 w-4 rotate-45" />
                      Add Filter
                    </Button>
                  </div>
                  
                  {filters.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center bg-muted/20">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#31C7AD]/10 mb-3">
                        <Target className="h-6 w-6 text-[#31C7AD]" />
                      </div>
                      <p className="text-sm font-medium mb-1">No filters yet</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Start by adding filters to define your data perimeter
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setCurrentLayer(2)}
                        className="bg-[#31C7AD] hover:bg-[#2ab89a]"
                      >
                        <X className="mr-2 h-4 w-4 rotate-45" />
                        Add Your First Filter
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filters.map((filter) => {
                        const filterDef = getFilterDef(filter.filterId);
                        const getDisplayValue = (value: string | number): string => {
                          if (filterDef?.options) {
                            const option = filterDef.options.find((opt) => opt.value === value);
                            if (option) return option.label;
                          }
                          return String(value);
                        };
                        const displayValues = filter.values.map(getDisplayValue);

                        const handleRemoveValue = (value: string | number) => {
                          setFilters(
                            filters.map((f) =>
                              f.id === filter.id
                                ? { ...f, values: f.values.filter((v) => v !== value) }
                                : f
                            )
                          );
                        };

                        return (
                          <FilterChip
                            key={filter.id}
                            label={getFilterLabel(filter.filterId)}
                            values={filter.values}
                            displayValues={displayValues}
                            options={filterDef?.options?.map((opt) => ({ value: opt.value, label: opt.label }))}
                            maxVisible={3}
                            onEdit={() => {
                              // Edit existing filter: Layer 1 → Layer 3 directly
                              const filterDef = getFilterDef(filter.filterId);
                              if (filterDef) {
                                setConfiguringFilterId(filter.id);
                                setConfiguringFilterDef(filterDef);
                                // Initialize Layer 3 state with existing values
                                setLayer3SelectedValues(filter.values);
                                setLayer3Condition(filter.condition || (filterDef.type === 'number' ? 'equals' : filterDef.type === 'date' ? 'equals' : 'is'));
                                setLayer3SearchQuery('');
                                setLayer3DisplaySelectedOnly(false);
                                setCurrentLayer(3);
                              }
                            }}
                            onRemove={() => handleRemoveFilter(filter.id)}
                            onRemoveValue={handleRemoveValue}
                            showEditButton={true}
                            showRemoveButton={true}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Layer 2: Filter List */}
            {currentLayer === 2 && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <Suspense fallback={<div className="h-32 flex items-center justify-center">Loading...</div>}>
                  <AddFilterView
                    filterSearch={filterSearch}
                    onFilterSearchChange={setFilterSearch}
                    filteredFilterDefs={filteredFilterDefs}
                    groupedFilters={groupedFilters}
                    onSelectFilter={handleAddFilter}
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
                    onBack={handleBack}
                    onClose={handleBack}
                    hideHeader={true}
                  />
                </Suspense>
              </div>
            )}

            {/* Layer 3: Filter Detail - Inline content */}
            {currentLayer === 3 && configuringFilterId && configuringFilterDef && (() => {
              // Check if this is an existing filter or a new one
              const existingFilter = filters.find((f) => f.id === configuringFilterId);
              const isNewFilter = !existingFilter || configuringFilterId.startsWith('temp-');
              
              // Get options from filter definition
              const options = configuringFilterDef.options || [];

              // Determine column type from filter definition
              const columnType = configuringFilterDef.type === 'number' 
                ? 'number' 
                : configuringFilterDef.type === 'date' 
                ? 'date' 
                : 'text';

              // Get condition options based on column type
              const getConditionOptions = () => {
                if (columnType === 'number') {
                  return [
                    { value: 'equals', label: 'Equals' },
                    { value: 'notEquals', label: 'Not Equals' },
                    { value: 'greaterThan', label: 'Greater than' },
                    { value: 'lessThan', label: 'Less than' },
                    { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
                    { value: 'lessThanOrEqual', label: 'Less than or equal' },
                  ];
                }
                if (columnType === 'date') {
                  return [
                    { value: 'equals', label: 'Equals' },
                    { value: 'before', label: 'Before' },
                    { value: 'after', label: 'After' },
                    { value: 'between', label: 'Between' },
                  ];
                }
                // Text type
                return [
                  { value: 'is', label: 'Is' },
                  { value: 'isNot', label: 'Is Not' },
                  { value: 'contains', label: 'Contains' },
                  { value: 'doesNotContain', label: 'Does Not Contain' },
                ];
              };

              const conditionOptions = getConditionOptions();

              // Display limited results (using the memoized filtered options from component level)
              const maxDisplayResults = 50;
              const displayedOptions = layer3FilteredOptions.slice(0, maxDisplayResults);
              const totalResults = layer3FilteredOptions.length;
              const hasMoreResults = layer3FilteredOptions.length > maxDisplayResults;
              const selectedCount = layer3SelectedValues.length;

              // Toggle selection
              const toggleValue = (value: string | number) => {
                setLayer3SelectedValues((prev) =>
                  prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
                );
              };

              // Select all visible
              const selectAllVisible = () => {
                const visibleValues = displayedOptions.map((opt) => opt.value);
                setLayer3SelectedValues((prev) => {
                  const newValues = [...prev];
                  visibleValues.forEach((val) => {
                    if (!newValues.includes(val)) {
                      newValues.push(val);
                    }
                  });
                  return newValues;
                });
              };

              // Deselect all visible
              const deselectAllVisible = () => {
                const visibleValues = displayedOptions.map((opt) => opt.value);
                setLayer3SelectedValues((prev) => prev.filter((val) => !visibleValues.includes(val)));
              };

              // Note: handleApplyFilter is defined in the footer section below

              return (
                <div className="flex flex-col h-full min-h-0">
                  {/* Filter Controls */}
                  <div className="px-6 py-4 border-b border-border/50 space-y-4 shrink-0 bg-muted/10">
                    {/* Top row: Condition and Display Selected Only */}
                    <div className="flex items-center justify-between gap-4">
                      <Select value={layer3Condition} onValueChange={(value) => setLayer3Condition(value)}>
                        <SelectTrigger className="w-[200px] h-10 border-border/60 hover:border-[#2063F0]/30 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-background hover:border-[#31C7AD]/30 transition-colors h-10">
                        <Checkbox
                          id="display-selected-only"
                          checked={layer3DisplaySelectedOnly}
                          disabled={selectedCount === 0}
                          onCheckedChange={(checked) => setLayer3DisplaySelectedOnly(checked === true)}
                          className="data-[state=checked]:bg-[#31C7AD] data-[state=checked]:border-[#31C7AD]"
                        />
                        <label
                          htmlFor="display-selected-only"
                          className={`text-sm select-none font-medium ${
                            selectedCount === 0
                              ? 'text-muted-foreground cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          Display Selected only
                        </label>
                        {selectedCount > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#31C7AD]/10 text-[#31C7AD] border border-[#31C7AD]/20">
                            {selectedCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search values..."
                        value={layer3SearchQuery}
                        onChange={(e) => setLayer3SearchQuery(e.target.value)}
                        className="pl-10 h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="px-6 py-4 space-y-2">
                      {displayedOptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border/60 bg-muted/20">
                          <div className="p-3 rounded-full bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 mb-3">
                            <Search className="h-6 w-6 text-[#2063F0]/60" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">No results found</p>
                          <p className="text-xs text-muted-foreground/70">Try adjusting your search</p>
                        </div>
                      ) : (
                        <>
                          {/* Select All / Deselect All */}
                          {displayedOptions.length > 0 && (
                            <div className="flex items-center gap-2 pb-3 mb-2 border-b border-border/60">
                              <Checkbox
                                checked={displayedOptions.every((opt) => layer3SelectedValues.includes(opt.value))}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    selectAllVisible();
                                  } else {
                                    deselectAllVisible();
                                  }
                                }}
                                className="data-[state=checked]:bg-[#31C7AD] data-[state=checked]:border-[#31C7AD]"
                              />
                              <span className="text-sm font-semibold text-muted-foreground">
                                {displayedOptions.every((opt) => layer3SelectedValues.includes(opt.value))
                                  ? 'Deselect all'
                                  : 'Select all'}
                              </span>
                            </div>
                          )}

                          {/* Options */}
                          {displayedOptions.map((option) => {
                            const isChecked = layer3SelectedValues.includes(option.value);
                            return (
                              <div
                                key={option.value}
                                className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all hover:bg-muted/50 ${
                                  isChecked ? 'bg-[#31C7AD]/5 border border-[#31C7AD]/20' : ''
                                }`}
                              >
                                <Checkbox
                                  id={`filter-${option.value}`}
                                  checked={isChecked}
                                  onCheckedChange={() => toggleValue(option.value)}
                                  className="data-[state=checked]:bg-[#31C7AD] data-[state=checked]:border-[#31C7AD]"
                                />
                                <label
                                  htmlFor={`filter-${option.value}`}
                                  className="text-sm cursor-pointer select-none flex-1 font-medium"
                                >
                                  {option.label}
                                </label>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Info Message */}
                  {hasMoreResults && (
                    <div className="px-6 py-4 border-t border-border/50 shrink-0 bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 shrink-0">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-blue-900 dark:text-blue-300">
                            Showing <span className="font-semibold">{maxDisplayResults}</span> of{' '}
                            <span className="font-semibold">{totalResults}</span> results
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                            Refine your search to find more entries
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </ScrollArea>

        {/* Footer - Layer 1: Save scope, Layer 3: Apply/Cancel filter */}
        {currentLayer === 1 && (
          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-muted/20">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#2063F0] hover:bg-[#1a54d8]">
              {saveButtonText || (scope ? 'Update' : 'Create') + ' Scope'}
            </Button>
          </DialogFooter>
        )}
        {currentLayer === 3 && configuringFilterId && configuringFilterDef && (() => {
          const handleApplyFilter = () => {
            if (layer3SelectedValues.length === 0) {
              handleBack();
              return;
            }

            const existingFilter = filters.find((f) => f.id === configuringFilterId);
            const isNewFilter = !existingFilter || configuringFilterId.startsWith('temp-');

            if (isNewFilter) {
              const newFilter: ScopeFilter = {
                id: `filter-${Date.now()}`,
                filterId: configuringFilterDef.id,
                values: layer3SelectedValues,
                condition: layer3Condition !== 'is' ? layer3Condition : undefined,
              };
              setFilters([...filters, newFilter]);
              showToast({
                variant: 'success',
                title: 'Filter added',
                description: `Great! You've added "${configuringFilterDef.label}" filter`,
                duration: 5000,
              });
            } else {
              setFilters(
                filters.map((f) =>
                  f.id === configuringFilterId
                    ? {
                        ...f,
                        values: layer3SelectedValues,
                        condition: layer3Condition !== 'is' ? layer3Condition : undefined,
                      }
                    : f
                )
              );
              showToast({
                variant: 'success',
                title: 'Filter updated',
                description: `"${configuringFilterDef.label}" filter has been updated`,
                duration: 5000,
              });
            }
            
            setConfiguringFilterId(null);
            setConfiguringFilterDef(null);
            setCurrentLayer(1);
          };

          return (
            <DialogFooter className="px-6 py-4 border-t shrink-0 bg-muted/20 gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-border/60 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApplyFilter}
                className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md"
              >
                Apply
              </Button>
            </DialogFooter>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
};

