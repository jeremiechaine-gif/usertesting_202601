/**
 * Filter Row Component
 * Individual filter configuration row in the filters section
 */

import React, { useCallback, useMemo } from 'react';
import { FilterChip } from '@/components/ui/filter-chip';
import { cn } from '@/lib/utils';
import type { FilterConfig, FilterDefinition } from '../SortingAndFiltersPopover';

interface FilterRowProps {
  filter: FilterConfig;
  columnLabel: string;
  filterDef: FilterDefinition | undefined;
  displayValues: string[];
  onUpdateValues: (filterId: string, values: (string | number)[]) => void;
  onRemove: (filterId: string) => void;
  onOpenFilterModal?: (columnId: string) => void;
  getColumnIdFromFilterId: (filterId: string) => string | null;
  isNotInRoutine?: boolean; // Highlight orange if not in routine
}

const FilterRowComponent: React.FC<FilterRowProps> = ({
  filter,
  columnLabel,
  filterDef,
  displayValues,
  onUpdateValues,
  onRemove,
  onOpenFilterModal,
  getColumnIdFromFilterId,
  isNotInRoutine = false,
}) => {
  const handleRemoveValue = useCallback(
    (value: string | number) => {
      const newValues = filter.values.filter((v) => v !== value);
      onUpdateValues(filter.id, newValues);
    },
    [filter.values, filter.id, onUpdateValues]
  );

  const handleEdit = useCallback(() => {
    // Map filter ID to column ID and open the filter modal
    const columnId = getColumnIdFromFilterId(filter.filterId);
    if (columnId && onOpenFilterModal) {
      onOpenFilterModal(columnId);
    }
  }, [filter.filterId, getColumnIdFromFilterId, onOpenFilterModal]);

  const handleRemove = useCallback(() => {
    onRemove(filter.id);
  }, [filter.id, onRemove]);

  const handleUpdateValues = useCallback(
    (values: (string | number)[]) => {
      onUpdateValues(filter.id, values);
    },
    [filter.id, onUpdateValues]
  );

  // Memoize options to prevent unnecessary re-renders
  const options = useMemo(
    () => filterDef?.options?.map((opt) => ({ value: opt.value, label: opt.label })),
    [filterDef?.options]
  );

  return (
    <div className={cn(
      "w-full min-w-0 p-1 rounded-md transition-colors relative"
    )}>
      {isNotInRoutine && (
        <span className="absolute top-1 left-1 h-2 w-2 bg-red-500 rounded-full z-10" />
      )}
      <FilterChip
        label={columnLabel}
        values={filter.values}
        displayValues={displayValues}
        options={options}
        maxVisible={2}
        onRemove={handleRemove}
        onRemoveValue={handleRemoveValue}
        onUpdateValues={handleUpdateValues}
        onEdit={handleEdit}
        enableInlineEdit={false}
        showEditButton={true}
        className="w-full min-w-0"
      />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when parent re-renders
export const FilterRow = React.memo(FilterRowComponent);

