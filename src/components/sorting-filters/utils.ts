/**
 * Utility functions for Sorting & Filters Modal
 */

import type { ColumnDef } from '@tanstack/react-table';
import type { FilterDefinition } from '../SortingAndFiltersPopover';

/**
 * Recursively find column by ID and get its label
 */
export function getColumnLabel(columnId: string, columns: ColumnDef<any>[]): string {
  const findColumn = (cols: ColumnDef<any>[]): ColumnDef<any> | null => {
    for (const col of cols) {
      if (col.id === columnId) {
        return col;
      }
      if ('columns' in col && Array.isArray(col.columns)) {
        const found = findColumn(col.columns);
        if (found) return found;
      }
    }
    return null;
  };

  const column = findColumn(columns);
  if (!column) return columnId;

  // Extract header text
  if (typeof column.header === 'string') {
    return column.header;
  }
  if (typeof column.header === 'function') {
    // For function headers, try to get a readable name from the column definition
    return column.id || columnId;
  }
  return column.id || columnId;
}

/**
 * Get all sortable columns recursively
 */
export function getSortableColumns(columns: ColumnDef<any>[]): Array<{ id: string; label: string }> {
  const result: Array<{ id: string; label: string }> = [];
  
  const traverse = (cols: ColumnDef<any>[]) => {
    for (const col of cols) {
      if (col.id && col.enableSorting !== false) {
        result.push({
          id: col.id,
          label: getColumnLabel(col.id, columns),
        });
      }
      if ('columns' in col && Array.isArray(col.columns)) {
        traverse(col.columns);
      }
    }
  };
  
  traverse(columns);
  return result;
}

/**
 * Group filter definitions by category
 */
export function groupFilterDefinitions(filterDefinitions: FilterDefinition[]) {
  const favorites = filterDefinitions.filter((f) => f.isFavorite);
  const general = filterDefinitions.filter((f) => f.category === 'general');
  const consumedParts = filterDefinitions.filter((f) => f.category === 'consumed-parts');
  const producedParts = filterDefinitions.filter((f) => f.category === 'produced-parts');

  return { favorites, general, consumedParts, producedParts };
}

/**
 * Filter search results
 */
export function filterSearchResults(
  filterDefinitions: FilterDefinition[],
  searchQuery: string
): FilterDefinition[] {
  if (!searchQuery) return filterDefinitions;
  const searchLower = searchQuery.toLowerCase();
  return filterDefinitions.filter(
    (f) => f.label.toLowerCase().includes(searchLower) || f.id.toLowerCase().includes(searchLower)
  );
}

/**
 * Map filter definition ID to column ID
 * This mapping connects filter definitions to actual table columns
 */
export function getColumnIdFromFilterId(filterId: string): string | null {
  const mapping: Record<string, string> = {
    'part-name': 'partName',
    'part-number': 'partNumber',
    'type': 'type',
    'delivery-status': 'deliveryStatus',
    'plant': 'plant',
    'supplier': 'supplier',
    'buyer-codes': 'buyerCodes',
    'escalation-level': 'escalationLevel',
    'otd-status': 'otdStatus',
    'open-quantity': 'openQuantity',
    'price': 'price',
    'inventory-value': 'inventoryValue',
    'consumed-part-buyer-codes': 'consumedPartBuyerCodes',
    'produced-part-buyer-codes': 'producedPartBuyerCodes',
    'mrp-code': 'mrpCode',
  };
  return mapping[filterId] || null;
}

/**
 * Get filter display values (human-readable labels)
 */
export function getFilterDisplayValues(
  filter: { values: (string | number)[] },
  filterDef: FilterDefinition | undefined
): string[] {
  if (!filterDef) return filter.values.map(String);

  return filter.values.map((val: string | number) => {
    if (filterDef.options) {
      const option = filterDef.options.find((opt) => opt.value === val);
      return option?.label || String(val);
    }
    return String(val);
  });
}

