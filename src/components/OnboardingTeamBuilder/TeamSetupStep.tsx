/**
 * Step 1: Team Names & Routines
 * Create teams and assign routines to each team
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Zap, Plus, Edit2, Trash2, AlertCircle, X, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Persona } from '@/lib/onboarding/types';
import { getPersonasFromRoutineWizard, wasCompleteListSelected, getSuggestedRoutinesForPersona } from '@/lib/onboarding/teamWizardUtils';
import { getTeamByName } from '@/lib/teams';
import { getCreatedRoutines } from '@/lib/onboarding/teamWizardUtils';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export interface TeamConfig {
  id?: string; // If team already exists
  name: string;
  description?: string;
  persona?: Persona; // If created from persona
  memberIds: string[];
  routineIds: string[];
  scopeIds: string[];
}

interface TeamSetupStepProps {
  configurationType: 'personas' | 'manual';
  teams: TeamConfig[];
  onTeamsChange: (teams: TeamConfig[]) => void;
  onBack: () => void;
  onNext: () => void;
  onClearAll: () => void;
}

interface RoutineWithDetails {
  id: string;
  name: string;
  description?: string;
  personas?: Persona[];
  pelicoViews?: string[];
}

export const TeamSetupStep: React.FC<TeamSetupStepProps> = ({
  configurationType,
  teams,
  onTeamsChange,
  onBack,
  onNext,
  onClearAll,
}) => {
  const [editingTeam, setEditingTeam] = useState<TeamConfig | null>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [availableRoutines, setAvailableRoutines] = useState<RoutineWithDetails[]>([]);
  const [routineSearchQuery, setRoutineSearchQuery] = useState<Record<number, string>>({});
  const [openRoutinePopover, setOpenRoutinePopover] = useState<number | null>(null);
  const [routineAddMode, setRoutineAddMode] = useState<Record<number, 'personas' | 'manual'>>({});
  const [duplicateTeamDialog, setDuplicateTeamDialog] = useState<{
    open: boolean;
    teamName: string;
    existingTeamId?: string;
    onConfirm: (useExisting: boolean) => void;
  }>({ open: false, teamName: '', onConfirm: () => {} });

  // Load available routines
  useEffect(() => {
    const routines = getCreatedRoutines();
    const routinesWithDetails: RoutineWithDetails[] = routines.map(routine => {
      const libraryRoutine = ROUTINE_LIBRARY.find(
        (lr: any) => lr.label === routine.name
      );
      return {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        personas: libraryRoutine?.personas || [],
        pelicoViews: libraryRoutine?.pelicoViews || [],
      };
    });
    setAvailableRoutines(routinesWithDetails);
  }, []);

  // Auto-create teams from personas if configuration type is 'personas'
  useEffect(() => {
    if (configurationType === 'personas' && teams.length === 0) {
      // Check if user selected "Complete List" - don't auto-create teams
      if (wasCompleteListSelected()) {
        return;
      }
      
      // Get personas from the "Create Routine" wizard
      const personas = getPersonasFromRoutineWizard();
      if (personas.length > 0) {
        const autoTeams: TeamConfig[] = personas.map(persona => ({
          name: `${persona} Team`,
          description: `Team for ${persona} role`,
          persona,
          memberIds: [],
          routineIds: [],
          scopeIds: [],
        }));
        onTeamsChange(autoTeams);
      }
    }
  }, [configurationType, teams.length, onTeamsChange]);

  // Initialize default mode to 'personas' for teams with personas
  useEffect(() => {
    const updatedMode: Record<number, 'personas' | 'manual'> = { ...routineAddMode };
    let hasChanges = false;
    teams.forEach((team, index) => {
      if (team.persona && updatedMode[index] === undefined) {
        updatedMode[index] = 'personas';
        hasChanges = true;
      }
    });
    if (hasChanges) {
      setRoutineAddMode(updatedMode);
    }
  }, [teams.length, teams.map(t => t.persona).join(',')]);

  // Auto-suggest routines for teams based on personas
  useEffect(() => {
    if (teams.length > 0 && availableRoutines.length > 0) {
      const updatedTeams = teams.map(team => {
        // Only suggest if team has no routines yet and has a persona
        if (team.routineIds.length === 0 && team.persona) {
          const suggestedRoutineIds = getSuggestedRoutinesForPersona(team.persona);
          return { ...team, routineIds: suggestedRoutineIds };
        }
        return team;
      });
      
      // Check if there are changes
      const hasChanges = updatedTeams.some((team, index) => 
        team.routineIds.length !== teams[index].routineIds.length
      );
      
      if (hasChanges) {
        onTeamsChange(updatedTeams);
      }
    }
  }, [availableRoutines.length, teams.length]);

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;

    // Check if team name already exists
    const existingTeam = getTeamByName(newTeamName.trim());
    if (existingTeam) {
      setDuplicateTeamDialog({
        open: true,
        teamName: newTeamName.trim(),
        existingTeamId: existingTeam.id,
        onConfirm: (useExisting: boolean) => {
          if (useExisting) {
            const teamConfig: TeamConfig = {
              id: existingTeam.id,
              name: existingTeam.name,
              description: existingTeam.description,
              memberIds: [],
              routineIds: [],
              scopeIds: [],
            };
            onTeamsChange([...teams, teamConfig]);
          } else {
            const teamConfig: TeamConfig = {
              name: `${newTeamName.trim()} (2)`,
              description: newTeamDescription.trim() || undefined,
              memberIds: [],
              routineIds: [],
              scopeIds: [],
            };
            onTeamsChange([...teams, teamConfig]);
          }
          setNewTeamName('');
          setNewTeamDescription('');
          setShowAddTeam(false);
          setDuplicateTeamDialog({ open: false, teamName: '', onConfirm: () => {} });
        },
      });
      return;
    }

    // Create new team
    const teamConfig: TeamConfig = {
      name: newTeamName.trim(),
      description: newTeamDescription.trim() || undefined,
      memberIds: [],
      routineIds: [],
      scopeIds: [],
    };
    onTeamsChange([...teams, teamConfig]);
    setNewTeamName('');
    setNewTeamDescription('');
    setShowAddTeam(false);
  };

  const handleEditTeam = (team: TeamConfig, index: number) => {
    setEditingTeam({ ...team });
  };

  const handleSaveEdit = () => {
    if (!editingTeam || !editingTeam.name.trim()) return;

    const index = teams.findIndex(t => 
      editingTeam.id ? t.id === editingTeam.id : t.name === editingTeam.name
    );
    if (index === -1) return;

    // Check if new name conflicts with existing team
    if (editingTeam.name !== teams[index].name) {
      const existingTeam = getTeamByName(editingTeam.name.trim());
      if (existingTeam && existingTeam.id !== editingTeam.id) {
        setDuplicateTeamDialog({
          open: true,
          teamName: editingTeam.name.trim(),
          existingTeamId: existingTeam.id,
          onConfirm: (useExisting: boolean) => {
            if (useExisting) {
              const updatedTeams = [...teams];
              updatedTeams[index] = {
                id: existingTeam.id,
                name: existingTeam.name,
                description: existingTeam.description,
                memberIds: teams[index].memberIds,
                routineIds: teams[index].routineIds,
                scopeIds: teams[index].scopeIds,
              };
              onTeamsChange(updatedTeams);
            } else {
              const updatedTeams = [...teams];
              updatedTeams[index] = {
                ...editingTeam,
                name: `${editingTeam.name.trim()} (2)`,
              };
              onTeamsChange(updatedTeams);
            }
            setEditingTeam(null);
            setDuplicateTeamDialog({ open: false, teamName: '', onConfirm: () => {} });
          },
        });
        return;
      }
    }

    // Update team
    const updatedTeams = [...teams];
    updatedTeams[index] = editingTeam;
    onTeamsChange(updatedTeams);
    setEditingTeam(null);
  };

  const handleDeleteTeam = (index: number) => {
    const updatedTeams = teams.filter((_, i) => i !== index);
    onTeamsChange(updatedTeams);
  };

  const handleRoutineToggle = (teamIndex: number, routineId: string) => {
    const updatedTeams = [...teams];
    const team = updatedTeams[teamIndex];
    const routineIndex = team.routineIds.indexOf(routineId);
    
    if (routineIndex === -1) {
      team.routineIds.push(routineId);
    } else {
      team.routineIds.splice(routineIndex, 1);
    }
    
    onTeamsChange(updatedTeams);
    
    // Close popover after adding routine manually
    if (routineAddMode[teamIndex] === 'manual' && routineIndex === -1) {
      // Keep popover open for multiple selections, but close if all routines are assigned
      const availableRoutines = getFilteredRoutines(teamIndex);
      if (availableRoutines.length === 0) {
        setOpenRoutinePopover(null);
      }
    }
  };

  const handleAddAllSuggestedRoutines = (teamIndex: number) => {
    const team = teams[teamIndex];
    if (!team.persona) return;
    
    const suggestedRoutineIds = getSuggestedRoutinesForPersona(team.persona);
    const updatedTeams = [...teams];
    const updatedTeam = updatedTeams[teamIndex];
    
    // Add all suggested routines that aren't already added
    let addedCount = 0;
    suggestedRoutineIds.forEach(routineId => {
      if (!updatedTeam.routineIds.includes(routineId)) {
        updatedTeam.routineIds.push(routineId);
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      onTeamsChange(updatedTeams);
    }
  };

  const getFilteredRoutines = (teamIndex: number): RoutineWithDetails[] => {
    const query = routineSearchQuery[teamIndex] || '';
    const team = teams[teamIndex];
    const selectedRoutineIds = team?.routineIds || [];
    
    return availableRoutines.filter(routine => {
      const matchesSearch = !query || 
        routine.name.toLowerCase().includes(query.toLowerCase()) ||
        routine.description?.toLowerCase().includes(query.toLowerCase());
      const isNotSelected = !selectedRoutineIds.includes(routine.id);
      return matchesSearch && isNotSelected;
    });
  };

  const getSuggestedRoutinesForTeam = (teamIndex: number): RoutineWithDetails[] => {
    const team = teams[teamIndex];
    if (!team.persona) return [];
    
    const suggestedRoutineIds = getSuggestedRoutinesForPersona(team.persona);
    const selectedRoutineIds = team.routineIds || [];
    
    // Return suggested routines that aren't already selected
    return availableRoutines.filter(routine => 
      suggestedRoutineIds.includes(routine.id) && !selectedRoutineIds.includes(routine.id)
    );
  };

  const getTeamRoutines = (teamIndex: number): RoutineWithDetails[] => {
    const team = teams[teamIndex];
    return availableRoutines.filter(r => team.routineIds.includes(r.id));
  };

  const isRoutineSuggested = (teamIndex: number, routineId: string): boolean => {
    const team = teams[teamIndex];
    if (!team.persona) return false;
    const suggestedIds = getSuggestedRoutinesForPersona(team.persona);
    return suggestedIds.includes(routineId);
  };

  const canContinue = teams.length > 0;
  
  // Check for special cases
  const isCompleteList = configurationType === 'personas' && wasCompleteListSelected();
  const hasNoPersonas = configurationType === 'personas' && teams.length === 0 && getPersonasFromRoutineWizard().length === 0;

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-8 pt-4 space-y-6 pb-0">
            {/* Info Banner */}
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-xl",
              isCompleteList || hasNoPersonas
                ? "bg-orange-500/10 border border-orange-500/20"
                : "bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5"
            )}>
              <div className={cn(
                "p-2 rounded-lg",
                isCompleteList || hasNoPersonas
                  ? "bg-orange-500/20"
                  : "bg-[#31C7AD]/10"
              )}>
                <AlertCircle className={cn(
                  "h-5 w-5",
                  isCompleteList || hasNoPersonas
                    ? "text-orange-500"
                    : "text-[#31C7AD]"
                )} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {isCompleteList
                    ? 'Manual team creation required'
                    : hasNoPersonas
                    ? 'No roles selected'
                    : 'Create teams and assign routines'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isCompleteList
                    ? 'You selected "Complete List" in the routine wizard, so teams cannot be created automatically. Please create teams manually below.'
                    : hasNoPersonas
                    ? 'No roles were selected in the "Create Routine" wizard. Please create teams manually below.'
                    : configurationType === 'personas'
                    ? teams.length > 0
                      ? 'Teams have been created from your selected roles. Assign routines to each team. Routines are automatically suggested based on personas.'
                      : 'Teams will be created from your selected roles. Assign routines to each team. Routines are automatically suggested based on personas.'
                    : 'Create teams and assign routines. Routines can be shared across multiple teams.'}
                </p>
              </div>
              {teams.length > 0 && (
                <div className="shrink-0">
                  <div className="px-2.5 py-1 rounded-full bg-[#2063F0]/10 border border-[#2063F0]/20">
                    <span className="text-xs font-semibold text-[#2063F0]">
                      {teams.length} team{teams.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Teams List */}
            <div className="space-y-4">
              {teams.map((team, index) => {
                const teamRoutines = getTeamRoutines(index);
                const availableRoutinesForTeam = getFilteredRoutines(index);
                const currentMode = routineAddMode[index] || (team.persona ? 'personas' : 'manual');
                const suggestedRoutines = team.persona ? getSuggestedRoutinesForTeam(index) : [];
                const hasAllSuggestedRoutines = team.persona && suggestedRoutines.length === 0;
                
                return (
                  <div
                    key={index}
                    className="rounded-xl border-2 border-border bg-background hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Team Header */}
                    <div className="p-5 bg-gradient-to-br from-[#2063F0]/5 to-[#31C7AD]/5 border-b border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            {team.persona && (
                              <Badge className="text-xs bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/20">
                                {team.persona}
                              </Badge>
                            )}
                            {team.id && (
                              <Badge variant="outline" className="text-xs">
                                Existing
                              </Badge>
                            )}
                          </div>
                          {team.description && (
                            <p className="text-sm text-muted-foreground">{team.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTeam(team, index)}
                            className="h-8 w-8 p-0"
                            title="Edit team"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTeam(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete team"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Team Content */}
                    <div className="p-5">
                      {/* Routines Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-[#31C7AD]" />
                            <span className="text-sm font-medium">Routines ({teamRoutines.length})</span>
                          </div>
                          <div className="flex items-center gap-0">
                            {/* Segmented Control */}
                            {team.persona ? (
                              <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
                                <button
                                  onClick={() => {
                                    setRoutineAddMode({ ...routineAddMode, [index]: 'personas' });
                                    handleAddAllSuggestedRoutines(index);
                                  }}
                                  disabled={hasAllSuggestedRoutines}
                                  className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                    currentMode !== 'manual' 
                                      ? "bg-background text-foreground shadow-sm" 
                                      : "text-muted-foreground hover:text-foreground",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                  )}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3" />
                                    Add from personas
                                  </div>
                                </button>
                                <Popover 
                                  open={openRoutinePopover === index && currentMode === 'manual'}
                                  onOpenChange={(open) => {
                                    if (open) {
                                      setRoutineAddMode({ ...routineAddMode, [index]: 'manual' });
                                      setOpenRoutinePopover(index);
                                    } else {
                                      setOpenRoutinePopover(null);
                                      setRoutineSearchQuery({ ...routineSearchQuery, [index]: '' });
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <button
                                      onClick={() => {
                                        setRoutineAddMode({ ...routineAddMode, [index]: 'manual' });
                                        setOpenRoutinePopover(index);
                                      }}
                                      disabled={availableRoutinesForTeam.length === 0}
                                      className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                        currentMode === 'manual'
                                          ? "bg-background text-foreground shadow-sm" 
                                          : "text-muted-foreground hover:text-foreground",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                      )}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Plus className="h-3 w-3" />
                                        Add manually
                                      </div>
                                    </button>
                                  </PopoverTrigger>
                            <PopoverContent className="w-96 p-0" align="end">
                              <div className="p-3 border-b border-border">
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search routines..."
                                    value={routineSearchQuery[index] || ''}
                                    onChange={(e) => setRoutineSearchQuery({ ...routineSearchQuery, [index]: e.target.value })}
                                    className="pl-8 h-9 text-sm"
                                  />
                                </div>
                              </div>
                              <ScrollArea className="max-h-[400px]">
                                <div className="p-2">
                                  {availableRoutinesForTeam.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                      {routineSearchQuery[index] ? 'No routines found' : 'All routines assigned'}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {availableRoutinesForTeam.map((routine) => {
                                        const isSuggested = isRoutineSuggested(index, routine.id);
                                        return (
                                          <button
                                            key={routine.id}
                                            onClick={() => {
                                              handleRoutineToggle(index, routine.id);
                                            }}
                                            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                                          >
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <div className="text-sm font-medium text-foreground group-hover:text-[#31C7AD] transition-colors">
                                                  {routine.name}
                                                </div>
                                                {isSuggested && (
                                                  <Badge variant="outline" className="text-xs h-4 px-1.5 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30 flex items-center gap-1">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    Suggested
                                                  </Badge>
                                                )}
                                              </div>
                                              {routine.description && (
                                                <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                  {routine.description}
                                                </div>
                                              )}
                                              <div className="flex flex-wrap gap-1 items-center">
                                                {routine.personas && routine.personas.length > 0 && (
                                                  <>
                                                    {routine.personas.map((persona) => (
                                                      <Badge
                                                        key={persona}
                                                        variant="outline"
                                                        className="text-xs h-4 px-1.5 bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/30"
                                                      >
                                                        {persona}
                                                      </Badge>
                                                    ))}
                                                  </>
                                                )}
                                                      {routine.pelicoViews && routine.pelicoViews.length > 0 && (
                                                        <>
                                                          {routine.pelicoViews.map((view) => (
                                                            <Badge
                                                              key={view}
                                                              variant="outline"
                                                              className="text-xs h-4 px-1.5 bg-pink-500/10 text-pink-600 border-pink-500/30"
                                                            >
                                                              {view}
                                                            </Badge>
                                                          ))}
                                                        </>
                                                      )}
                                              </div>
                                            </div>
                                            <Plus className="h-4 w-4 text-muted-foreground group-hover:text-[#31C7AD] transition-colors flex-shrink-0 mt-1" />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                            </div>
                            ) : (
                              <Popover 
                                open={openRoutinePopover === index}
                                onOpenChange={(open) => {
                                  setOpenRoutinePopover(open ? index : null);
                                  if (!open) {
                                    setRoutineSearchQuery({ ...routineSearchQuery, [index]: '' });
                                  }
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1.5 text-xs"
                                    disabled={availableRoutinesForTeam.length === 0}
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add Routine
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-96 p-0" align="end">
                                  <div className="p-3 border-b border-border">
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="Search routines..."
                                        value={routineSearchQuery[index] || ''}
                                        onChange={(e) => setRoutineSearchQuery({ ...routineSearchQuery, [index]: e.target.value })}
                                        className="pl-8 h-9 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <ScrollArea className="max-h-[400px]">
                                    <div className="p-2">
                                      {availableRoutinesForTeam.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-muted-foreground">
                                          {routineSearchQuery[index] ? 'No routines found' : 'All routines assigned'}
                                        </div>
                                      ) : (
                                        <div className="space-y-1">
                                          {availableRoutinesForTeam.map((routine) => {
                                            const isSuggested = isRoutineSuggested(index, routine.id);
                                            return (
                                              <button
                                                key={routine.id}
                                                onClick={() => {
                                                  handleRoutineToggle(index, routine.id);
                                                }}
                                                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                                              >
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <div className="text-sm font-medium text-foreground group-hover:text-[#31C7AD] transition-colors">
                                                      {routine.name}
                                                    </div>
                                                    {isSuggested && (
                                                      <Badge variant="outline" className="text-xs h-4 px-1.5 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30 flex items-center gap-1">
                                                        <Sparkles className="h-2.5 w-2.5" />
                                                        Suggested
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  {routine.description && (
                                                    <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                      {routine.description}
                                                    </div>
                                                  )}
                                                  <div className="flex flex-wrap gap-1 items-center">
                                                    {routine.personas && routine.personas.length > 0 && (
                                                      <>
                                                        {routine.personas.map((persona) => (
                                                          <Badge
                                                            key={persona}
                                                            variant="outline"
                                                            className="text-xs h-4 px-1.5 bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/30"
                                                          >
                                                            {persona}
                                                          </Badge>
                                                        ))}
                                                      </>
                                                    )}
                                                      {routine.pelicoViews && routine.pelicoViews.length > 0 && (
                                                        <>
                                                          {routine.pelicoViews.map((view) => (
                                                            <Badge
                                                              key={view}
                                                              variant="outline"
                                                              className="text-xs h-4 px-1.5 bg-pink-500/10 text-pink-600 border-pink-500/30"
                                                            >
                                                              {view}
                                                            </Badge>
                                                          ))}
                                                        </>
                                                      )}
                                                  </div>
                                                </div>
                                                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-[#31C7AD] transition-colors flex-shrink-0 mt-1" />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </ScrollArea>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>

                        {/* Selected Routines */}
                        {teamRoutines.length > 0 ? (
                          <div className="space-y-2">
                            {teamRoutines.map((routine) => {
                              const isSuggested = isRoutineSuggested(index, routine.id);
                              return (
                                <div
                                  key={routine.id}
                                  className="group relative flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20 hover:border-[#31C7AD]/40 transition-all"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-foreground">
                                        {routine.name}
                                      </span>
                                      {isSuggested && (
                                        <Badge variant="outline" className="text-xs h-4 px-1.5 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30 flex items-center gap-1">
                                          <Sparkles className="h-2.5 w-2.5" />
                                          Suggested
                                        </Badge>
                                      )}
                                    </div>
                                    {routine.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                                        {routine.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-1 items-center">
                                      {routine.personas && routine.personas.length > 0 && (
                                        <>
                                          {routine.personas.map((persona) => (
                                            <Badge
                                              key={persona}
                                              variant="outline"
                                              className="text-xs h-4 px-1.5 bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/30"
                                            >
                                              {persona}
                                            </Badge>
                                          ))}
                                        </>
                                      )}
                                                      {routine.pelicoViews && routine.pelicoViews.length > 0 && (
                                                        <>
                                                          {routine.pelicoViews.map((view) => (
                                                            <Badge
                                                              key={view}
                                                              variant="outline"
                                                              className="text-xs h-4 px-1.5 bg-pink-500/10 text-pink-600 border-pink-500/30"
                                                            >
                                                              {view}
                                                            </Badge>
                                                          ))}
                                                        </>
                                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRoutineToggle(index, routine.id)}
                                    className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove routine"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-4 px-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
                            <p className="text-xs text-muted-foreground">No routines assigned</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Team Button */}
            <div className="pt-2">
              {showAddTeam ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-border bg-muted/30 space-y-3">
                  <Input
                    placeholder="Team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="h-10"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    className="h-10"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAddTeam}
                      disabled={!newTeamName.trim()}
                      className="h-9"
                    >
                      Add Team
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowAddTeam(false);
                        setNewTeamName('');
                        setNewTeamDescription('');
                      }}
                      className="h-9"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowAddTeam(true)}
                  className="w-full h-11 border-2 border-dashed hover:border-[#31C7AD] hover:bg-[#31C7AD]/5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border/50 bg-background shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-[#2063F0] hover:bg-[#2063F0]/5 gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                Clear All
              </Button>
            </div>
            <Button
              onClick={onNext}
              disabled={!canContinue}
              className="gap-2 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Team Dialog */}
      {editingTeam && (
        <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>Modify team name and description</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Team name"
                value={editingTeam.name}
                onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={editingTeam.description || ''}
                onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value || undefined })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTeam(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editingTeam.name.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Duplicate Team Dialog */}
      <Dialog open={duplicateTeamDialog.open} onOpenChange={(open) => 
        !open && setDuplicateTeamDialog({ open: false, teamName: '', onConfirm: () => {} })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Team Already Exists
            </DialogTitle>
            <DialogDescription>
              A team with the name "{duplicateTeamDialog.teamName}" already exists. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => duplicateTeamDialog.onConfirm(true)}
              className="w-full sm:w-auto"
            >
              Use Existing Team
            </Button>
            <Button
              onClick={() => duplicateTeamDialog.onConfirm(false)}
              className="w-full sm:w-auto"
            >
              Create New Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
