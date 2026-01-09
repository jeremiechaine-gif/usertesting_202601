/**
 * TanStack Table column definitions for Work Order Book
 * Matches REGLES_METIERS.md section 9.4 exactly
 * Includes column grouping, sorting, filtering, and resizing
 */

import { createColumnHelper, type ColumnDef, type FilterFn } from '@tanstack/react-table';
import type { WorkOrderRow } from './woBookMockData';
import { CheckboxWithIndeterminate } from '@/components/ui/checkbox-with-indeterminate';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const columnHelper = createColumnHelper<WorkOrderRow>();

export const customFilterFn: FilterFn<WorkOrderRow> = (row, columnId, filterValue, _addMeta) => {
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

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatPercentage = (value: number): string => {
  return `${value}%`;
};

// Sim. Outcome indicator
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

// Tickets indicator (icon / count)
const TicketsIndicator: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <div className="flex items-center gap-1">
      <AlertCircle className="w-4 h-4 text-[#F4511E]" />
      <span className="text-xs font-medium text-[#F4511E]">{count}</span>
    </div>
  );
};

// Material Coverage indicator (percentage / icon)
const MaterialCoverageIndicator: React.FC<{ coverage: number }> = ({ coverage }) => {
  const getColor = (coverage: number) => {
    if (coverage >= 100) return '#10B981';
    if (coverage >= 80) return '#FB8C00';
    return '#F4511E';
  };
  
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: getColor(coverage) }}
        title={`${coverage}%`}
      />
      <span className="text-sm">{formatPercentage(coverage)}</span>
    </div>
  );
};

// Quality Notes indicator (icon)
const QualityNotesIndicator: React.FC<{ hasNotes: boolean }> = ({ hasNotes }) => {
  if (!hasNotes) return null;
  
  return (
    <AlertCircle className="w-4 h-4 text-[#FB8C00]" title="Quality notes available" />
  );
};

// WO Status indicator
const WOStatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    'completed': { color: '#10B981', icon: <CheckCircle2 className="w-4 h-4" /> },
    'in-progress': { color: '#0EA5E9', icon: <AlertCircle className="w-4 h-4" /> },
    'blocked': { color: '#F4511E', icon: <XCircle className="w-4 h-4" /> },
  };
  const config = statusConfig[status] || statusConfig['in-progress'];
  
  return (
    <div className="flex items-center" style={{ color: config.color }}>
      {config.icon}
    </div>
  );
};

// Subcontract Info indicator (enum / icon)
const SubcontractInfoIndicator: React.FC<{ info: string }> = ({ info }) => {
  const infoConfig: Record<string, { icon: string; color: string }> = {
    'yes': { icon: '✓', color: '#10B981' },
    'no': { icon: '✗', color: '#64748B' },
  };
  const config = infoConfig[info] || infoConfig['no'];
  
  return (
    <div
      className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: config.color, color: 'white' }}
      title={info}
    >
      {config.icon}
    </div>
  );
};

export const columns: ColumnDef<WorkOrderRow, any>[] = [
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

  // Group: Work Order
  {
    id: 'workOrder',
    header: 'Work Order',
    columns: [
      columnHelper.accessor('ticketsOnWO', {
        id: 'ticketsOnWO',
        header: 'Tickets on WO',
        cell: (info) => <TicketsIndicator count={info.getValue()} />,
        size: 100,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
      columnHelper.accessor('workOrderNumber', {
        id: 'workOrderNumber',
        header: 'Work Order Number',
        cell: (info) => (
          <a href="#" className="text-link text-sm break-words">
            {info.getValue()}
          </a>
        ),
        size: 150,
        enableResizing: true,
      }),
      columnHelper.accessor('subcontractInfo', {
        id: 'subcontractInfo',
        header: 'Subcontract Info',
        cell: (info) => <SubcontractInfoIndicator info={info.getValue()} />,
        size: 120,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
    ],
  },

  // Group: Status
  {
    id: 'status',
    header: 'Status',
    columns: [
      columnHelper.accessor('materialCoverage', {
        id: 'materialCoverage',
        header: '% Material Coverage',
        cell: (info) => <MaterialCoverageIndicator coverage={info.getValue()} />,
        size: 140,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
      columnHelper.accessor('qualityNotes', {
        id: 'qualityNotes',
        header: 'Quality Notes',
        cell: (info) => <QualityNotesIndicator hasNotes={info.getValue()} />,
        size: 100,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
      columnHelper.accessor('woStatus', {
        id: 'woStatus',
        header: 'WO status',
        cell: (info) => <WOStatusIndicator status={info.getValue()} />,
        size: 100,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
    ],
  },

  // Group: Part
  {
    id: 'part',
    header: 'Part',
    columns: [
      columnHelper.accessor('ticketsOnPart', {
        id: 'ticketsOnPart',
        header: 'Tickets on Part',
        cell: (info) => <TicketsIndicator count={info.getValue()} />,
        size: 100,
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
      columnHelper.accessor('simQuantity', {
        id: 'simQuantity',
        header: 'Sim. Quantity',
        cell: (info) => (
          <div className="flex items-center gap-1">
            <span className="text-sm">{info.getValue().toLocaleString()}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        ),
        size: 120,
        enableResizing: true,
      }),
    ],
  },

  // Group: Timeline
  {
    id: 'timeline',
    header: 'Timeline',
    columns: [
      columnHelper.accessor('actualStartDate', {
        id: 'actualStartDate',
        header: 'Actual Start Date',
        cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        size: 130,
        enableResizing: true,
      }),
      columnHelper.accessor('plannedStartDate', {
        id: 'plannedStartDate',
        header: 'Planned Start Date',
        cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        size: 130,
        enableResizing: true,
      }),
      columnHelper.accessor('simStartDate', {
        id: 'simStartDate',
        header: 'Sim. Start Date',
        cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        size: 120,
        enableResizing: true,
      }),
      columnHelper.accessor('plannedEndDate', {
        id: 'plannedEndDate',
        header: 'Planned End Date',
        cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        size: 130,
        enableResizing: true,
      }),
      columnHelper.accessor('simEndDate', {
        id: 'simEndDate',
        header: 'Sim. End Date',
        cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        size: 120,
        enableResizing: true,
      }),
      columnHelper.accessor('plannedStorageDate', {
        id: 'plannedStorageDate',
        header: 'Planned Storage Date',
        cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        size: 150,
        enableResizing: true,
      }),
    ],
  },
];
