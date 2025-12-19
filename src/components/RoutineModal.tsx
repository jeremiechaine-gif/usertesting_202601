/**
 * Routine Modal Component
 * Create or edit a routine with name, description, configuration, and scope mode
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { createRoutine, updateRoutine, type Routine } from '@/lib/routines';
import { getScopes, type Scope } from '@/lib/scopes';
import { getCurrentUserId, getCurrentUser } from '@/lib/users';
import { getTeams, createTeam, getTeamByName, type Team } from '@/lib/teams';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface RoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: Routine | null;
  onSave: (routineId?: string) => void; // Pass routineId when creating a new routine
  // Current view state to capture
  currentFilters?: ColumnFiltersState;
  currentSorting?: SortingState;
  currentGroupBy?: string | null;
  currentPageSize?: number;
}

export const RoutineModal: React.FC<RoutineModalProps> = ({
  open,
  onOpenChange,
  routine,
  onSave,
  currentFilters = [],
  currentSorting = [],
  currentGroupBy = null,
  currentPageSize = 100,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopeMode, setScopeMode] = useState<'scope-aware' | 'scope-fixed'>('scope-aware');
  const [linkedScopeId, setLinkedScopeId] = useState<string | null>(null);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [showNewTeamInput, setShowNewTeamInput] = useState(false);
  const currentUser = getCurrentUser();
  const isManager = currentUser?.role === 'manager';

  useEffect(() => {
    setScopes(getScopes());
    setTeams(getTeams());
  }, []);

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setDescription(routine.description || '');
      setScopeMode(routine.scopeMode);
      setLinkedScopeId(routine.linkedScopeId || null);
      setSelectedTeamId(routine.teamId || null);
    } else {
      setName('');
      setDescription('');
      setScopeMode('scope-aware');
      setLinkedScopeId(null);
      setSelectedTeamId(null);
      setNewTeamName('');
      setShowNewTeamInput(false);
    }
  }, [routine, open]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Routine name is required');
      return;
    }

    if (scopeMode === 'scope-fixed' && !linkedScopeId) {
      alert('Please select a scope for scope-fixed routine');
      return;
    }

    // Handle new team creation if manager
    let finalTeamId: string | null = selectedTeamId;
    if (showNewTeamInput && newTeamName.trim() && isManager) {
      // Check if team already exists
      const existingTeam = getTeamByName(newTeamName.trim());
      if (existingTeam) {
        finalTeamId = existingTeam.id;
      } else {
        // Create new team
        const newTeam = createTeam({ name: newTeamName.trim() });
        finalTeamId = newTeam.id;
        setTeams(getTeams()); // Refresh teams list
      }
    }

    const currentUserId = getCurrentUserId();
    const routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      description: description.trim() || undefined,
      filters: currentFilters,
      sorting: currentSorting,
      groupBy: currentGroupBy,
      pageSize: currentPageSize,
      scopeMode,
      linkedScopeId: scopeMode === 'scope-fixed' ? linkedScopeId : null,
      createdBy: routine?.createdBy || currentUserId,
      teamId: finalTeamId,
    };

    if (routine) {
      updateRoutine(routine.id, routineData);
      onSave(routine.id);
    } else {
      const newRoutine = createRoutine(routineData);
      onSave(newRoutine.id); // Pass the ID of the newly created routine
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{routine ? 'Edit Routine' : 'Create New Routine'}</DialogTitle>
          <DialogDescription>
            {routine 
              ? 'Update routine configuration' 
              : 'Save current view configuration as a reusable routine'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="routine-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="routine-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter routine name"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="routine-description">Description (optional)</Label>
              <Textarea
                id="routine-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter routine description"
                rows={3}
              />
            </div>

            {/* Scope Mode */}
            <div className="space-y-3">
              <Label>Scope Mode</Label>
              <RadioGroup value={scopeMode} onValueChange={(value) => setScopeMode(value as 'scope-aware' | 'scope-fixed')}>
                <div className="flex items-start space-x-2 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="scope-aware" id="scope-aware" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="scope-aware" className="font-medium cursor-pointer">
                      Scope-aware
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Routine uses each user's own scope. Shared routine adapts to each user's data context.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="scope-fixed" id="scope-fixed" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="scope-fixed" className="font-medium cursor-pointer">
                      Scope-fixed
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Routine is linked to a specific scope. All users see the same data context.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Linked Scope (only if scope-fixed) */}
            {scopeMode === 'scope-fixed' && (
              <div className="space-y-2">
                <Label htmlFor="linked-scope">
                  Linked Scope <span className="text-destructive">*</span>
                </Label>
                <Select value={linkedScopeId || ''} onValueChange={setLinkedScopeId}>
                  <SelectTrigger id="linked-scope">
                    <SelectValue placeholder="Select a scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopes.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No scopes available. Create a scope first.
                      </div>
                    ) : (
                      scopes.map((scope) => (
                        <SelectItem key={scope.id} value={scope.id}>
                          {scope.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Share with Team */}
            <div className="space-y-2">
              <Label htmlFor="share-team">Share with Team (optional)</Label>
              <div className="space-y-2">
                <Select 
                  value={selectedTeamId || ''} 
                  onValueChange={(value) => {
                    if (value === '__new__') {
                      setShowNewTeamInput(true);
                      setSelectedTeamId(null);
                    } else {
                      setSelectedTeamId(value || null);
                      setShowNewTeamInput(false);
                      setNewTeamName('');
                    }
                  }}
                >
                  <SelectTrigger id="share-team">
                    <SelectValue placeholder="No team (private)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No team (private)</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                    {isManager && (
                      <SelectItem value="__new__">
                        + Create new team
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {showNewTeamInput && isManager && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewTeamInput(false);
                        setNewTeamName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Sharing with a team allows all team members to view this routine. Only you can edit it.
              </p>
            </div>

            {/* Current Configuration Summary */}
            <div className="space-y-2">
              <Label>Current Configuration</Label>
              <div className="rounded-md border p-4 space-y-2 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{currentFilters.length} filters</Badge>
                  <Badge variant="outline">{currentSorting.length} sorts</Badge>
                  {currentGroupBy && (
                    <Badge variant="outline">Group by: {currentGroupBy}</Badge>
                  )}
                  <Badge variant="outline">Page size: {currentPageSize}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  This routine will save the current view configuration (filters, sorting, grouping, page size).
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#2063F0] hover:bg-[#1a54d8]">
            {routine ? 'Update' : 'Create'} Routine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


