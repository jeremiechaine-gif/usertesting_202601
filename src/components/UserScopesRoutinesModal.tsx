/**
 * Modal for managing user's scopes and routines assignments
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Plus, Trash2, Eye, X, Target, Zap, Sparkles } from 'lucide-react';
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
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Scopes & Routines for {user.name}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Manage scopes and routines assigned to this user (individually or via team)
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-8 p-8 pb-4">
            {/* Scopes Section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 border border-[#31C7AD]/20">
                    <Target className="h-4 w-4 text-[#31C7AD]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Scopes</h3>
                    <p className="text-xs text-muted-foreground">Personal data perimeter</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!showCreateScope ? (
                    <>
                      <Select value={selectedScopeToAdd} onValueChange={setSelectedScopeToAdd}>
                        <SelectTrigger className="w-[200px] h-9 border-border/60 hover:border-[#31C7AD]/30 transition-colors">
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableScopes.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No available scopes
                            </div>
                          ) : (
                            availableScopes.map((scope) => (
                              <SelectItem key={scope.id} value={scope.id}>
                                {scope.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (selectedScopeToAdd) {
                            handleAddScope(selectedScopeToAdd);
                          } else {
                            setShowCreateScope(true);
                          }
                        }}
                        className="gap-2 h-9 border-border/60 hover:border-[#31C7AD] hover:bg-[#31C7AD]/5 hover:text-[#31C7AD] transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        {selectedScopeToAdd ? 'Add' : 'Create New'}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={newScopeName}
                        onChange={(e) => setNewScopeName(e.target.value)}
                        placeholder="Enter scope name..."
                        className="w-[200px] h-9"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateScope();
                          if (e.key === 'Escape') {
                            setShowCreateScope(false);
                            setNewScopeName('');
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateScope}
                        disabled={!newScopeName.trim()}
                        className="gap-2 h-9 bg-[#31C7AD] hover:bg-[#2ab89a]"
                      >
                        <Plus className="h-4 w-4" />
                        Create
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCreateScope(false);
                          setNewScopeName('');
                        }}
                        className="h-9 w-9 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {assignedScopes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-border/60 bg-muted/20">
                  <div className="p-3 rounded-full bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 mb-3">
                    <Target className="h-6 w-6 text-[#31C7AD]/60" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">No scopes assigned</p>
                  <p className="text-xs text-muted-foreground/70">Add a scope to define data perimeter</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {assignedScopes.map((scope) => {
                    const fromTeam = isScopeFromTeam(scope.id);
                    return (
                      <div
                        key={scope.id}
                        className={cn(
                          'group relative flex items-center justify-between p-4 rounded-xl border transition-all',
                          'hover:shadow-md hover:border-[#31C7AD]/30',
                          fromTeam
                            ? 'bg-gradient-to-r from-muted/50 to-muted/30 border-border/40'
                            : 'bg-background border-border/60 hover:bg-[#31C7AD]/5'
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "p-2 rounded-lg shrink-0 transition-colors",
                            fromTeam
                              ? "bg-muted"
                              : "bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 group-hover:from-[#31C7AD]/30 group-hover:to-[#31C7AD]/20"
                          )}>
                            <Target className={cn(
                              "h-4 w-4",
                              fromTeam ? "text-muted-foreground" : "text-[#31C7AD]"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-sm">{scope.name}</span>
                              {fromTeam && (
                                <Badge variant="secondary" className="text-xs bg-background/50 border-border/60">
                                  From Team
                                </Badge>
                              )}
                            </div>
                            {scope.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {scope.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD] transition-colors"
                            onClick={() => {
                              console.log('View scope:', scope);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!fromTeam && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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

            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Routines Section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 border border-[#2063F0]/20">
                    <Zap className="h-4 w-4 text-[#2063F0]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Routines</h3>
                    <p className="text-xs text-muted-foreground">Standard ways of working</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!showCreateRoutine ? (
                    <>
                      <Select value={selectedRoutineToAdd} onValueChange={setSelectedRoutineToAdd}>
                        <SelectTrigger className="w-[200px] h-9 border-border/60 hover:border-[#2063F0]/30 transition-colors">
                          <SelectValue placeholder="Select routine" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoutines.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No available routines
                            </div>
                          ) : (
                            availableRoutines.map((routine) => (
                              <SelectItem key={routine.id} value={routine.id}>
                                {routine.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (selectedRoutineToAdd) {
                            handleAddRoutine(selectedRoutineToAdd);
                          } else {
                            setShowCreateRoutine(true);
                          }
                        }}
                        className="gap-2 h-9 border-border/60 hover:border-[#2063F0] hover:bg-[#2063F0]/5 hover:text-[#2063F0] transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        {selectedRoutineToAdd ? 'Add' : 'Create New'}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={newRoutineName}
                        onChange={(e) => setNewRoutineName(e.target.value)}
                        placeholder="Enter routine name..."
                        className="w-[200px] h-9"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateRoutine();
                          if (e.key === 'Escape') {
                            setShowCreateRoutine(false);
                            setNewRoutineName('');
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateRoutine}
                        disabled={!newRoutineName.trim()}
                        className="gap-2 h-9 bg-[#2063F0] hover:bg-[#1a54d8]"
                      >
                        <Plus className="h-4 w-4" />
                        Create
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCreateRoutine(false);
                          setNewRoutineName('');
                        }}
                        className="h-9 w-9 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {assignedRoutines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-border/60 bg-muted/20">
                  <div className="p-3 rounded-full bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 mb-3">
                    <Zap className="h-6 w-6 text-[#2063F0]/60" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">No routines assigned</p>
                  <p className="text-xs text-muted-foreground/70">Add a routine to standardize workflows</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {assignedRoutines.map((routine) => {
                    const fromTeam = isRoutineFromTeam(routine.id);
                    return (
                      <div
                        key={routine.id}
                        className={cn(
                          'group relative flex items-center justify-between p-4 rounded-xl border transition-all',
                          'hover:shadow-md hover:border-[#2063F0]/30',
                          fromTeam
                            ? 'bg-gradient-to-r from-muted/50 to-muted/30 border-border/40'
                            : 'bg-background border-border/60 hover:bg-[#2063F0]/5'
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "p-2 rounded-lg shrink-0 transition-colors",
                            fromTeam
                              ? "bg-muted"
                              : "bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 group-hover:from-[#2063F0]/30 group-hover:to-[#2063F0]/20"
                          )}>
                            <Zap className={cn(
                              "h-4 w-4",
                              fromTeam ? "text-muted-foreground" : "text-[#2063F0]"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-sm">{routine.name}</span>
                              {fromTeam && (
                                <Badge variant="secondary" className="text-xs bg-background/50 border-border/60">
                                  From Team
                                </Badge>
                              )}
                            </div>
                            {routine.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {routine.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-[#2063F0]/10 hover:text-[#2063F0] transition-colors"
                            onClick={() => {
                              console.log('View routine:', routine);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!fromTeam && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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

        <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

