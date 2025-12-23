/**
 * Scope Filters Section Component
 * Displays scope filters (read-only) in the Sorting and Filters modal
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Target, Lock, Info } from 'lucide-react';
import type { FilterDefinition } from '../SortingAndFiltersPopover';
import { getFilterDisplayValues } from './utils';
import { getColumnLabel } from './utils';
import type { ScopeFilter } from '@/lib/scopes';
import { filterDefinitions } from '@/lib/filterDefinitions';

interface ScopeFiltersSectionProps {
  scopeFilters: ScopeFilter[];
  filterDefinitions: FilterDefinition[];
  columns: any[];
  currentScopeName?: string;
}

export const ScopeFiltersSection: React.FC<ScopeFiltersSectionProps> = ({
  scopeFilters,
  filterDefinitions: _filterDefinitions, // Not used but kept for consistency
  columns,
  currentScopeName,
}) => {
  // Filter out filters with empty values
  const validFilters = scopeFilters.filter((filter) => filter.values && filter.values.length > 0);
  
  if (validFilters.length === 0) {
    return null;
  }

  const getFilterDef = (filterId: string): FilterDefinition | undefined => {
    return filterDefinitions.find((f) => f.id === filterId);
  };

  return (
    <AccordionItem value="scope-filters" className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-gradient-to-br from-[#31C7AD]/10 to-[#2063F0]/10">
            <Target className="h-3.5 w-3.5 text-[#31C7AD]" />
          </div>
          <span className="text-sm font-medium">SCOPE FILTERS</span>
          {validFilters.length > 0 && (
            <Badge className="h-5 px-1.5 text-xs text-white ml-1" style={{ backgroundColor: '#31C7AD' }}>
              {validFilters.length}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-3 pb-4 min-w-0">
        {/* Scope Info Banner */}
        {currentScopeName && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-[#31C7AD]/5 via-[#31C7AD]/3 to-transparent border border-[#31C7AD]/20">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#31C7AD]/10">
                <Target className="h-3 w-3 text-[#31C7AD]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground mb-0.5">Active Scope</p>
                <p className="text-sm font-semibold text-foreground truncate">{currentScopeName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters List */}
        <div className="space-y-2.5 w-full min-w-0 overflow-hidden">
          {validFilters.map((filter) => {
            const filterDef = getFilterDef(filter.filterId);
            const displayValues = getFilterDisplayValues(filter, filterDef);
            const columnLabel = getColumnLabel(filter.filterId, columns);
            
            return (
              <div
                key={filter.id}
                className="group relative rounded-lg border border-[#31C7AD]/20 bg-gradient-to-r from-[#31C7AD]/5 via-transparent to-transparent p-3.5 transition-all hover:border-[#31C7AD]/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Lock Icon */}
                  <div className="p-1.5 rounded-md bg-[#31C7AD]/10 shrink-0 mt-0.5">
                    <Lock className="h-3.5 w-3.5 text-[#31C7AD]" />
                  </div>
                  
                  {/* Filter Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {columnLabel}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="h-5 px-1.5 text-xs font-medium border-[#31C7AD]/40 text-[#31C7AD] bg-[#31C7AD]/5"
                      >
                        Scope
                      </Badge>
                    </div>
                    
                    {/* Filter Values */}
                    {displayValues.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {displayValues.map((value, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-background border border-border/60 text-foreground"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No values selected</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Message */}
        <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-muted">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Scope filters</span> are applied automatically to all views and cannot be modified here. To change them, edit your scope settings.
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

