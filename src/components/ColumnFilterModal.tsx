/**
 * Column Filter Modal Component
 * Modal for filtering column values with multi-select checkboxes
 */

import React, { useState, useMemo } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Info, Filter } from 'lucide-react';

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
  // Debounce search query to avoid excessive filtering on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
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
        { value: 'equals', label: 'Égal à' },
        { value: 'notEquals', label: 'Différent de' },
        { value: 'greaterThan', label: 'Supérieur à' },
        { value: 'lessThan', label: 'Inférieur à' },
        { value: 'greaterThanOrEqual', label: 'Supérieur ou égal à' },
        { value: 'lessThanOrEqual', label: 'Inférieur ou égal à' },
      ];
    }
    if (columnType === 'date') {
      return [
        { value: 'equals', label: 'Égal à' },
        { value: 'before', label: 'Avant' },
        { value: 'after', label: 'Après' },
        { value: 'between', label: 'Entre' },
      ];
    }
    // Text type
    return [
      { value: 'is', label: 'Est' },
      { value: 'isNot', label: 'N\'est pas' },
      { value: 'contains', label: 'Contient' },
      { value: 'doesNotContain', label: 'Ne contient pas' },
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

    // Apply search filter (using debounced value)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((opt) =>
        opt.label.toLowerCase().includes(query) || String(opt.value).toLowerCase().includes(query)
      );
    }

    // Apply "Display Selected Only" filter
    if (displaySelectedOnly) {
      filtered = filtered.filter((opt) => selectedValues.includes(opt.value));
    }

    return filtered;
  }, [options, debouncedSearchQuery, displaySelectedOnly, selectedValues]);

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
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
            {category && (
              <p className="text-xs text-muted-foreground/80 mb-3 uppercase tracking-wide">{category}</p>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Filtrer par {columnLabel}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        {/* Filter Controls */}
        <div className="px-8 py-5 border-b border-border/50 space-y-4 shrink-0 bg-muted/10">
          {/* Top row: Condition and Display Selected Only */}
          <div className="flex items-center justify-between gap-4">
            <Select value={condition} onValueChange={(value) => setCondition(value)}>
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
                checked={displaySelectedOnly}
                disabled={selectedCount === 0}
                onCheckedChange={(checked) => setDisplaySelectedOnly(checked === true)}
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
                Afficher uniquement les sélectionnés
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
              placeholder="Rechercher des valeurs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
            />
          </div>
        </div>

        {/* Options List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-8 py-5 space-y-2">
            {displayedOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border/60 bg-muted/20">
                <div className="p-3 rounded-full bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 mb-3">
                  <Search className="h-6 w-6 text-[#2063F0]/60" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Aucun résultat trouvé</p>
                <p className="text-xs text-muted-foreground/70">Essayez d'ajuster votre recherche</p>
              </div>
            ) : (
              <>
                {/* Select All / Deselect All */}
                {displayedOptions.length > 0 && (
                  <div className="flex items-center gap-2 pb-3 mb-2 border-b border-border/60">
                    <Checkbox
                      checked={displayedOptions.every((opt) => selectedValues.includes(opt.value))}
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
                      {displayedOptions.every((opt) => selectedValues.includes(opt.value))
                        ? 'Tout désélectionner'
                        : 'Tout sélectionner'}
                    </span>
                  </div>
                )}

                {/* Options */}
                {displayedOptions.map((option) => {
                  const isChecked = selectedValues.includes(option.value);
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
          <div className="px-8 py-4 border-t border-border/50 shrink-0 bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 shrink-0">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  Affichage de <span className="font-semibold">{maxDisplayResults}</span> sur{' '}
                  <span className="font-semibold">{totalResults}</span> résultats
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  Affinez votre recherche pour trouver plus d'entrées
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2">
          <Button
            variant="secondary"
            onClick={handleCancel}
            className="border-border/60 hover:bg-muted"
          >
            Annuler
          </Button>
          <Button 
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleApply(e);
            }}
          >
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

