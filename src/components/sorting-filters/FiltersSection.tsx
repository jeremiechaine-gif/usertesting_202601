/**
 * Filters Section Component
 * Displays and manages filter configuration in the modal
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus } from 'lucide-react';
import { FilterRow } from './FilterRow';
import type { FilterConfig, FilterDefinition } from '../SortingAndFiltersPopover';
import { getFilterDisplayValues, getColumnIdFromFilterId } from './utils';
import { getColumnLabel } from './utils';

interface FiltersSectionProps {
  draftFilters: FilterConfig[];
  filterDefinitions: FilterDefinition[];
  columns: any[];
  onAddFilter: () => void;
  onUpdateFilterValues: (filterId: string, values: (string | number)[]) => void;
  onRemoveFilter: (filterId: string) => void;
  onOpenFilterModal?: (columnId: string) => void;
}

export const FiltersSection: React.FC<FiltersSectionProps> = ({
  draftFilters,
  filterDefinitions,
  columns,
  onAddFilter,
  onUpdateFilterValues,
  onRemoveFilter,
  onOpenFilterModal,
}) => {
  const getFilterDef = (filterId: string) => {
    return filterDefinitions.find((f) => f.id === filterId);
  };

  return (
    <AccordionItem value="filters" className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">CURRENT FILTERS</span>
          {draftFilters.length > 0 && (
            <Badge className="h-5 px-1.5 text-xs text-white ml-1" style={{ backgroundColor: '#31C7AD' }}>
              {draftFilters.length}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4">
        {draftFilters.length === 0 ? (
          <div className="border-2 border-dashed rounded-md p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">No filter yet</p>
            <Button variant="default" size="sm" onClick={onAddFilter} className="gap-2">
              <Plus className="h-4 w-4" />
              Add filter
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button variant="default" size="sm" onClick={onAddFilter} className="gap-2">
              <Plus className="h-4 w-4" />
              Add filter
            </Button>
            <div className="space-y-2 max-w-full">
              {draftFilters.map((filter) => {
                const filterDef = getFilterDef(filter.filterId);
                return (
                  <FilterRow
                    key={filter.id}
                    filter={filter}
                    columnLabel={getColumnLabel(filter.filterId, columns)}
                    filterDef={filterDef}
                    displayValues={getFilterDisplayValues(filter, filterDef)}
                    onUpdateValues={onUpdateFilterValues}
                    onRemove={onRemoveFilter}
                    onOpenFilterModal={onOpenFilterModal}
                    getColumnIdFromFilterId={getColumnIdFromFilterId}
                  />
                );
              })}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

