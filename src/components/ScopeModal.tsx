/**
 * Scope Modal Component
 * Create or edit a scope with name, description, and filters
 */

import React, { useState, useEffect } from 'react';
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
import { X } from 'lucide-react';
import { createScope, updateScope, type Scope, type ScopeFilter } from '@/lib/scopes';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { AddFilterView } from './SortingAndFiltersPopover';
import { ColumnFilterModal } from './ColumnFilterModal';

interface ScopeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope?: Scope | null;
  onSave: () => void;
}

export const ScopeModal: React.FC<ScopeModalProps> = ({
  open,
  onOpenChange,
  scope,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState<ScopeFilter[]>([]);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);

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
  }, [scope, open]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Scope name is required');
      return;
    }

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
  };

  const handleAddFilter = (filterDef: typeof filterDefinitions[0]) => {
    // Check if filter already exists
    if (filters.some((f) => f.filterId === filterDef.id)) {
      return;
    }

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

  // Group filters for AddFilterView - same structure as in SortingAndFiltersPopover
  const groupedFilters: {
    favorites: typeof filterDefinitions;
    general: typeof filterDefinitions;
    consumedParts: typeof filterDefinitions;
    producedParts: typeof filterDefinitions;
  } = {
    favorites: filterDefinitions.filter((def) => def.isFavorite),
    general: filterDefinitions.filter((def) => !def.isFavorite && (!def.category || def.category === 'general')),
    consumedParts: filterDefinitions.filter((def) => def.category === 'consumed-parts'),
    producedParts: filterDefinitions.filter((def) => def.category === 'produced-parts'),
  };

  const filteredFilterDefs = filterDefinitions.filter((def) =>
    def.label.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{scope ? 'Edit Scope' : 'Create New Scope'}</DialogTitle>
          <DialogDescription>
            {scope ? 'Update scope details and filters' : 'Define a new scope with filters'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="scope-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="scope-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter scope name"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="scope-description">Description (optional)</Label>
              <Textarea
                id="scope-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter scope description"
                rows={3}
              />
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Filters</Label>
                {!showAddFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddFilter(true)}
                  >
                    <X className="mr-2 h-4 w-4 rotate-45" />
                    Add Filter
                  </Button>
                )}
              </div>

              {showAddFilter ? (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <AddFilterView
                    filterSearch={filterSearch}
                    onFilterSearchChange={setFilterSearch}
                    filteredFilterDefs={filteredFilterDefs}
                    groupedFilters={groupedFilters}
                    onSelectFilter={handleAddFilter}
                    onBack={() => {
                      setShowAddFilter(false);
                      setFilterSearch('');
                    }}
                    onClose={() => {
                      setShowAddFilter(false);
                      setFilterSearch('');
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {filters.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                      No filters added yet
                    </div>
                  ) : (
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
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#2063F0] hover:bg-[#1a54d8]">
            {scope ? 'Update' : 'Create'} Scope
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Filter Value Selection Modal */}
      {editingFilterId && (() => {
        const editingFilter = filters.find((f) => f.id === editingFilterId);
        if (!editingFilter) return null;
        const editingFilterDef = getFilterDef(editingFilter.filterId);
        if (!editingFilterDef) return null;

        // Get column ID from filter ID (assuming filter ID matches column ID)
        const columnId = editingFilter.filterId;
        
        // Get options from filter definition
        const options = editingFilterDef.options || [];

        // Determine column type from filter definition
        const columnType = editingFilterDef.type === 'number' 
          ? 'number' 
          : editingFilterDef.type === 'date' 
          ? 'date' 
          : 'text';

        return (
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
        );
      })()}
    </Dialog>
  );
};

