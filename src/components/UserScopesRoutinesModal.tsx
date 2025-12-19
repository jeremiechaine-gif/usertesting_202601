/**
 * Modal for managing user's scopes and routines assignments
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Eye, X } from 'lucide-react';
import { getScopes, createScope, type Scope } from '@/lib/scopes';
import { getRoutines, createRoutine, type Routine } from '@/lib/routines';
import { updateUser, type User } from '@/lib/users';
import { type Team } from '@/lib/teams';
import { cn } from '@/lib/utils';

interface UserScopesRoutinesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  teams: Team[];
  onSave: () => void;
}

export const UserScopesRoutinesModal: React.FC<UserScopesRoutinesModalProps> = ({
  open,
  onOpenChange,
  user,
  teams,
  onSave,
}) => {
  const [allScopes, setAllScopes] = useState<Scope[]>([]);
  const [allRoutines, setAllRoutines] = useState<Routine[]>([]);
  const [selectedScopeToAdd, setSelectedScopeToAdd] = useState<string>('');
  const [selectedRoutineToAdd, setSelectedRoutineToAdd] = useState<string>('');
  const [showCreateScope, setShowCreateScope] = useState(false);
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const [newScopeName, setNewScopeName] = useState('');
  const [newRoutineName, setNewRoutineName] = useState('');

  useEffect(() => {
    if (open) {
      setAllScopes(getScopes());
      setAllRoutines(getRoutines());
    }
  }, [open]);

  // Get user's team
  const userTeam = user.teamId ? teams.find(t => t.id === user.teamId) : null;

  // Get assigned scopes (individual + team)
  const getAssignedScopes = (): Scope[] => {
    const individualScopeIds = user.assignedScopeIds || [];
    const teamScopeIds = userTeam?.assignedScopeIds || [];
    const allAssignedIds = [...new Set([...individualScopeIds, ...teamScopeIds])];
    return allScopes.filter(s => allAssignedIds.includes(s.id));
  };

  // Get assigned routines (individual + team)
  const getAssignedRoutines = (): Routine[] => {
    const individualRoutineIds = user.assignedRoutineIds || [];
    const teamRoutineIds = userTeam?.assignedRoutineIds || [];
    const allAssignedIds = [...new Set([...individualRoutineIds, ...teamRoutineIds])];
    return allRoutines.filter(r => allAssignedIds.includes(r.id));
  };

  // Get available scopes (not assigned)
  const getAvailableScopes = (): Scope[] => {
    const assignedScopes = getAssignedScopes();
    const assignedIds = assignedScopes.map(s => s.id);
    return allScopes.filter(s => !assignedIds.includes(s.id));
  };

  // Get available routines (not assigned)
  const getAvailableRoutines = (): Routine[] => {
    const assignedRoutines = getAssignedRoutines();
    const assignedIds = assignedRoutines.map(r => r.id);
    return allRoutines.filter(r => !assignedIds.includes(r.id));
  };

  // Check if scope is from team
  const isScopeFromTeam = (scopeId: string): boolean => {
    return (userTeam?.assignedScopeIds || []).includes(scopeId) && 
           !(user.assignedScopeIds || []).includes(scopeId);
  };

  // Check if routine is from team
  const isRoutineFromTeam = (routineId: string): boolean => {
    return (userTeam?.assignedRoutineIds || []).includes(routineId) && 
           !(user.assignedRoutineIds || []).includes(routineId);
  };

  const handleAddScope = (scopeId: string) => {
    const currentIds = user.assignedScopeIds || [];
    if (!currentIds.includes(scopeId)) {
      updateUser(user.id, { assignedScopeIds: [...currentIds, scopeId] });
      onSave();
      setSelectedScopeToAdd('');
    }
  };

  const handleRemoveScope = (scopeId: string) => {
    // Can only remove individual assignments, not team ones
    if (isScopeFromTeam(scopeId)) return;
    
    const currentIds = user.assignedScopeIds || [];
    updateUser(user.id, { assignedScopeIds: currentIds.filter(id => id !== scopeId) });
    onSave();
  };

  const handleAddRoutine = (routineId: string) => {
    const currentIds = user.assignedRoutineIds || [];
    if (!currentIds.includes(routineId)) {
      updateUser(user.id, { assignedRoutineIds: [...currentIds, routineId] });
      onSave();
      setSelectedRoutineToAdd('');
    }
  };

  const handleRemoveRoutine = (routineId: string) => {
    // Can only remove individual assignments, not team ones
    if (isRoutineFromTeam(routineId)) return;
    
    const currentIds = user.assignedRoutineIds || [];
    updateUser(user.id, { assignedRoutineIds: currentIds.filter(id => id !== routineId) });
    onSave();
  };

  const handleCreateScope = () => {
    if (!newScopeName.trim()) return;
    const newScope = createScope({
      name: newScopeName.trim(),
      filters: [],
      userId: user.id,
    });
    handleAddScope(newScope.id);
    setNewScopeName('');
    setShowCreateScope(false);
    setAllScopes(getScopes());
  };

  const handleCreateRoutine = () => {
    if (!newRoutineName.trim()) return;
    const newRoutine = createRoutine({
      name: newRoutineName.trim(),
      filters: [],
      sorting: [],
      scopeMode: 'scope-aware',
      createdBy: user.id,
      teamId: null,
    });
    handleAddRoutine(newRoutine.id);
    setNewRoutineName('');
    setShowCreateRoutine(false);
    setAllRoutines(getRoutines());
  };

  const assignedScopes = getAssignedScopes();
  const assignedRoutines = getAssignedRoutines();
  const availableScopes = getAvailableScopes();
  const availableRoutines = getAvailableRoutines();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Scopes & Routines for {user.name}</DialogTitle>
          <DialogDescription>
            Manage scopes and routines assigned to this user (individually or via team)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-4">
            {/* Scopes Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Scopes</h3>
                <div className="flex items-center gap-2">
                  {!showCreateScope ? (
                    <>
                      <Select value={selectedScopeToAdd} onValueChange={setSelectedScopeToAdd}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableScopes.map((scope) => (
                            <SelectItem key={scope.id} value={scope.id}>
                              {scope.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedScopeToAdd) {
                            handleAddScope(selectedScopeToAdd);
                          } else {
                            setShowCreateScope(true);
                          }
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {selectedScopeToAdd ? 'Add' : 'Create New'}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newScopeName}
                        onChange={(e) => setNewScopeName(e.target.value)}
                        placeholder="Scope name"
                        className="px-3 py-1.5 border rounded-md text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateScope();
                          if (e.key === 'Escape') {
                            setShowCreateScope(false);
                            setNewScopeName('');
                          }
                        }}
                      />
                      <Button size="sm" onClick={handleCreateScope} className="gap-2">
                        Create
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCreateScope(false);
                          setNewScopeName('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {assignedScopes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scopes assigned</p>
              ) : (
                <div className="space-y-2">
                  {assignedScopes.map((scope) => {
                    const fromTeam = isScopeFromTeam(scope.id);
                    return (
                      <div
                        key={scope.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border',
                          fromTeam && 'bg-muted/50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{scope.name}</span>
                          {fromTeam && (
                            <Badge variant="outline" className="text-xs">
                              From Team
                            </Badge>
                          )}
                          {scope.description && (
                            <span className="text-sm text-muted-foreground">
                              {scope.description}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              // TODO: Open scope details modal
                              console.log('View scope:', scope);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!fromTeam && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveScope(scope.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Routines Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Routines</h3>
                <div className="flex items-center gap-2">
                  {!showCreateRoutine ? (
                    <>
                      <Select value={selectedRoutineToAdd} onValueChange={setSelectedRoutineToAdd}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select routine" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoutines.map((routine) => (
                            <SelectItem key={routine.id} value={routine.id}>
                              {routine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedRoutineToAdd) {
                            handleAddRoutine(selectedRoutineToAdd);
                          } else {
                            setShowCreateRoutine(true);
                          }
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {selectedRoutineToAdd ? 'Add' : 'Create New'}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newRoutineName}
                        onChange={(e) => setNewRoutineName(e.target.value)}
                        placeholder="Routine name"
                        className="px-3 py-1.5 border rounded-md text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateRoutine();
                          if (e.key === 'Escape') {
                            setShowCreateRoutine(false);
                            setNewRoutineName('');
                          }
                        }}
                      />
                      <Button size="sm" onClick={handleCreateRoutine} className="gap-2">
                        Create
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCreateRoutine(false);
                          setNewRoutineName('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {assignedRoutines.length === 0 ? (
                <p className="text-sm text-muted-foreground">No routines assigned</p>
              ) : (
                <div className="space-y-2">
                  {assignedRoutines.map((routine) => {
                    const fromTeam = isRoutineFromTeam(routine.id);
                    return (
                      <div
                        key={routine.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border',
                          fromTeam && 'bg-muted/50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{routine.name}</span>
                          {fromTeam && (
                            <Badge variant="outline" className="text-xs">
                              From Team
                            </Badge>
                          )}
                          {routine.description && (
                            <span className="text-sm text-muted-foreground">
                              {routine.description}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              // TODO: Open routine details modal
                              console.log('View routine:', routine);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!fromTeam && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveRoutine(routine.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

