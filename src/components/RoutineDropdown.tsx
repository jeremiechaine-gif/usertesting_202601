/**
 * Routine Dropdown Component
 * Displays current routine and allows selection/creation/editing
 * Same style as ScopeDropdown
 */

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { RoutineModal } from './RoutineModal';
import { getRoutines, deleteRoutine, type Routine } from '@/lib/routines';
import { ChevronDown, Plus, Edit, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface RoutineDropdownProps {
  selectedRoutineId: string | null;
  onRoutineSelect: (routineId: string | null) => void;
  // Current view state for creating routine from current view
  currentFilters?: ColumnFiltersState;
  currentSorting?: SortingState;
  currentGroupBy?: string | null;
  currentPageSize?: number;
  // Highlight when there are unsaved changes
  hasUnsavedChanges?: boolean;
  onUpdateRoutine?: () => void;
  onSaveAsRoutine?: () => void;
}

export const RoutineDropdown: React.FC<RoutineDropdownProps> = ({
  selectedRoutineId,
  onRoutineSelect,
  currentFilters = [],
  currentSorting = [],
  currentGroupBy = null,
  currentPageSize = 100,
  hasUnsavedChanges = false,
  onUpdateRoutine,
  onSaveAsRoutine,
}) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editRoutine, setEditRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    setRoutines(getRoutines());
  }, []);

  const selectedRoutine = selectedRoutineId 
    ? routines.find((r) => r.id === selectedRoutineId) 
    : null;

  const handleCreate = () => {
    setEditRoutine(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (routine: Routine) => {
    setEditRoutine(routine);
    setCreateModalOpen(true);
  };

  const handleDelete = (routineId: string) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      deleteRoutine(routineId);
      setRoutines(getRoutines());
      if (selectedRoutineId === routineId) {
        onRoutineSelect(null);
      }
    }
  };

  const handleRoutineSaved = () => {
    setRoutines(getRoutines());
    setCreateModalOpen(false);
    setEditRoutine(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className={cn(
              "h-auto px-3 py-1.5 text-sm rounded-md transition-colors",
              "bg-muted/50 hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selectedRoutine 
                ? "text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground",
              hasUnsavedChanges && selectedRoutine && "ring-2 ring-[#2063F0] ring-offset-2 bg-[#2063F0]/10"
            )}
          >
            <span>
              {selectedRoutine ? `Routine: ${selectedRoutine.name}` : 'Routine: No routine Available'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Routines</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {routines.length === 0 ? (
            <DropdownMenuItem disabled className="text-muted-foreground text-sm">
              No routines yet
            </DropdownMenuItem>
          ) : (
            routines.map((routine) => (
              <div key={routine.id} className="group">
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-muted rounded-sm">
                  <DropdownMenuItem
                    className="flex-1 p-0 cursor-pointer"
                    onClick={() => onRoutineSelect(routine.id)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className={cn(
                        "text-sm",
                        selectedRoutineId === routine.id && "font-semibold text-[#2063F0]"
                      )}>
                        {routine.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {routine.scopeMode === 'scope-aware' ? 'Scope-aware' : 'Scope-fixed'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(routine);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(routine.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreate} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create new routine
          </DropdownMenuItem>
          {selectedRoutineId && (
            <>
              <DropdownMenuSeparator />
              {hasUnsavedChanges && onUpdateRoutine && (
                <DropdownMenuItem
                  onClick={() => {
                    onUpdateRoutine();
                  }}
                  className="cursor-pointer"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Update routine
                </DropdownMenuItem>
              )}
              {hasUnsavedChanges && onSaveAsRoutine && (
                <DropdownMenuItem
                  onClick={() => {
                    onSaveAsRoutine();
                  }}
                  className="cursor-pointer"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as new routine
                </DropdownMenuItem>
              )}
              {hasUnsavedChanges && <DropdownMenuSeparator />}
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

      {createModalOpen && (
        <RoutineModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          routine={editRoutine}
          onSave={handleRoutineSaved}
          currentFilters={currentFilters}
          currentSorting={currentSorting}
          currentGroupBy={currentGroupBy}
          currentPageSize={currentPageSize}
        />
      )}
    </>
  );
};

