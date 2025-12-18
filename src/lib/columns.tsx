/**
 * TanStack Table column definitions for Purchase Order Book
 * Includes column grouping, sorting, filtering, and resizing
 */

import { createColumnHelper, type ColumnDef, type FilterFn } from '@tanstack/react-table';
import type { PurchaseOrderRow } from './mockData';
import { CheckboxWithIndeterminate } from '@/components/ui/checkbox-with-indeterminate';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, ChevronDown, ChevronUp } from 'lucide-react';

const columnHelper = createColumnHelper<PurchaseOrderRow>();

/**
 * Custom filter function that handles:
 * - Single values: exact match
 * - Arrays of values: OR logic (value must be in array)
 * - Condition objects: { condition: 'is' | 'isNot', values: [...] }
 * - Multiple filters: AND logic (all filters must match)
 * 
 * This function is exported for testing purposes.
 */
export const customFilterFn: FilterFn<PurchaseOrderRow> = (row, columnId, filterValue, _addMeta) => {
  const cellValue = row.getValue(columnId);
  
  // Handle null/undefined filter values
  if (filterValue === null || filterValue === undefined) {
    return true;
  }
  
  // Handle condition objects: { condition: 'is' | 'isNot', values: [...] }
  if (typeof filterValue === 'object' && filterValue !== null && 'condition' in filterValue && 'values' in filterValue) {
    const condition = (filterValue as any).condition;
    const values = (filterValue as any).values;
    
    if (!Array.isArray(values) || values.length === 0) {
      return true; // No filter values means show all
    }
    
    const isMatch = values.includes(cellValue);
    
    if (condition === 'isNot') {
      return !isMatch;
    }
    // Default to 'is'
    return isMatch;
  }
  
  // Handle arrays: OR logic (value must be in array)
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) {
      return true; // Empty array means show all
    }
    return filterValue.includes(cellValue);
  }
  
  // Handle single value: exact match
  return cellValue === filterValue;
};

// Helper to format currency
const formatCurrency = (value: number): string => {
  return `€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper to format days delta
const formatDaysDelta = (days: number): string => {
  const sign = days >= 0 ? '+' : '';
  return `${sign}${days} d`;
};

// Escalation level indicator
const EscalationIndicator: React.FC<{ level: number }> = ({ level }) => {
  const colors = ['#e0e0e0', '#2196f3', '#ff9800', '#f44336'];
  return (
    <div
      className="w-5 h-5 rounded-full border-2 border-white"
      style={{ backgroundColor: colors[level] || colors[0] }}
      title={`Escalation Level ${level}`}
    />
  );
};

// OTD Status indicator
const OTDStatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    'on-time': { color: '#4caf50', label: 'On Time' },
    'at-risk': { color: '#ff9800', label: 'At Risk' },
    'late': { color: '#f44336', label: 'Late' },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['on-time'];
  
  return (
    <div
      className="w-5 h-5 rounded-full border-2 border-white"
      style={{ backgroundColor: config.color }}
      title={config.label}
    />
  );
};

export const columns: ColumnDef<PurchaseOrderRow, any>[] = [
  // Selection checkbox
  columnHelper.display({
    id: 'select',
    header: ({ table }) => {
      const isAllSelected = table.getIsAllRowsSelected();
      const isSomeSelected = table.getIsSomeRowsSelected();
      return (
        <CheckboxWithIndeterminate
          checked={isAllSelected}
          indeterminate={isSomeSelected && !isAllSelected}
          onCheckedChange={(checked) => {
            table.getToggleAllRowsSelectedHandler()({ target: { checked } } as any);
          }}
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => {
          row.getToggleSelectedHandler()({ target: { checked } } as any);
        }}
      />
    ),
    size: 50,
    enableResizing: false,
  }),

  // Group: Supply Event
  {
    id: 'supplyEvent',
    header: 'Supply Event',
    columns: [
      columnHelper.accessor('escalationLevel', {
        id: 'escalationLevel',
        header: 'Escalation Level',
        cell: (info) => <EscalationIndicator level={info.getValue()} />,
        size: 80,
      }),
      columnHelper.accessor('type', {
        id: 'type',
        header: 'Type',
        cell: (info) => (
          <Badge variant="secondary">{info.getValue()}</Badge>
        ),
        size: 70,
        filterFn: customFilterFn,
      }),
      columnHelper.accessor('event', {
        id: 'event',
        header: 'Event',
        cell: (info) => (
          <a href="#" className="text-link text-sm">
            {info.getValue().length > 15 ? `${info.getValue().substring(0, 15)}...` : info.getValue()}
          </a>
        ),
        size: 150,
      }),
    ],
  },

  // Group: Status
  {
    id: 'status',
    header: 'Status',
    columns: [
      columnHelper.accessor('otdStatus', {
        id: 'otdStatus',
        header: 'OTD Status',
        cell: (info) => <OTDStatusIndicator status={info.getValue()} />,
        size: 100,
        filterFn: customFilterFn,
      }),
      columnHelper.accessor('deliveryStatus', {
        id: 'deliveryStatus',
        header: 'Delivery status',
        cell: (info) => {
          const status = info.getValue();
          const variant = status === 'Delivered' ? 'default' : status === 'Shipped' ? 'secondary' : status === 'Cancelled' ? 'destructive' : 'outline';
          return (
            <Badge variant={variant as any}>
              {status}
            </Badge>
          );
        },
        size: 120,
        filterFn: customFilterFn,
      }),
    ],
  },

  // Subcontract (ungrouped)
  columnHelper.accessor('subcontract', {
    id: 'subcontract',
    header: 'Subcontract',
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
    size: 100,
    filterFn: customFilterFn,
  }),

  // Group: Produced Part
  {
    id: 'producedPart',
    header: 'Produced Part',
    columns: [
      columnHelper.accessor('partEscalationLevel', {
        id: 'partEscalationLevel',
        header: 'Escalation Level',
        cell: (info) => <EscalationIndicator level={info.getValue()} />,
        size: 80,
      }),
      columnHelper.accessor('partNumber', {
        id: 'partNumber',
        header: 'Part Number',
        cell: (info) => (
          <a href="#" className="text-link text-sm">
            {info.getValue()}
          </a>
        ),
        size: 120,
      }),
      columnHelper.accessor('partName', {
        id: 'partName',
        header: 'Part Name',
        cell: (info) => (
          <a href="#" className="text-link text-sm">
            {info.getValue().length > 20 ? `${info.getValue().substring(0, 20)}...` : info.getValue()}
          </a>
        ),
        size: 150,
      }),
      columnHelper.accessor('plant', {
        id: 'plant',
        header: 'Plant',
        cell: (info) => <span className="text-sm">{info.getValue()}</span>,
        size: 120,
        filterFn: customFilterFn,
      }),
    ],
  },

  // Group: General Information
  {
    id: 'generalInfo',
    header: 'General Information',
    columns: [
      columnHelper.accessor('openQuantity', {
        id: 'openQuantity',
        header: 'Open Quantity',
        cell: (info) => (
          <span className="text-sm">{info.getValue().toLocaleString()}</span>
        ),
        size: 120,
      }),
      columnHelper.accessor('price', {
        id: 'price',
        header: 'Price',
        cell: (info) => (
          <span className="text-sm font-medium">{formatCurrency(info.getValue())}</span>
        ),
        size: 130,
      }),
      columnHelper.accessor('inventoryValue', {
        id: 'inventoryValue',
        header: 'Inventory Value',
        cell: (info) => (
          <span className="text-sm font-medium">{formatCurrency(info.getValue())}</span>
        ),
        size: 140,
      }),
      columnHelper.accessor('supplier', {
        id: 'supplier',
        header: 'Supplier',
        cell: (info) => (
          <span className="text-sm">
            {info.getValue().length > 20 ? `${info.getValue().substring(0, 20)}...` : info.getValue()}
          </span>
        ),
        size: 180,
      }),
    ],
  },

  // Ungrouped - Green header tint
  columnHelper.accessor('suggestedAction', {
    id: 'suggestedAction',
    header: 'Sug. ac…',
    cell: (info) => {
      const value = info.getValue();
      const isPositive = value >= 0;
      return (
        <div className="flex items-center gap-1 text-sm">
          {isPositive ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-status-success)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-status-error)]" />
          )}
          <span className={isPositive ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'}>
            {formatDaysDelta(value)}
          </span>
        </div>
      );
    },
    size: 100,
    meta: {
      headerTint: 'green',
    },
  }),

  columnHelper.accessor('inventory', {
    id: 'inventory',
    header: 'Invento…',
    cell: (info) => {
      const value = info.getValue();
      const formatted = value >= 1000 ? `€${(value / 1000).toFixed(1)}K` : formatCurrency(value);
      return <span className="text-sm">{formatted}</span>;
    },
    size: 100,
    meta: {
      headerTint: 'green',
    },
  }),

  // Group: Timeline
  {
    id: 'timeline',
    header: 'Timeline',
    columns: [
      columnHelper.accessor('otdDate', {
        id: 'otdDate',
        header: 'OTD Date',
        cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        size: 110,
      }),
      columnHelper.accessor('deliveryDate', {
        id: 'deliveryDate',
        header: 'Delivery Date',
        cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        size: 120,
      }),
    ],
  },

  // Ungrouped - Purple header tint
  columnHelper.accessor('simQty', {
    id: 'simQty',
    header: 'Sim. Qty',
    cell: (info) => (
      <div className="flex items-center gap-1">
        <span className="text-sm">{info.getValue().toLocaleString()}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Edit2 className="w-3 h-3" />
        </Button>
      </div>
    ),
    size: 110,
    meta: {
      headerTint: 'purple',
    },
  }),

  columnHelper.accessor('simDate', {
    id: 'simDate',
    header: 'Sim. D',
    cell: (info) => (
      <div className="flex items-center gap-1">
        <span className="text-sm">{formatDate(info.getValue())}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Edit2 className="w-3 h-3" />
        </Button>
      </div>
    ),
    size: 110,
    meta: {
      headerTint: 'purple',
    },
  }),
];
