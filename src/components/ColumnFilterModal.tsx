/**
 * Column Filter Modal Component
 * Modal for filtering column values with multi-select checkboxes
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Info } from 'lucide-react';

type ColumnType = 'text' | 'number' | 'date';

interface ColumnFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  columnLabel: string;
  category?: string; // e.g., "Consumed Parts", "Produced Parts"
  columnType?: ColumnType; // Auto-detected if not provided
  options: Array<{ label: string; value: string | number }>;
  selectedValues: (string | number)[];
  condition?: string;
  onApply: (values: (string | number)[], condition: string) => void;
  maxDisplayResults?: number; // Default 50
}

export const ColumnFilterModal: React.FC<ColumnFilterModalProps> = ({
  open,
  onOpenChange,
  columnLabel,
  category,
  columnType: propColumnType,
  options,
  selectedValues: initialSelectedValues,
  condition: initialCondition,
  onApply,
  maxDisplayResults = 50,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>(initialSelectedValues);
  const [displaySelectedOnly, setDisplaySelectedOnly] = useState(false);
  
  // Detect column type
  const columnType: ColumnType = propColumnType || (() => {
    if (options.length === 0) return 'text';
    const firstValue = options[0].value;
    if (typeof firstValue === 'number') return 'number';
    // Check if it's a date string (basic heuristic)
    if (typeof firstValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(firstValue)) return 'date';
    return 'text';
  })();

  // Set default condition based on type
  const getDefaultCondition = (): string => {
    if (columnType === 'number') return 'equals';
    if (columnType === 'date') return 'equals';
    return 'is';
  };

  const [condition, setCondition] = useState<string>(initialCondition || getDefaultCondition());

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

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedValues(initialSelectedValues);
      setCondition(initialCondition || getDefaultCondition());
      setSearchQuery('');
      setDisplaySelectedOnly(false);
    }
  }, [open, initialSelectedValues, initialCondition]);

  // Filter options based on search and displaySelectedOnly
  const filteredOptions = useMemo(() => {
    let filtered = options;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((opt) =>
        opt.label.toLowerCase().includes(query) || String(opt.value).toLowerCase().includes(query)
      );
    }

    // Apply "Display Selected Only" filter
    if (displaySelectedOnly) {
      filtered = filtered.filter((opt) => selectedValues.includes(opt.value));
    }

    return filtered;
  }, [options, searchQuery, displaySelectedOnly, selectedValues]);

  // Display limited results
  const displayedOptions = filteredOptions.slice(0, maxDisplayResults);
  const totalResults = filteredOptions.length;
  const hasMoreResults = filteredOptions.length > maxDisplayResults;

  // Toggle selection
  const toggleValue = (value: string | number) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Select all visible
  const selectAllVisible = () => {
    const visibleValues = displayedOptions.map((opt) => opt.value);
    setSelectedValues((prev) => {
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
    setSelectedValues((prev) => prev.filter((val) => !visibleValues.includes(val)));
  };

  // Handle apply
  const handleApply = (e: React.MouseEvent) => {
    // Stop any event propagation to prevent header clicks
    e.stopPropagation();
    e.preventDefault();
    
    // Apply filter first
    onApply(selectedValues, condition);
    
    // Close modal after a small delay to ensure event propagation is stopped
    // This prevents the click from bubbling to the header
    setTimeout(() => {
      onOpenChange(false);
    }, 10);
  };

  // Handle cancel
  const handleCancel = () => {
    onOpenChange(false);
  };

  const selectedCount = selectedValues.length;
  const conditionOptions = getConditionOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          {category && (
            <p className="text-sm text-muted-foreground mb-1">{category}</p>
          )}
          <DialogTitle className="text-xl font-bold">{columnLabel}</DialogTitle>
          <DialogDescription>
            Select values to filter the {columnLabel} column
          </DialogDescription>
        </DialogHeader>

        {/* Filter Controls */}
        <div className="px-6 py-4 border-b space-y-3">
          {/* Top row: Condition and Display Selected Only */}
          <div className="flex items-center justify-between gap-4">
            <Select value={condition} onValueChange={(value) => setCondition(value)}>
              <SelectTrigger className="w-[180px]">
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

            <div className="flex items-center gap-2">
              <Checkbox
                id="display-selected-only"
                checked={displaySelectedOnly}
                disabled={selectedCount === 0}
                onCheckedChange={(checked) => setDisplaySelectedOnly(checked === true)}
              />
              <label
                htmlFor="display-selected-only"
                className={`text-sm select-none ${
                  selectedCount === 0
                    ? 'text-muted-foreground cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                Display Selected only
              </label>
              {selectedCount > 0 && (
                <span className="text-sm text-muted-foreground">({selectedCount})</span>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Options List */}
        <ScrollArea className="flex-1 px-6 py-4 min-h-[300px] max-h-[400px]">
          <div className="space-y-2">
            {displayedOptions.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No results found
              </div>
            ) : (
              <>
                {/* Select All / Deselect All */}
                {displayedOptions.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox
                      checked={displayedOptions.every((opt) => selectedValues.includes(opt.value))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllVisible();
                        } else {
                          deselectAllVisible();
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {displayedOptions.every((opt) => selectedValues.includes(opt.value))
                        ? 'Deselect all'
                        : 'Select all'}
                    </span>
                  </div>
                )}

                {/* Options */}
                {displayedOptions.map((option) => (
                  <div key={option.value} className="flex items-center gap-2 py-1">
                    <Checkbox
                      id={`filter-${option.value}`}
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={() => toggleValue(option.value)}
                    />
                    <label
                      htmlFor={`filter-${option.value}`}
                      className="text-sm cursor-pointer select-none flex-1"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Info Message */}
        {hasMoreResults && (
          <div className="px-6 py-3 border-t bg-muted/30">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Showing <strong>{maxDisplayResults}</strong>/{totalResults} results. The display is
                limited to {maxDisplayResults} results. Refine your search to find the desired entry.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleApply(e);
            }} 
            className="bg-[#2063F0] hover:bg-[#1a54d8]"
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

