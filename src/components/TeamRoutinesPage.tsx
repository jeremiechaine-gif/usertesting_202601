/**
 * Team Routines Management Page
 * Manage routines for a specific team with the same design as the wizard step 4
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Zap,
  Plus,
  Building2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { getTeam, updateTeam, type Team } from '@/lib/teams';
import { getRoutines, getTeamRoutines, type Routine } from '@/lib/routines';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import { AddRoutinesModal } from './SimpleOnboardingWizard/AddRoutinesModal';
import { RecommendedRoutinesModal } from './SimpleOnboardingWizard/RecommendedRoutinesModal';
import { CreateRoutineFullPageWizard } from './CreateRoutineFullPageWizard';
import { RoutineModal } from './RoutineModal';
import { RoutineChip } from './ui/routine-chip';
import { Sidebar } from './Sidebar';

interface RoutineWithDetails {
  id: string;
  name: string;
  description?: string;
  pelicoViews?: string[];
  objectives?: string[];
}

export const TeamRoutinesPage: React.FC<{ 
  teamId: string;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}> = ({ teamId, onNavigate, onLogout }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openAddRoutinesModal, setOpenAddRoutinesModal] = useState(false);
  const [openRecommendedRoutinesModal, setOpenRecommendedRoutinesModal] = useState(false);
  const [tempSelectedRoutineIds, setTempSelectedRoutineIds] = useState<string[]>([]);
  const [tempSelectedRecommendedRoutineIds, setTempSelectedRecommendedRoutineIds] = useState<string[]>([]);
  const [viewingRoutine, setViewingRoutine] = useState<Routine | null>(null);
  const [createRoutineWizardOpen, setCreateRoutineWizardOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const loadTeam = () => {
    const loadedTeam = getTeam(teamId);
    setTeam(loadedTeam);
  };

  // Get all available routines from library
  const availableRoutines: RoutineWithDetails[] = useMemo(() => {
    return ROUTINE_LIBRARY.map(routine => ({
      id: routine.id,
      name: routine.label,
      description: routine.description,
      pelicoViews: routine.pelicoViews,
      objectives: routine.objectives,
    }));
  }, []);

  // Get user-created routines from localStorage
  const userCreatedRoutines: RoutineWithDetails[] = useMemo(() => {
    const routines = getRoutines();
    const pelicoViewPageToName: Record<string, string> = {
      'supply': 'Supply',
      'production': 'Production Control',
      'customer': 'Customer Support',
      'escalation': 'Escalation Room',
      'value-engineering': 'Value Engineering',
      'event-explorer': 'Event Explorer',
      'simulation': 'Simulation',
    };
    
    return routines.map(routine => ({
      id: routine.id,
      name: routine.name,
      description: routine.description,
      pelicoViews: routine.pelicoView ? [pelicoViewPageToName[routine.pelicoView] || routine.pelicoView] : [],
      objectives: [], // User-created routines don't have objectives
    }));
  }, [refreshKey]);

  // Combine library routines and user-created routines
  const allRoutines: RoutineWithDetails[] = useMemo(() => {
    return [...availableRoutines, ...userCreatedRoutines];
  }, [availableRoutines, userCreatedRoutines]);

  // Get routines assigned to the team, grouped by objectives
  // Uses getTeamRoutines to include both directly assigned routines and shared routines
  // This function should match the logic of getTeamRoutinesCount exactly
  const getTeamRoutinesGroupedByObjectives = (): Record<string, RoutineWithDetails[]> => {
    if (!team) return {};
    
    // Use getTeamRoutines to get all user-created routines (directly assigned + shared via routine.teamIds)
    const teamRoutines = getTeamRoutines(team.id, team.assignedRoutineIds);
    const teamRoutineIds = new Set(teamRoutines.map(r => r.id));
    
    // Map user-created team routines to RoutineWithDetails format
    const routinesWithDetails: RoutineWithDetails[] = teamRoutines.map(routine => {
      const pelicoViewPageToName: Record<string, string> = {
        'supply': 'Supply',
        'production': 'Production Control',
        'customer': 'Customer Support',
        'escalation': 'Escalation Room',
        'value-engineering': 'Value Engineering',
        'event-explorer': 'Event Explorer',
        'simulation': 'Simulation',
      };
      
      return {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        pelicoViews: routine.pelicoView ? [pelicoViewPageToName[routine.pelicoView] || routine.pelicoView] : [],
        objectives: routine.objectives || [],
      };
    });
    
    // Include library routines that are in team.assignedRoutineIds
    // (library routines are not in getRoutines(), so we need to get them from ROUTINE_LIBRARY)
    // This matches the logic in getTeamRoutinesCount
    const assignedLibraryRoutines = (team.assignedRoutineIds || [])
      .filter(id => !teamRoutineIds.has(id)) // Only library routines not already counted as user-created
      .map(id => {
        const libraryRoutine = ROUTINE_LIBRARY.find(r => r.id === id);
        if (libraryRoutine) {
          return {
            id: libraryRoutine.id,
            name: libraryRoutine.label,
            description: libraryRoutine.description || undefined,
            pelicoViews: libraryRoutine.pelicoViews,
            objectives: libraryRoutine.objectives,
          } as RoutineWithDetails;
        }
        return null;
      })
      .filter((r): r is RoutineWithDetails => r !== null);
    
    // Combine all routines (user-created + library)
    // This should match exactly what getTeamRoutinesCount returns
    const allTeamRoutines = [...routinesWithDetails, ...assignedLibraryRoutines];
    
    // Group routines by their first objective (or 'Other' if no objectives)
    const grouped: Record<string, RoutineWithDetails[]> = {};
    
    allTeamRoutines.forEach(routine => {
      if (!routine) return;
      const objectives = routine.objectives && routine.objectives.length > 0 
        ? routine.objectives 
        : ['Other'];
      
      const primaryObjective = objectives[0];
      
      if (!grouped[primaryObjective]) {
        grouped[primaryObjective] = [];
      }
      grouped[primaryObjective].push(routine);
    });
    
    // Sort routines within each group alphabetically by name
    Object.keys(grouped).forEach(objective => {
      grouped[objective].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  };

  // Define objective display order
  const OBJECTIVE_ORDER: Record<string, number> = {
    'Anticipate': 1,
    'Monitor': 2,
    'Correct': 3,
    'Prioritize': 4,
    'Report': 5,
    'Other': 6,
  };

  // Persona mapping from French to English
  const PERSONA_FR_TO_EN: Record<string, string> = {
    'Approvisionneur': 'Supply Planner',
    'Planificateur': 'Planner',
    'Responsable Production': 'Production Manager',
    'Responsable Qualité': 'Quality Manager',
    'Responsable Maintenance': 'Maintenance Manager',
    'Chef de Projet': 'Project Manager',
    'Autre / Mixte': 'Other / Mixed',
  };

  // Get suggested routines for team persona
  const getSuggestedRoutinesForPersona = (persona: string): string[] => {
    const englishPersona = PERSONA_FR_TO_EN[persona] || persona;
    return ROUTINE_LIBRARY
      .filter(r => r.personas.includes(englishPersona as any))
      .map(r => r.id);
  };

  // Check if routine is suggested for team
  const isRoutineSuggested = (routineId: string): boolean => {
    if (!team || !team.persona) return false;
    const suggestedIds = getSuggestedRoutinesForPersona(team.persona);
    return suggestedIds.includes(routineId);
  };

  // Check if team has all suggested routines
  const hasAllSuggestedRoutines = useMemo(() => {
    if (!team || !team.persona) return true;
    const suggestedIds = getSuggestedRoutinesForPersona(team.persona);
    const currentIds = team.assignedRoutineIds || [];
    return suggestedIds.every(id => currentIds.includes(id));
  }, [team]);

  // Get filtered routines (not already assigned)
  const getFilteredRoutines = (): RoutineWithDetails[] => {
    if (!team) return [];
    const selectedRoutineIds = team.assignedRoutineIds || [];
    return allRoutines.filter(routine => !selectedRoutineIds.includes(routine.id));
  };

  const handleRoutineToggle = (routineId: string) => {
    if (!team) return;

    const routineIds = team.assignedRoutineIds || [];
    const isSelected = routineIds.includes(routineId);
    
    const updatedRoutineIds = isSelected
      ? routineIds.filter(id => id !== routineId)
      : [...routineIds, routineId];

    updateTeam(team.id, { assignedRoutineIds: updatedRoutineIds });
    loadTeam();
  };

  const handleAddSelected = () => {
    if (!team) return;

    const routineIds = team.assignedRoutineIds || [];
    const routinesToAdd = tempSelectedRoutineIds.filter(id => !routineIds.includes(id));
    
    updateTeam(team.id, { assignedRoutineIds: [...routineIds, ...routinesToAdd] });
    setOpenAddRoutinesModal(false);
    setTempSelectedRoutineIds([]);
    loadTeam();
  };

  const handleViewRoutine = (routineId: string) => {
    const routine = getRoutines().find(r => r.id === routineId);
    if (routine) {
      setViewingRoutine(routine);
    }
  };

  // Handle add all suggested routines
  const handleAddAllSuggestedRoutines = () => {
    if (!team || !team.persona) return;

    const suggestedIds = getSuggestedRoutinesForPersona(team.persona);
    const currentIds = team.assignedRoutineIds || [];
    const newIds = [...new Set([...currentIds, ...suggestedIds])];

    updateTeam(team.id, { assignedRoutineIds: newIds });
    loadTeam();
  };

  // Handle clear routines
  const handleClearRoutines = () => {
    if (!team) return;

    if (confirm(`Are you sure you want to clear all routines for "${team.name}"?`)) {
      updateTeam(team.id, { assignedRoutineIds: [] });
      loadTeam();
    }
  };

  // Handle create routine
  const handleCreateRoutineClick = () => {
    setCreateRoutineWizardOpen(true);
  };

  if (!team) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex h-screen">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Team not found</p>
        </div>
      </div>
    );
  }

  const teamRoutinesGrouped = getTeamRoutinesGroupedByObjectives();
  // Count routines directly from what's displayed to ensure accuracy
  const teamRoutinesCount = Object.values(teamRoutinesGrouped).flat().length;
  const availableRoutinesForTeam = getFilteredRoutines();
  const sortedObjectives = Object.keys(teamRoutinesGrouped).sort((a, b) => {
    const orderA = OBJECTIVE_ORDER[a] || 999;
    const orderB = OBJECTIVE_ORDER[b] || 999;
    return orderA - orderB;
  });

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {!sidebarCollapsed && (
        <Sidebar 
          activeItem="users" 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(true)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-4 bg-muted/50">
        <div className="flex-1 flex flex-col overflow-hidden bg-background border border-border/60 rounded-2xl shadow-sm">
          {/* Main Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/5 via-[#2063F0]/5 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="relative px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {sidebarCollapsed && (
                    <Button 
                      variant="ghost" 
                      className="h-9 px-3 gap-2 hover:bg-[#31C7AD]/10"
                      onClick={() => setSidebarCollapsed(false)}
                    >
                      <Building2 className="w-4 h-4" />
                      <img 
                        src="/images/Pelico-small-logo.svg" 
                        alt="Pelico" 
                        className="h-4 w-auto"
                      />
                      <span className="text-sm font-medium">Menu</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('users');
                      }
                    }}
                    className="h-9 w-9 hover:bg-[#31C7AD]/10"
                    title="Back to Teams & members"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Routines de {team.name}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl">
              {/* Team Card */}
              <div className="group rounded-xl border-2 border-border bg-background hover:shadow-lg transition-all overflow-hidden">
                {/* Team Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-[#2063F0]/5 to-[#31C7AD]/5 border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base sm:text-lg break-words">{team.name}</h3>
                        {team.persona && (
                          <Badge className="text-xs bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/20 shrink-0">
                            {team.persona}
                          </Badge>
                        )}
                      </div>
                      {team.description && (
                        <p className="text-sm text-muted-foreground break-words">{team.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Clear routines button - visible when there are routines assigned */}
                      {teamRoutinesCount > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleClearRoutines}
                          className="h-8 gap-1.5 text-xs whitespace-nowrap"
                          title="Clear all routines"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Clear routines</span>
                          <span className="sm:hidden">Clear</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Content */}
                <div className="p-4 sm:p-5">
                  {/* Routines Section */}
                  <div className="space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <Zap className="h-4 w-4 text-[#31C7AD] shrink-0" />
                        <span className="text-sm font-medium">Routines ({teamRoutinesCount})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {team.persona ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setOpenRecommendedRoutinesModal(true);
                                setTempSelectedRecommendedRoutineIds([]);
                              }}
                              className="h-7 gap-1.5 text-xs whitespace-nowrap"
                            >
                              <Sparkles className="h-3 w-3 shrink-0" />
                              <span className="hidden sm:inline">View recommended</span>
                              <span className="sm:hidden">Recommended</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleAddAllSuggestedRoutines}
                              disabled={hasAllSuggestedRoutines}
                              className="h-7 gap-1.5 text-xs whitespace-nowrap"
                            >
                              <Sparkles className="h-3 w-3 shrink-0" />
                              <span className="hidden sm:inline">Add suggested</span>
                              <span className="sm:hidden">Add all</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setTempSelectedRoutineIds([]);
                                setOpenAddRoutinesModal(true);
                              }}
                              className="h-7 gap-1.5 text-xs whitespace-nowrap"
                            >
                              <Plus className="h-3 w-3 shrink-0" />
                              <span className="hidden sm:inline">Add manually</span>
                              <span className="sm:hidden">Add</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCreateRoutineClick}
                              className="h-7 gap-1.5 text-xs whitespace-nowrap"
                            >
                              <Plus className="h-3 w-3 shrink-0" />
                              <span className="hidden sm:inline">Create Routine</span>
                              <span className="sm:hidden">Create</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setTempSelectedRoutineIds([]);
                                setOpenAddRoutinesModal(true);
                              }}
                              className="h-7 gap-1.5 text-xs whitespace-nowrap"
                              disabled={availableRoutinesForTeam.length === 0}
                            >
                              <Plus className="h-3 w-3 shrink-0" />
                              <span className="hidden sm:inline">Add manually</span>
                              <span className="sm:hidden">Add</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCreateRoutineClick}
                              className="h-7 gap-1.5 text-xs whitespace-nowrap"
                            >
                              <Plus className="h-3 w-3 shrink-0" />
                              <span className="hidden sm:inline">Create Routine</span>
                              <span className="sm:hidden">Create</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Assigned Routines Display */}
                    {teamRoutinesCount === 0 ? (
                      <div className="flex items-center justify-center py-4 px-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground">No routines assigned</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedObjectives.map((objective) => {
                          const routines = teamRoutinesGrouped[objective];
                          return (
                            <div key={objective} className="space-y-2">
                              {/* Objective Section Title */}
                              <h4 className="text-sm font-semibold text-foreground/90 tracking-tight">
                                {objective}
                              </h4>
                              {/* Routines for this objective - Grid layout */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
                                {routines.map((routine) => {
                                  if (!routine.id || !routine.name) {
                                    return null;
                                  }
                                  const isSuggested = isRoutineSuggested(routine.id);
                                  return (
                                    <RoutineChip
                                      key={routine.id}
                                      name={routine.name}
                                      description={routine.description}
                                      pelicoView={routine.pelicoViews && routine.pelicoViews.length > 0 ? routine.pelicoViews[0] : undefined}
                                      selected={true}
                                      isSuggested={isSuggested}
                                      onPreview={() => {
                                        handleViewRoutine(routine.id);
                                      }}
                                      onToggle={() => handleRoutineToggle(routine.id)}
                                      addLabel="View"
                                      removeLabel="Remove"
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Routines Modal */}
      {openAddRoutinesModal && team && (
        <AddRoutinesModal
          open={openAddRoutinesModal}
          onOpenChange={(open) => {
            if (!open) {
              setOpenAddRoutinesModal(false);
              setTempSelectedRoutineIds([]);
            }
          }}
          selectedRoutineIds={tempSelectedRoutineIds}
          onRoutineToggle={(routineId) => {
            setTempSelectedRoutineIds(prev =>
              prev.includes(routineId)
                ? prev.filter(id => id !== routineId)
                : [...prev, routineId]
            );
          }}
          onAddSelected={handleAddSelected}
          alreadyAssignedRoutineIds={team.assignedRoutineIds || []}
        />
      )}

      {/* Recommended Routines Modal */}
      {openRecommendedRoutinesModal && team && team.persona && (
        <RecommendedRoutinesModal
          open={openRecommendedRoutinesModal}
          onOpenChange={(open) => {
            if (!open) {
              setOpenRecommendedRoutinesModal(false);
              setTempSelectedRecommendedRoutineIds([]);
            }
          }}
          teamId={team.id}
          teamName={team.name}
          teamPersona={team.persona}
          selectedRoutineIds={tempSelectedRecommendedRoutineIds}
          onRoutineToggle={(routineId) => {
            // Only allow toggle if not already assigned
            const alreadyAssignedIds = team.assignedRoutineIds || [];
            if (!alreadyAssignedIds.includes(routineId)) {
              setTempSelectedRecommendedRoutineIds(prev =>
                prev.includes(routineId)
                  ? prev.filter(id => id !== routineId)
                  : [...prev, routineId]
              );
            }
          }}
          onAddSelected={() => {
            if (team) {
              const routineIds = team.assignedRoutineIds || [];
              const routinesToAdd = tempSelectedRecommendedRoutineIds.filter(id => !routineIds.includes(id));
              updateTeam(team.id, { assignedRoutineIds: [...routineIds, ...routinesToAdd] });
              loadTeam();
            }
            setOpenRecommendedRoutinesModal(false);
            setTempSelectedRecommendedRoutineIds([]);
          }}
          onAddAllSuggested={handleAddAllSuggestedRoutines}
          alreadyAssignedRoutineIds={team.assignedRoutineIds || []}
        />
      )}

      {/* Create Routine Wizard */}
      {createRoutineWizardOpen && team && (
        <CreateRoutineFullPageWizard
          onClose={() => {
            setCreateRoutineWizardOpen(false);
            loadTeam();
          }}
          onRoutineCreated={(routineId) => {
            // Add routine to team
            if (team) {
              const currentRoutineIds = team.assignedRoutineIds || [];
              if (!currentRoutineIds.includes(routineId)) {
                updateTeam(team.id, {
                  assignedRoutineIds: [...currentRoutineIds, routineId],
                });
                loadTeam();
              }
            }
            setCreateRoutineWizardOpen(false);
          }}
          teamId={team.id}
        />
      )}

      {/* Routine Details Modal */}
      {viewingRoutine && (
        <RoutineModal
          open={!!viewingRoutine}
          onOpenChange={(open) => {
            if (!open) {
              setViewingRoutine(null);
            }
          }}
          routine={viewingRoutine}
          onSave={() => {
            setViewingRoutine(null);
            setRefreshKey(prev => prev + 1);
            loadTeam();
          }}
        />
      )}
    </div>
  );
};

