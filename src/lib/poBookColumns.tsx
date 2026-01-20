/**
 * TanStack Table column definitions for Purchase Order Book
 * Matches REGLES_METIERS.md section 9.5 exactly
 * Includes column grouping, sorting, filtering, and resizing
 */

import { createColumnHelper, type ColumnDef, type FilterFn } from '@tanstack/react-table';
import type { PurchaseOrderRow } from './poBookMockData';
import { CheckboxWithIndeterminate } from '@/components/ui/checkbox-with-indeterminate';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';

const columnHelper = createColumnHelper<PurchaseOrderRow>();

/**
 * Custom filter function that handles:
 * - Single values: exact match
 * - Arrays of values: OR logic (value must be in array)
 * - Condition objects: { condition: 'is' | 'isNot', values: [...] }
 * - Multiple filters: AND logic (all filters must match)
 */
export const customFilterFn: FilterFn<PurchaseOrderRow> = (row, columnId, filterValue, _addMeta) => {
  const cellValue = row.getValue(columnId);
  
  if (filterValue === null || filterValue === undefined) {
    return true;
  }
  
  if (typeof filterValue === 'object' && filterValue !== null && 'condition' in filterValue && 'values' in filterValue) {
    const condition = (filterValue as any).condition;
    const values = (filterValue as any).values;
    
    if (!Array.isArray(values) || values.length === 0) {
      return true;
    }
    
    const isMatch = values.includes(cellValue);
    
    if (condition === 'isNot') {
      return !isMatch;
    }
    return isMatch;
  }
  
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) {
      return true;
    }
    return filterValue.includes(cellValue);
  }
  
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

// Escalation level indicator with badge
const EscalationIndicator: React.FC<{ level: number }> = ({ level }) => {
  const badgeConfig = {
    1: { color: '#EFF6FF', textColor: '#1E88E5', label: '1' },
    2: { color: '#FFF3E0', textColor: '#FB8C00', label: '2' },
    3: { color: '#FFE9E5', textColor: '#F4511E', label: '3' },
    4: { color: '#455A64', textColor: '#FFFFFF', label: '4' },
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

// OTD Status indicator with badge (like Delivery status)
const OTDStatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  // Normalize status values (handle both 'on-time' and 'On time')
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
  
  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    'on-time': { bg: '#ECFDF5', text: '#10B981', border: '#10B98120', label: 'On time' }, // Success green
    'on time': { bg: '#ECFDF5', text: '#10B981', border: '#10B98120', label: 'On time' }, // Success green
    'late': { bg: '#FEF2F2', text: '#EF4444', border: '#EF444420', label: 'Late' }, // Red (error)
    'missing-information': { bg: '#FFF3E0', text: '#FB8C00', border: '#FB8C0020', label: 'Missing information' }, // Warm amber (caution)
    'missing information': { bg: '#FFF3E0', text: '#FB8C00', border: '#FB8C0020', label: 'Missing information' }, // Warm amber (caution)
  };
  
  const config = statusConfig[normalizedStatus] || statusConfig['on-time'];
  
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
      {config.label}
    </Badge>
  );
};

// Sim. Outcome indicator (enum / status icon)
const SimOutcomeIndicator: React.FC<{ outcome: string }> = ({ outcome }) => {
  const outcomeConfig: Record<string, { color: string; icon: string }> = {
    'approved': { color: '#10B981', icon: '✓' },
    'pending': { color: '#FB8C00', icon: '⏳' },
    'rejected': { color: '#F4511E', icon: '✗' },
  };
  const config = outcomeConfig[outcome] || outcomeConfig['pending'];
  
  return (
    <div
      className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: config.color, color: 'white' }}
      title={outcome}
    >
      {config.icon}
    </div>
  );
};

// Suggested Action indicator (enum / action icon)
const SuggestedActionIndicator: React.FC<{ action: string }> = ({ action }) => {
  const actionConfig: Record<string, { icon: string; color: string }> = {
    'pull-in': { icon: '↑', color: '#10B981' },
    'push-out': { icon: '↓', color: '#F4511E' },
    'no-change': { icon: '→', color: '#64748B' },
  };
  const config = actionConfig[action] || actionConfig['no-change'];
  
  return (
    <div
      className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: config.color, color: 'white' }}
      title={action}
    >
      {config.icon}
    </div>
  );
};

export const columns: ColumnDef<PurchaseOrderRow, any>[] = [
  // Selection checkbox (UI element, not in REGLES_METIERS.md but needed for table functionality)
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

  // Group: Sim. Outcome (Purple group on the far left)
  {
    id: 'simOutcome',
    header: 'Sim. Outcome',
    columns: [
      columnHelper.accessor('simOutcome', {
        id: 'simOutcome',
        header: 'Sim. Outcome',
        cell: (info) => <SimOutcomeIndicator outcome={info.getValue()} />,
        size: 100,
        filterFn: customFilterFn,
        enableResizing: true,
        meta: {
          headerTint: 'purple',
        },
      }),
    ],
  },

  // Group: Supply Event
  {
    id: 'supplyEvent',
    header: 'Supply Event',
    columns: [
      columnHelper.accessor('supplyEscalationLevel', {
        id: 'supplyEscalationLevel',
        header: 'Escalation Level',
        cell: (info) => <EscalationIndicator level={info.getValue()} />,
        size: 80,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
      columnHelper.accessor('supplyType', {
        id: 'supplyType',
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
              display: 'inline-block',
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
      columnHelper.accessor('supplyEvent', {
        id: 'supplyEvent',
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
        header: 'Delivery Status',
        cell: (info) => {
          const status = info.getValue();
          const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
            'Delivered': { bg: '#ECFDF5', text: '#10B981', border: '#10B98120' },
            'Shipped': { bg: '#F0F9FF', text: '#0EA5E9', border: '#0EA5E920' },
            'In Progress': { bg: '#FFF3E0', text: '#FB8C00', border: '#FB8C0020' },
            'Cancelled': { bg: '#F1F5F9', text: '#64748B', border: '#64748B20' },
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
    ],
  },

  // Group: Subcontract
  {
    id: 'subcontract',
    header: 'Subcontract',
    columns: [
      columnHelper.accessor('subcontract', {
        id: 'subcontract',
        header: 'Subcontract',
        cell: (info) => (info.getValue() ? 'Yes' : 'No'),
        size: 100,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
    ],
  },

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
        filterFn: customFilterFn,
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
          <span className="text-sm break-words">
            {info.getValue()}
          </span>
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
      columnHelper.accessor('mrpCode', {
        id: 'mrpCode',
        header: 'MRP code',
        cell: (info) => <span className="text-sm break-words">{info.getValue()}</span>,
        size: 120,
        enableSorting: true,
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
        filterFn: customFilterFn,
        enableResizing: true,
      }),
      columnHelper.accessor('price', {
        id: 'price',
        header: 'Price',
        cell: (info) => (
          <span className="text-sm font-medium">{formatCurrency(info.getValue())}</span>
        ),
        size: 130,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
      columnHelper.accessor('inventoryValue', {
        id: 'inventoryValue',
        header: 'Inventory Value',
        cell: (info) => (
          <span className="text-sm font-medium">{formatCurrency(info.getValue())}</span>
        ),
        size: 140,
        filterFn: customFilterFn,
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

  // Group: Sug. action (Green highlighted group)
  {
    id: 'suggestedAction',
    header: 'Sug. action',
    columns: [
      columnHelper.accessor('suggestedAction', {
        id: 'suggestedAction',
        header: 'Sug. action',
        cell: (info) => <SuggestedActionIndicator action={info.getValue()} />,
        size: 100,
        filterFn: customFilterFn,
        enableResizing: true,
        meta: {
          headerTint: 'green',
        },
      }),
    ],
  },

  // Group: Inventory cash impact (Green highlighted group)
  {
    id: 'inventoryCashImpact',
    header: 'Inventory cash impact',
    columns: [
      columnHelper.accessor('inventoryCashImpact', {
        id: 'inventoryCashImpact',
        header: 'Inventory cash impact',
        cell: (info) => {
          const value = info.getValue();
          const formatted = value >= 1000 ? `€${(value / 1000).toFixed(1)}K` : formatCurrency(value);
          return <span className="text-sm">{formatted}</span>;
        },
        size: 150,
        filterFn: customFilterFn,
        enableResizing: true,
        meta: {
          headerTint: 'green',
        },
      }),
    ],
  },

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

  // Group: Simulation (Purple group on the far right)
  {
    id: 'simulation',
    header: 'Simulation',
    columns: [
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
      columnHelper.accessor('simDeliveryDate', {
        id: 'simDeliveryDate',
        header: 'Sim. Delivery Date',
        cell: (info) => (
          <div className="flex items-center gap-1">
            <span className="text-sm">{formatDate(info.getValue())}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        ),
        size: 130,
        enableResizing: true,
        meta: {
          headerTint: 'purple',
        },
      }),
    ],
  },
];
