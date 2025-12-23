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

// Escalation level indicator with badge
// Coherent color system: progressive severity scale complementing teal brand
const EscalationIndicator: React.FC<{ level: number }> = ({ level }) => {
  const badgeConfig = {
    1: { color: '#EFF6FF', textColor: '#1E88E5', label: '1' }, // Soft blue (info)
    2: { color: '#FFF3E0', textColor: '#FB8C00', label: '2' }, // Warm amber (caution)
    3: { color: '#FFE9E5', textColor: '#F4511E', label: '3' }, // Coral (warning)
    4: { color: '#455A64', textColor: '#FFFFFF', label: '4' }, // Blue-grey (critical, less harsh)
  };
  
  const config = badgeConfig[level as keyof typeof badgeConfig] || badgeConfig[1];
  
  return (
    <Badge
      className="h-6 px-2 text-xs font-semibold shrink-0"
      style={{
        backgroundColor: config.color,
        color: config.textColor,
        border: `1px solid ${config.textColor}20`,
      }}
    >
      {config.label}
    </Badge>
  );
};

// OTD Status indicator
// Coherent color system: aligned with escalation severity scale
const OTDStatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    'on-time': { color: '#10B981', label: 'On Time' }, // Emerald green (success, complements teal)
    'at-risk': { color: '#FB8C00', label: 'At Risk' }, // Warm amber (caution)
    'late': { color: '#F4511E', label: 'Late' }, // Coral (warning)
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['on-time'];
  
  return (
    <div
      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
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
        enableResizing: true,
      }),
      columnHelper.accessor('type', {
        id: 'type',
        header: 'Type',
        cell: (info) => (
          <Badge 
            className="text-xs font-medium break-words"
            style={{
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: '1px solid #CBD5E1',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              display: 'inline-block', // Change from inline-flex to allow wrapping
              maxWidth: '100%',
            }}
          >
            {info.getValue()}
          </Badge>
        ),
        size: 70,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
      columnHelper.accessor('event', {
        id: 'event',
        header: 'Event',
        cell: (info) => (
          <a href="#" className="text-link text-sm break-words">
            {info.getValue()}
          </a>
        ),
        size: 150,
        enableResizing: true,
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
        enableResizing: true,
      }),
      columnHelper.accessor('deliveryStatus', {
        id: 'deliveryStatus',
        header: 'Delivery status',
        cell: (info) => {
          const status = info.getValue();
          // Coherent semantic color system
          const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
            'Delivered': { bg: '#ECFDF5', text: '#10B981', border: '#10B98120' }, // Success green
            'Shipped': { bg: '#F0F9FF', text: '#0EA5E9', border: '#0EA5E920' }, // Sky blue (active)
            'In Progress': { bg: '#FFF3E0', text: '#FB8C00', border: '#FB8C0020' }, // Warm amber
            'Cancelled': { bg: '#F1F5F9', text: '#64748B', border: '#64748B20' }, // Neutral grey
          };
          const config = statusConfig[status] || statusConfig['In Progress'];
          
          return (
            <Badge 
              className="text-xs font-medium break-words"
              style={{
                backgroundColor: config.bg,
                color: config.text,
                border: `1px solid ${config.border}`,
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                display: 'inline-block',
                maxWidth: '100%',
              }}
            >
              {status}
            </Badge>
          );
        },
        size: 120,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
      columnHelper.accessor('arStatus', {
        id: 'arStatus',
        header: 'AR Status',
        cell: (info) => {
          const status = info.getValue();
          const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
            'AR': { bg: '#ECFDF5', text: '#10B981', border: '#10B98120' },
            'No AR': { bg: '#FFE9E5', text: '#F4511E', border: '#F4511E20' },
            'Pending': { bg: '#FFF3E0', text: '#FB8C00', border: '#FB8C0020' },
          };
          const config = statusConfig[status || 'Pending'] || statusConfig['Pending'];
          
          return (
            <Badge 
              className="text-xs font-medium break-words"
              style={{
                backgroundColor: config.bg,
                color: config.text,
                border: `1px solid ${config.border}`,
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                display: 'inline-block',
                maxWidth: '100%',
              }}
            >
              {status || 'Pending'}
            </Badge>
          );
        },
        size: 100,
        filterFn: customFilterFn,
        enableResizing: true,
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
    enableResizing: true,
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
        enableResizing: true,
      }),
      columnHelper.accessor('partNumber', {
        id: 'partNumber',
        header: 'Part Number',
        cell: (info) => (
          <a href="#" className="text-link text-sm break-words">
            {info.getValue()}
          </a>
        ),
        size: 120,
        enableResizing: true,
      }),
      columnHelper.accessor('partName', {
        id: 'partName',
        header: 'Part Name',
        cell: (info) => (
          <a href="#" className="text-link text-sm break-words">
            {info.getValue()}
          </a>
        ),
        size: 150,
        enableResizing: true,
      }),
      columnHelper.accessor('plant', {
        id: 'plant',
        header: 'Plant',
        cell: (info) => <span className="text-sm break-words">{info.getValue()}</span>,
        size: 120,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
      columnHelper.accessor('buyerCode', {
        id: 'buyerCodes',
        header: 'Buyer Code',
        cell: (info) => <span className="text-sm break-words">{info.getValue()}</span>,
        size: 120,
        filterFn: customFilterFn,
        enableResizing: true,
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
        enableResizing: true,
      }),
      columnHelper.accessor('price', {
        id: 'price',
        header: 'Price',
        cell: (info) => (
          <span className="text-sm font-medium">{formatCurrency(info.getValue())}</span>
        ),
        size: 130,
        enableResizing: true,
      }),
      columnHelper.accessor('inventoryValue', {
        id: 'inventoryValue',
        header: 'Inventory Value',
        cell: (info) => (
          <span className="text-sm font-medium">{formatCurrency(info.getValue())}</span>
        ),
        size: 140,
        enableResizing: true,
      }),
      columnHelper.accessor('supplier', {
        id: 'supplier',
        header: 'Supplier',
        cell: (info) => (
          <span className="text-sm break-words">
            {info.getValue()}
          </span>
        ),
        size: 180,
        enableResizing: true,
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
    enableResizing: true,
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
    enableResizing: true,
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
        enableResizing: true,
      }),
      columnHelper.accessor('deliveryDate', {
        id: 'deliveryDate',
        header: 'Delivery Date',
        cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        size: 120,
        enableResizing: true,
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
    enableResizing: true,
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
    enableResizing: true,
    meta: {
      headerTint: 'purple',
    },
  }),
];
