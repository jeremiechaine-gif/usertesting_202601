/**
 * Routine Dropdown Component
 * Displays current routine and allows selection
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

interface Routine {
  id: string;
  name: string;
}

interface RoutineDropdownProps {
  selectedRoutineId: string | null;
  onRoutineSelect: (routineId: string | null) => void;
}

// Mock routines - replace with actual data source
const mockRoutines: Routine[] = [
  { id: 'routine-1', name: 'Daily Production' },
  { id: 'routine-2', name: 'Weekly Planning' },
  { id: 'routine-3', name: 'Monthly Review' },
];

export const RoutineDropdown: React.FC<RoutineDropdownProps> = ({
  selectedRoutineId,
  onRoutineSelect,
}) => {
  const selectedRoutine = selectedRoutineId 
    ? mockRoutines.find((r) => r.id === selectedRoutineId) 
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "h-auto px-3 py-1.5 text-sm rounded-md transition-colors",
            "bg-muted/50 hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selectedRoutine 
              ? "text-foreground font-medium" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>
            {selectedRoutine ? `Routine: ${selectedRoutine.name}` : 'Routine: No routine Available'}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Routines</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockRoutines.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground text-sm">
            No routines available
          </DropdownMenuItem>
        ) : (
          mockRoutines.map((routine) => (
            <DropdownMenuItem
              key={routine.id}
              onClick={() => onRoutineSelect(routine.id)}
              className={cn(
                "cursor-pointer",
                selectedRoutineId === routine.id && "bg-muted font-medium"
              )}
            >
              {routine.name}
            </DropdownMenuItem>
          ))
        )}
        {selectedRoutineId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onRoutineSelect(null)}
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

