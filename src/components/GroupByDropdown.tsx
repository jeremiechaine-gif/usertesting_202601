/**
 * Group By Dropdown Component
 * Displays current group by selection
 * Same style as ScopeDropdown
 */

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupByOption {
  id: string;
  label: string;
}

interface GroupByDropdownProps {
  selectedGroupBy: string | null;
  onGroupBySelect: (groupBy: string | null) => void;
}

// Mock group by options - replace with actual data source
const groupByOptions: GroupByOption[] = [
  { id: 'none', label: 'None' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'plant', label: 'Plant' },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Status' },
];

export const GroupByDropdown: React.FC<GroupByDropdownProps> = ({
  selectedGroupBy,
  onGroupBySelect,
}) => {
  const selectedOption = selectedGroupBy 
    ? groupByOptions.find((opt) => opt.id === selectedGroupBy) 
    : null;

  const displayLabel = selectedOption 
    ? `Group by ${selectedOption.label}` 
    : 'Group by None';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 h-auto px-3 py-1.5"
        >
          <span>{displayLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Group by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groupByOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onGroupBySelect(option.id === 'none' ? null : option.id)}
            className={cn(
              "cursor-pointer",
              selectedGroupBy === option.id && "bg-muted font-medium"
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
        {selectedGroupBy && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onGroupBySelect(null)}
              className="cursor-pointer text-muted-foreground"
            >
              Clear selection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


