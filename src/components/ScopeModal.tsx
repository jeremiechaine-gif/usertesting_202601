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
import { X, Target, CheckCircle2 } from 'lucide-react';
import { createScope, updateScope, type Scope, type ScopeFilter } from '@/lib/scopes';
import { validateScope } from '@/lib/validation/scopeValidation';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { getColumnIdFromFilterId } from './sorting-filters/utils';
// Lazy load heavy components to reduce bundle size
const AddFilterView = lazy(() => import('./SortingAndFiltersPopover').then(m => ({ default: m.AddFilterView })));
const ColumnFilterModal = lazy(() => import('./ColumnFilterModal').then(m => ({ default: m.ColumnFilterModal })));

interface ScopeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope?: Scope | null;
  onSave: () => void;
  mode?: 'guided' | 'normal'; // Guided mode shows helpful tips and examples
}

export const ScopeModal: React.FC<ScopeModalProps> = ({
  open,
  onOpenChange,
  scope,
  onSave,
  mode = 'normal',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState<ScopeFilter[]>([]);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [configuringFilterId, setConfiguringFilterId] = useState<string | null>(null); // ID du filtre en cours de configuration (nouveau ou existant)
  const [configuringFilterDef, setConfiguringFilterDef] = useState<typeof filterDefinitions[0] | null>(null); // Définition du filtre en cours de configuration
  // Session-only favorites state
  const [sessionFavorites, setSessionFavorites] = useState<Set<string>>(
    new Set(filterDefinitions.filter(f => f.isFavorite).map(f => f.id))
  );

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
    setShowAddFilter(false);
    setFilterSearch('');
    setEditingFilterId(null);
    setConfiguringFilterId(null);
    setConfiguringFilterDef(null);
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
      if (scope) {
        updateScope(scope.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          filters,
        });
      } else {
        createScope({
          name: name.trim(),
          description: description.trim() || undefined,
          filters,
        });
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
    } else {
      // New filter - create temporary ID
      const tempId = `temp-${Date.now()}`;
      setConfiguringFilterId(tempId);
      setConfiguringFilterDef(filterDef);
    }
    
    // Keep AddFilterView open in background (user can navigate back)
    // Don't close showAddFilter here - let user navigate back
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
      // If exists, open configuration modal
      const existingFilter = filters.find(f => f.filterId === filterDef.id);
      if (existingFilter) {
        setConfiguringFilterId(existingFilter.id);
        setConfiguringFilterDef(filterDef);
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
    setShowAddFilter(false);
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

  const isGuidedMode = mode === 'guided' && !scope;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
        {isGuidedMode ? (
          // Guided Mode Header with Hero Section
          <div className="shrink-0">
            <div className="bg-gradient-to-br from-[#31C7AD]/10 via-[#31C7AD]/5 to-transparent px-6 pt-6 pb-4 border-b">
              <div className="flex items-start gap-4 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#31C7AD] to-[#2ab89a] shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold mb-2">Define Your Scope</DialogTitle>
                  <DialogDescription className="text-base leading-relaxed">
                    A scope is your <strong className="text-foreground">personal data perimeter</strong>. 
                    It filters what you see by default, showing only the plants, parts, or suppliers 
                    that are relevant to your daily work.
                  </DialogDescription>
                  {/* Sections removed: Quick Benefits and Naming Tips */}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Normal Mode Header
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>{scope ? 'Edit Scope' : 'Create New Scope'}</DialogTitle>
            <DialogDescription>
              {scope ? 'Update scope details and filters' : 'Define a new scope with filters'}
            </DialogDescription>
          </DialogHeader>
        )}

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="scope-name" className="text-sm font-semibold">
                Scope Name <span className="text-destructive">*</span>
              </Label>
              {isGuidedMode && (
                <p className="text-xs text-muted-foreground mb-2">
                  Give your scope a memorable name that clearly describes its purpose
                </p>
              )}
              <Input
                id="scope-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isGuidedMode ? 'e.g., "My Lyon Plant" or "Strategic Suppliers"' : 'Enter scope name'}
                className="h-10"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="scope-description" className="text-sm font-semibold">
                Description {!isGuidedMode && '(optional)'}
              </Label>
              {isGuidedMode && (
                <p className="text-xs text-muted-foreground mb-2">
                  Add details about what this scope covers and when to use it
                </p>
              )}
              <Textarea
                id="scope-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isGuidedMode ? 'e.g., "All parts and suppliers for Lyon manufacturing plant"' : 'Enter scope description'}
                rows={3}
              />
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Filters</Label>
                  {isGuidedMode && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Define which data you want to see (plants, suppliers, part types, etc.)
                    </p>
                  )}
                </div>
                {!showAddFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddFilter(true)}
                    className="shrink-0"
                  >
                    <X className="mr-2 h-4 w-4 rotate-45" />
                    Add Filter
                  </Button>
                )}
              </div>
              
              {isGuidedMode && filters.length === 0 && !showAddFilter && (
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
                    onClick={() => setShowAddFilter(true)}
                    className="bg-[#31C7AD] hover:bg-[#2ab89a]"
                  >
                    <X className="mr-2 h-4 w-4 rotate-45" />
                    Add Your First Filter
                  </Button>
                </div>
              )}

              {showAddFilter ? (
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
                      onBack={() => {
                        setShowAddFilter(false);
                        setFilterSearch('');
                      }}
                      onClose={() => {
                        setShowAddFilter(false);
                        setFilterSearch('');
                      }}
                    />
                  </Suspense>
                </div>
              ) : (
                <div className="space-y-2">
                  {!isGuidedMode && filters.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                      No filters added yet
                    </div>
                  ) : filters.length > 0 ? (
                    filters.map((filter) => {
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
                          onEdit={() => setEditingFilterId(filter.id)}
                          onRemove={() => handleRemoveFilter(filter.id)}
                          onRemoveValue={handleRemoveValue}
                          showEditButton={true}
                          showRemoveButton={true}
                        />
                      );
                    })
                  ) : null}
                </div>
              )}
            </div>
            
            {isGuidedMode && filters.length > 0 && (
              <div className="rounded-lg border bg-green-50/50 dark:bg-green-950/20 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-300">
                      Great! You've added {filters.length} filter{filters.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      These filters will be automatically applied whenever you use this scope
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#2063F0] hover:bg-[#1a54d8]">
            {scope ? 'Update' : 'Create'} Scope
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Filter Value Selection Modal - For editing existing filters */}
      {editingFilterId && !configuringFilterId && (() => {
        const editingFilter = filters.find((f) => f.id === editingFilterId);
        if (!editingFilter) return null;
        const editingFilterDef = getFilterDef(editingFilter.filterId);
        if (!editingFilterDef) return null;

        // Get column ID from filter ID
        const columnId = getColumnIdFromFilterId(editingFilter.filterId) || editingFilter.filterId;
        
        // Get options from filter definition
        const options = editingFilterDef.options || [];

        // Determine column type from filter definition
        const columnType = editingFilterDef.type === 'number' 
          ? 'number' 
          : editingFilterDef.type === 'date' 
          ? 'date' 
          : 'text';

        return (
          <Suspense fallback={null}>
            <ColumnFilterModal
              open={!!editingFilterId}
              onOpenChange={(open) => {
                if (!open) setEditingFilterId(null);
              }}
              columnId={columnId}
              columnLabel={editingFilterDef.label}
              category={editingFilterDef.category || 'General'}
              columnType={columnType}
              options={options}
              selectedValues={editingFilter.values}
              condition={editingFilter.condition || 'is'}
              onApply={(values: (string | number)[], condition: string) => {
                if (values.length === 0) {
                  // Empty values = cancel
                  setEditingFilterId(null);
                  return;
                }
                setFilters(
                  filters.map((f) =>
                    f.id === editingFilterId
                      ? {
                          ...f,
                          values,
                          condition: condition !== 'is' ? condition : undefined,
                        }
                      : f
                  )
                );
                setEditingFilterId(null);
              }}
            />
          </Suspense>
        );
      })()}

      {/* Filter Configuration Modal - For adding/editing filters from AddFilterView */}
      {configuringFilterId && configuringFilterDef && (() => {
        // Check if this is an existing filter or a new one
        const existingFilter = filters.find((f) => f.id === configuringFilterId);
        const isNewFilter = !existingFilter || configuringFilterId.startsWith('temp-');
        
        // Get column ID from filter ID
        const columnId = getColumnIdFromFilterId(configuringFilterDef.id) || configuringFilterDef.id;
        
        // Get options from filter definition
        const options = configuringFilterDef.options || [];

        // Determine column type from filter definition
        const columnType = configuringFilterDef.type === 'number' 
          ? 'number' 
          : configuringFilterDef.type === 'date' 
          ? 'date' 
          : 'text';

        // Get selected values (existing filter or empty for new)
        const selectedValues = existingFilter ? existingFilter.values : [];

        return (
          <Suspense fallback={null}>
            <ColumnFilterModal
              open={!!configuringFilterId}
              onOpenChange={(open) => {
                if (!open) {
                  // Cancel - revert to previous state
                  setConfiguringFilterId(null);
                  setConfiguringFilterDef(null);
                }
              }}
              columnId={columnId}
              columnLabel={configuringFilterDef.label}
              category={configuringFilterDef.category || 'General'}
              columnType={columnType}
              options={options}
              selectedValues={selectedValues}
              condition={existingFilter?.condition || 'is'}
              onApply={(values: (string | number)[], condition: string) => {
                if (values.length === 0) {
                  // Empty values = cancel
                  setConfiguringFilterId(null);
                  setConfiguringFilterDef(null);
                  return;
                }

                if (isNewFilter) {
                  // Add new filter
                  const newFilter: ScopeFilter = {
                    id: `filter-${Date.now()}`,
                    filterId: configuringFilterDef.id,
                    values,
                    condition: condition !== 'is' ? condition : undefined,
                  };
                  setFilters([...filters, newFilter]);
                } else {
                  // Update existing filter
                  setFilters(
                    filters.map((f) =>
                      f.id === configuringFilterId
                        ? {
                            ...f,
                            values,
                            condition: condition !== 'is' ? condition : undefined,
                          }
                        : f
                    )
                  );
                }
                
                // Close modal and return to AddFilterView (user can add more filters or go back)
                setConfiguringFilterId(null);
                setConfiguringFilterDef(null);
              }}
            />
          </Suspense>
        );
      })()}
    </Dialog>
  );
};

