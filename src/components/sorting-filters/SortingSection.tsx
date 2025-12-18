/**
 * Sorting Section Component
 * Displays and manages sorting configuration in the modal
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Info, X } from 'lucide-react';
import { SortRow } from './SortRow';
import type { SortConfig } from '../SortingAndFiltersPopover';

interface SortingSectionProps {
  draftSorting: SortConfig[];
  sortableColumns: { id: string; label: string }[];
  dismissedTip: boolean;
  onDismissTip: () => void;
  onAddSort: () => void;
  onUpdateSort: (sortId: string, updates: Partial<SortConfig>) => void;
  onRemoveSort: (sortId: string) => void;
  onReorderSort: (fromIndex: number, toIndex: number) => void;
}

export const SortingSection: React.FC<SortingSectionProps> = ({
  draftSorting,
  sortableColumns,
  dismissedTip,
  onDismissTip,
  onAddSort,
  onUpdateSort,
  onRemoveSort,
  onReorderSort,
}) => {
  return (
    <AccordionItem value="sorting" className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">CURRENT SORTING</span>
          {draftSorting.length > 0 && (
            <Badge className="h-5 px-1.5 text-xs text-white ml-1" style={{ backgroundColor: '#31C7AD' }}>
              {draftSorting.length}
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Tip: Shift + click to multi-sort</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4">
        {!dismissedTip && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              Tip: Shift + click to multi-sort
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              onClick={onDismissTip}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {draftSorting.length === 0 ? (
          <div className="border-2 border-dashed rounded-md p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">No sorting yet</p>
            <Button variant="default" size="sm" onClick={onAddSort} className="gap-2">
              <Plus className="h-4 w-4" />
              Add sort
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={onAddSort} className="gap-2">
              <Plus className="h-4 w-4" />
              Add sort
            </Button>
            <div className="space-y-2 max-w-full">
              {draftSorting.map((sort, index) => (
                <SortRow
                  key={sort.id}
                  sort={sort}
                  index={index}
                  sortableColumns={sortableColumns}
                  onUpdate={onUpdateSort}
                  onRemove={onRemoveSort}
                  onReorder={onReorderSort}
                />
              ))}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

