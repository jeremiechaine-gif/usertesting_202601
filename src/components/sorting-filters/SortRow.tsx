/**
 * Sort Row Component
 * Individual sort configuration row in the sorting section
 */

import React, { useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortChip } from '@/components/ui/sort-chip';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortConfig } from '../SortingAndFiltersPopover';

interface SortRowProps {
  sort: SortConfig;
  index: number;
  sortableColumns: { id: string; label: string }[];
  onUpdate: (sortId: string, updates: Partial<SortConfig>) => void;
  onRemove: (sortId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  isNotInRoutine?: boolean; // Highlight orange if not in routine
}

const SortRowComponent: React.FC<SortRowProps> = ({
  sort,
  index,
  sortableColumns,
  onUpdate,
  onRemove,
  isNotInRoutine = false,
}) => {
  const handleColumnChange = useCallback(
    (value: string) => {
      onUpdate(sort.id, { columnId: value });
    },
    [sort.id, onUpdate]
  );

  const handleToggleDirection = useCallback(() => {
    onUpdate(sort.id, { direction: sort.direction === 'asc' ? 'desc' : 'asc' });
  }, [sort.id, sort.direction, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(sort.id);
  }, [sort.id, onRemove]);

  return (
    <div className={cn(
      "flex items-center gap-2 min-w-0 w-full p-2 rounded-md transition-colors",
      isNotInRoutine && "bg-[#ff9800]/10 ring-1 ring-[#ff9800]"
    )}>
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Select value={sort.columnId} onValueChange={handleColumnChange}>
        <SelectTrigger className="flex-1 h-8 min-w-0 max-w-[200px]">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent>
          {sortableColumns.map((col) => (
            <SelectItem key={col.id} value={col.id}>
              {col.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SortChip
        label=""
        direction={sort.direction}
        position={index + 1}
        showPosition={true}
        showDragHandle={false}
        onToggleDirection={handleToggleDirection}
        onRemove={handleRemove}
        className={cn("shrink-0", isNotInRoutine && "ring-1 ring-[#ff9800] bg-[#ff9800]/20")}
      />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when parent re-renders
export const SortRow = React.memo(SortRowComponent);

