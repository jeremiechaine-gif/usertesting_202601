/**
 * TanStack Table column definitions for Escalation Room
 * Matches REGLES_METIERS.md section 9.6 exactly
 * Includes column grouping, sorting, filtering, and resizing
 */

import { createColumnHelper, type ColumnDef, type FilterFn } from '@tanstack/react-table';
import type { EscalationRoomRow } from './escalationRoomMockData';
import { CheckboxWithIndeterminate } from '@/components/ui/checkbox-with-indeterminate';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Star, MoreVertical, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const columnHelper = createColumnHelper<EscalationRoomRow>();

export const customFilterFn: FilterFn<EscalationRoomRow> = (row, columnId, filterValue, _addMeta) => {
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

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Escalation Level indicator (icon + number)
const EscalationLevelIndicator: React.FC<{ level: number }> = ({ level }) => {
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

// Ticket Status indicator (text + icon)
const TicketStatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    'open': { bg: '#F0F9FF', text: '#0EA5E9', border: '#0EA5E920', icon: <Clock className="w-3 h-3" /> },
    'in-progress': { bg: '#FFF3E0', text: '#FB8C00', border: '#FB8C0020', icon: <AlertCircle className="w-3 h-3" /> },
    'resolved': { bg: '#ECFDF5', text: '#10B981', border: '#10B98120', icon: <CheckCircle2 className="w-3 h-3" /> },
    'closed': { bg: '#F1F5F9', text: '#64748B', border: '#64748B20', icon: <XCircle className="w-3 h-3" /> },
  };
  const config = statusConfig[status] || statusConfig['open'];
  
  return (
    <Badge 
      className="text-xs font-medium break-words flex items-center gap-1"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        display: 'inline-flex',
        maxWidth: '100%',
      }}
    >
      {config.icon}
      <span>{status}</span>
    </Badge>
  );
};

// Date with status coloring (green/orange)
const StatusColoredDate: React.FC<{ date: string; isUrgent?: boolean }> = ({ date, isUrgent }) => {
  const color = isUrgent ? '#FB8C00' : '#10B981';
  
  return (
    <span className="text-sm" style={{ color }}>
      {formatDate(date)}
    </span>
  );
};

export const columns: ColumnDef<EscalationRoomRow, any>[] = [
  // Ungrouped (left utility columns)
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

  columnHelper.display({
    id: 'notification',
    header: () => null,
    cell: ({ row }) => {
      const hasNotification = row.original.notification;
      if (!hasNotification) return null;
      
      return (
        <Bell className="w-4 h-4 text-[#F4511E]" />
      );
    },
    size: 50,
    enableResizing: false,
  }),

  columnHelper.display({
    id: 'favorite',
    header: () => null,
    cell: ({ row }) => {
      const isFavorite = row.original.favorite;
      
      return (
        <Star 
          className={`w-4 h-4 ${isFavorite ? 'fill-[#FB8C00] text-[#FB8C00]' : 'text-muted-foreground'}`}
        />
      );
    },
    size: 50,
    enableResizing: false,
  }),

  // Group: Level
  {
    id: 'level',
    header: 'Level',
    columns: [
      columnHelper.accessor('escalationLevel', {
        id: 'escalationLevel',
        header: 'Level',
        cell: (info) => <EscalationLevelIndicator level={info.getValue()} />,
        size: 80,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
    ],
  },

  // Group: Ticket Number
  {
    id: 'ticketNumber',
    header: 'Ticket Number',
    columns: [
      columnHelper.accessor('ticketNumber', {
        id: 'ticketNumber',
        header: 'Ticket Number',
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
      columnHelper.accessor('ticketStatus', {
        id: 'ticketStatus',
        header: 'Status',
        cell: (info) => <TicketStatusIndicator status={info.getValue()} />,
        size: 120,
        filterFn: customFilterFn,
        enableResizing: true,
      }),
    ],
  },

  // Group: Parts
  {
    id: 'parts',
    header: 'Parts',
    columns: [
      // Sub-group: Suppliers (Implicated)
      columnHelper.accessor('suppliersImplicated', {
        id: 'suppliersImplicated',
        header: 'Suppliers (Implicated)',
        cell: (info) => {
          const suppliers = info.getValue();
          if (!suppliers || suppliers.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <span className="text-sm break-words">
              {Array.isArray(suppliers) ? suppliers.join(', ') : suppliers}
            </span>
          );
        },
        size: 180,
        enableResizing: true,
      }),
      // Sub-group: Suppliers (Parts)
      columnHelper.accessor('suppliersParts', {
        id: 'suppliersParts',
        header: 'Suppliers (Parts)',
        cell: (info) => {
          const suppliers = info.getValue();
          if (!suppliers || suppliers.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <span className="text-sm break-words">
              {Array.isArray(suppliers) ? suppliers.join(', ') : suppliers}
            </span>
          );
        },
        size: 180,
        enableResizing: true,
      }),
    ],
  },

  // Group: Objects
  {
    id: 'objects',
    header: 'Objects',
    columns: [
      columnHelper.accessor('objects', {
        id: 'objects',
        header: 'Objects',
        cell: (info) => {
          const value = info.getValue();
          const count = typeof value === 'object' && value !== null && 'count' in value 
            ? (value as any).count 
            : Array.isArray(value) ? value.length : 0;
          const label = typeof value === 'object' && value !== null && 'label' in value
            ? (value as any).label
            : Array.isArray(value) ? value.join(', ') : String(value);
          
          return (
            <a href="#" className="text-link text-sm break-words">
              {label} {count > 0 && <span className="text-muted-foreground">({count})</span>}
            </a>
          );
        },
        size: 150,
        enableResizing: true,
      }),
    ],
  },

  // Group: Team
  {
    id: 'team',
    header: 'Team',
    columns: [
      columnHelper.accessor('team', {
        id: 'team',
        header: 'Team',
        cell: (info) => (
          <span className="text-sm break-words">
            {info.getValue()}
          </span>
        ),
        size: 120,
        enableResizing: true,
      }),
    ],
  },

  // Group: Assignee
  {
    id: 'assignee',
    header: 'Assignee',
    columns: [
      columnHelper.accessor('assignee', {
        id: 'assignee',
        header: 'Assignee',
        cell: (info) => (
          <span className="text-sm break-words">
            {info.getValue()}
          </span>
        ),
        size: 120,
        enableResizing: true,
      }),
    ],
  },

  // Group: Line stop date
  {
    id: 'lineStopDate',
    header: 'Line stop date',
    columns: [
      columnHelper.accessor('lineStopDate', {
        id: 'lineStopDate',
        header: 'Line stop date',
        cell: (info) => {
          const date = info.getValue();
          const isUrgent = date && new Date(date) < new Date();
          return <StatusColoredDate date={date} isUrgent={isUrgent} />;
        },
        size: 130,
        enableResizing: true,
      }),
    ],
  },

  // Group: New Delivery Date
  {
    id: 'newDeliveryDate',
    header: 'New Delivery Date',
    columns: [
      columnHelper.accessor('newDeliveryDate', {
        id: 'newDeliveryDate',
        header: 'New Delivery Date',
        cell: (info) => {
          const date = info.getValue();
          const isUrgent = date && new Date(date) < new Date();
          return <StatusColoredDate date={date} isUrgent={isUrgent} />;
        },
        size: 140,
        enableResizing: true,
      }),
    ],
  },

  // Group: Last Update time
  {
    id: 'lastUpdateTime',
    header: 'Last Update time',
    columns: [
      columnHelper.accessor('lastUpdateTime', {
        id: 'lastUpdateTime',
        header: 'Last Update time',
        cell: (info) => (
          <span className="text-sm">{formatDateTime(info.getValue())}</span>
        ),
        size: 150,
        enableResizing: true,
      }),
    ],
  },

  // Group: Last comment
  {
    id: 'lastComment',
    header: 'Last comment',
    columns: [
      columnHelper.accessor('lastComment', {
        id: 'lastComment',
        header: 'Last comment',
        cell: (info) => {
          const comment = info.getValue();
          if (!comment) return <span className="text-sm text-muted-foreground">—</span>;
          
          // Extract user mentions (e.g., @username)
          const mentionRegex = /@(\w+)/g;
          const parts = comment.split(mentionRegex);
          
          return (
            <span className="text-sm break-words">
              {parts.map((part: string, index: number) => {
                if (index % 2 === 1) {
                  // This is a mention
                  return (
                    <span key={index} className="font-semibold text-[#2063F0]">
                      @{part}
                    </span>
                  );
                }
                return <span key={index}>{part}</span>;
              })}
            </span>
          );
        },
        size: 200,
        enableResizing: true,
      }),
    ],
  },

  // Ungrouped (right utility column)
  columnHelper.display({
    id: 'rowActions',
    header: () => null,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Assign</DropdownMenuItem>
          <DropdownMenuItem>Resolve</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 50,
    enableResizing: false,
  }),
];
