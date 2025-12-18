/**
 * Filter Chip Component
 * Reusable component for displaying filter chips with inline editing
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChipOption {
  value: string | number;
  label: string;
}

export interface FilterChipProps {
  label: string;
  values: (string | number)[];
  displayValues?: string[]; // Optional display labels for values
  options?: FilterChipOption[]; // Options for inline editing
  maxVisible?: number; // Max badges to show before "+X"
  onEdit?: () => void;
  onRemove?: () => void;
  onRemoveValue?: (value: string | number) => void; // Remove individual value
  onUpdateValues?: (values: (string | number)[]) => void; // For inline editing
  showEditButton?: boolean;
  showRemoveButton?: boolean;
  enableInlineEdit?: boolean; // Enable inline editing mode
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  values,
  displayValues,
  options,
  maxVisible = 2,
  onEdit,
  onRemove,
  onRemoveValue,
  onUpdateValues,
  showEditButton = true,
  showRemoveButton = true,
  enableInlineEdit = false,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>(values);

  // Sync selectedValues when values prop changes
  React.useEffect(() => {
    setSelectedValues(values);
  }, [values]);

  const visibleValues = values.slice(0, maxVisible);
  const remainingCount = values.length - maxVisible;

  // Use displayValues if provided, otherwise convert values to strings
  const getDisplayValue = (value: string | number, index: number): string => {
    if (displayValues && displayValues[index] !== undefined) {
      return displayValues[index];
    }
    // Try to find label from options
    if (options) {
      const option = options.find((opt) => opt.value === value);
      if (option) return option.label;
    }
    return String(value);
  };

  const handleSaveValues = () => {
    if (onUpdateValues) {
      onUpdateValues(selectedValues);
    }
    setIsEditing(false);
  };

  const handleToggleValue = (value: string | number) => {
    // For single-select filters, replace the value
    const isSingleSelect = options && options.length > 0 && options.some((opt) => opt.value === value);
    if (isSingleSelect && options?.some((opt) => opt.value === value)) {
      setSelectedValues([value]);
    } else {
      setSelectedValues((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    }
  };

  // Inline editing mode
  if (enableInlineEdit && isEditing && options && options.length > 0) {
    return (
      <div
        className={cn(
          'flex flex-col gap-2 p-2 rounded-md bg-muted/50',
          className
        )}
      >
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <Badge
                  key={option.value}
                  variant={isSelected ? 'default' : 'outline'}
                  className="text-xs cursor-pointer"
                  onClick={() => handleToggleValue(option.value)}
                >
                  {option.label}
                </Badge>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveValues}>
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedValues(values);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md bg-muted/50',
        className
      )}
    >
      {/* Label */}
      <span className="text-sm font-medium shrink-0">{label}:</span>

      {/* Values badges */}
      <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
        {visibleValues.map((value, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className="text-xs flex items-center gap-1 pr-1"
          >
            <span>{getDisplayValue(value, idx)}</span>
            {onRemoveValue && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveValue(value);
                }}
                className="hover:bg-secondary rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${getDisplayValue(value, idx)}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{remainingCount}
          </Badge>
        )}
        {values.length === 0 && (
          <span className="text-xs text-muted-foreground">No values selected</span>
        )}
        {enableInlineEdit && options && options.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-xs px-2"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {showEditButton && onEdit && !enableInlineEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-xs px-2 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Edit
          </Button>
        )}
        {showRemoveButton && onRemove && (
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
    </div>
  );
};

