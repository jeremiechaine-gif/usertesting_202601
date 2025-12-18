/**
 * Sort Chip Component
 * Reusable component for displaying sort chips
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortChipProps {
  label: string;
  direction: 'asc' | 'desc';
  position?: number; // Sort position (1, 2, 3...)
  onToggleDirection?: () => void;
  onRemove?: () => void;
  showDragHandle?: boolean;
  showPosition?: boolean;
  className?: string;
}

export const SortChip: React.FC<SortChipProps> = ({
  label,
  direction,
  position,
  onToggleDirection,
  onRemove,
  showDragHandle = false,
  showPosition = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md bg-muted/50',
        className
      )}
    >
      {/* Drag handle */}
      {showDragHandle && (
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Position badge */}
      {showPosition && position !== undefined && (
        <div className="flex flex-col items-center justify-center h-6 w-6 rounded bg-[#ADE9DE] shrink-0">
          <div className="h-3.5 w-3.5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-gray-800">
            {position}
          </div>
        </div>
      )}

      {/* Column selector or label */}
      {label && <span className="text-sm font-medium shrink-0 flex-1 min-w-0 truncate">{label}</span>}

      {/* Direction toggle */}
      {onToggleDirection && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 px-2 gap-1 shrink-0',
            direction === 'asc' || direction === 'desc'
              ? 'text-[#31C7AD] hover:text-[#31C7AD]'
              : ''
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDirection();
          }}
        >
          {direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )}
        </Button>
      )}

      {/* Remove button */}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

