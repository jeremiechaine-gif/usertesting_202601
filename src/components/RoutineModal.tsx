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
import { Checkbox } from '@/components/ui/checkbox';
import { createRoutine, updateRoutine, type Routine } from '@/lib/routines';
import { getScopes, type Scope } from '@/lib/scopes';
import { getCurrentUserId, getCurrentUser } from '@/lib/users';
import { getTeams, createTeam, getTeamByName, type Team } from '@/lib/teams';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { Sparkles, Zap } from 'lucide-react';

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
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
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
      // Support both new teamIds and legacy teamId
      setSelectedTeamIds(routine.teamIds || (routine.teamId ? [routine.teamId] : []));
    } else {
      setName('');
      setDescription('');
      setScopeMode('scope-aware');
      setLinkedScopeId(null);
      setSelectedTeamIds([]);
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
    let finalTeamIds: string[] = [...selectedTeamIds];
    if (showNewTeamInput && newTeamName.trim() && isManager) {
      // Check if team already exists
      const existingTeam = getTeamByName(newTeamName.trim());
      if (existingTeam) {
        // Add existing team if not already selected
        if (!finalTeamIds.includes(existingTeam.id)) {
          finalTeamIds.push(existingTeam.id);
        }
      } else {
        // Create new team
        const newTeam = createTeam({ name: newTeamName.trim() });
        finalTeamIds.push(newTeam.id);
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
      teamIds: finalTeamIds.length > 0 ? finalTeamIds : [],
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
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {routine ? 'Edit Routine' : 'Create New Routine'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {routine 
                ? 'Update routine configuration' 
                : 'Save current view configuration as a reusable routine'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-8 py-6 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="routine-name" className="text-sm font-semibold">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="routine-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter routine name..."
                className="h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="routine-description" className="text-sm font-semibold">
                Description <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="routine-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter routine description..."
                rows={3}
                className="border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20 resize-none"
              />
            </div>

            {/* Scope Mode - Hidden */}
            {/* Scope Mode section is hidden but scopeMode state is still used internally */}
            
            {/* Linked Scope (only if scope-fixed) - Hidden but still functional */}
            {scopeMode === 'scope-fixed' && (
              <div className="space-y-2 hidden">
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

            {/* Share with Teams */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Share with Teams <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select one or more teams to share this routine with. All team members will be able to view it. Only you can edit it.
                </p>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 p-4 space-y-3 max-h-[200px] overflow-y-auto bg-muted/10">
                  {teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No teams available</p>
                  ) : (
                    teams.map((team) => {
                      const isSelected = selectedTeamIds.includes(team.id);
                      return (
                        <div key={team.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTeamIds([...selectedTeamIds, team.id]);
                              } else {
                                setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id));
                              }
                            }}
                            className="data-[state=checked]:bg-[#31C7AD] data-[state=checked]:border-[#31C7AD]"
                          />
                          <Label
                            htmlFor={`team-${team.id}`}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {team.name}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
                {isManager && (
                  <div className="space-y-2">
                    {showNewTeamInput ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter team name..."
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="flex-1 h-9 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newTeamName.trim()) {
                              const existingTeam = getTeamByName(newTeamName.trim());
                              if (existingTeam) {
                                if (!selectedTeamIds.includes(existingTeam.id)) {
                                  setSelectedTeamIds([...selectedTeamIds, existingTeam.id]);
                                }
                              } else {
                                const newTeam = createTeam({ name: newTeamName.trim() });
                                setSelectedTeamIds([...selectedTeamIds, newTeam.id]);
                                setTeams(getTeams());
                              }
                              setShowNewTeamInput(false);
                              setNewTeamName('');
                            } else if (e.key === 'Escape') {
                              setShowNewTeamInput(false);
                              setNewTeamName('');
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowNewTeamInput(false);
                            setNewTeamName('');
                          }}
                          className="h-9 border-border/60"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewTeamInput(true)}
                        className="h-9 border-border/60 hover:border-[#31C7AD] hover:bg-[#31C7AD]/5 hover:text-[#31C7AD] transition-all"
                      >
                        + Create new team
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {selectedTeamIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTeamIds.map((teamId) => {
                    const team = teams.find(t => t.id === teamId);
                    return team ? (
                      <Badge key={teamId} variant="secondary" className="text-xs bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/20">
                        {team.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Current Configuration Summary */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Current Configuration</Label>
              <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-gradient-to-br from-[#2063F0]/5 to-[#31C7AD]/5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-background/50 border-[#2063F0]/30 text-[#2063F0]">
                    <Zap className="h-3 w-3 mr-1" />
                    {currentFilters.length} filters
                  </Badge>
                  <Badge variant="outline" className="bg-background/50 border-[#2063F0]/30 text-[#2063F0]">
                    {currentSorting.length} sorts
                  </Badge>
                  {currentGroupBy && (
                    <Badge variant="outline" className="bg-background/50 border-[#31C7AD]/30 text-[#31C7AD]">
                      Group by: {currentGroupBy}
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-background/50 border-border/60">
                    Page size: {currentPageSize}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This routine will save the current view configuration (filters, sorting, grouping, page size).
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 border-border/60 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-9 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {routine ? 'Update' : 'Create'} Routine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


