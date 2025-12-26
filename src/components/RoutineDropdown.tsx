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

  const handleRoutineSaved = (routineId?: string) => {
    setRoutines(getRoutines());
    setCreateModalOpen(false);
    setEditRoutine(null);
    // If a new routine was created, select it automatically
    if (routineId && !selectedRoutineId) {
      onRoutineSelect(routineId);
    }
  };

  return (
    <>
      <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline" 
                size="sm"
                className="gap-2 h-auto px-3 py-1.5"
              >
                <span>
                  {selectedRoutine 
                    ? `Routine: ${selectedRoutine.name}` 
                    : hasUnsavedChanges 
                      ? 'Créer une routine'
                      : 'Routine: No routine Available'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0" />
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
            routines.map((routine) => {
              const isSelected = selectedRoutineId === routine.id;
              const showActions = isSelected && hasUnsavedChanges;
              
              return (
                <div key={routine.id} className="group">
                  <div className={cn(
                    "flex flex-col rounded-sm relative"
                  )}>
                    {isSelected && hasUnsavedChanges && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full z-10" />
                    )}
                    <div className={cn(
                      "flex items-center justify-between px-2 py-1.5 hover:bg-muted rounded-sm"
                    )}>
                      <DropdownMenuItem
                        className="flex-1 p-0 cursor-pointer"
                        onClick={() => onRoutineSelect(routine.id)}
                      >
                        <div className="flex flex-col gap-0.5">
                        <span className={cn(
                          "text-sm",
                          isSelected && hasUnsavedChanges && "font-semibold text-foreground",
                          isSelected && !hasUnsavedChanges && "font-semibold text-[#2063F0]"
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
                    {/* Actions directly under selected routine when hasUnsavedChanges */}
                    {showActions && (
                      <div className="px-2 py-1">
                        {onUpdateRoutine && (
                          <DropdownMenuItem
                            onClick={() => {
                              onUpdateRoutine();
                            }}
                            className="cursor-pointer text-foreground hover:bg-[#FFEB3B]/20"
                          >
                            <Save className="mr-2 h-4 w-4 text-foreground" />
                            Update routine
                          </DropdownMenuItem>
                        )}
                        {onSaveAsRoutine && (
                          <DropdownMenuItem
                            onClick={() => {
                              onSaveAsRoutine();
                            }}
                            className="cursor-pointer text-foreground hover:bg-[#FFEB3B]/20"
                          >
                            <Save className="mr-2 h-4 w-4 text-foreground" />
                            Save as new routine
                          </DropdownMenuItem>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleCreate} 
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create new routine
          </DropdownMenuItem>
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

