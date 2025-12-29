/**
 * Team Routines Management Page
 * Manage routines for a specific team with the same design as the wizard step 4
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft,
  Zap,
  Plus,
  X,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTeam, updateTeam, type Team } from '@/lib/teams';
import { getRoutines, getTeamRoutines, type Routine } from '@/lib/routines';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import { AddRoutinesModal } from './SimpleOnboardingWizard/AddRoutinesModal';
import { RoutineModal } from './RoutineModal';

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
  const [tempSelectedRoutineIds, setTempSelectedRoutineIds] = useState<string[]>([]);
  const [viewingRoutine, setViewingRoutine] = useState<Routine | null>(null);
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
  const getTeamRoutinesGroupedByObjectives = (): Record<string, RoutineWithDetails[]> => {
    if (!team) return {};
    
    const teamRoutineIds = team.assignedRoutineIds || [];
    const routines = allRoutines.filter(r => teamRoutineIds.includes(r.id));
    
    // Group routines by their first objective (or 'Other' if no objectives)
    const grouped: Record<string, RoutineWithDetails[]> = {};
    
    routines.forEach(routine => {
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
  const teamRoutinesCount = Object.values(teamRoutinesGrouped).flat().length;
  const availableRoutinesForTeam = getFilteredRoutines();
  const sortedObjectives = Object.keys(teamRoutinesGrouped).sort((a, b) => {
    const orderA = OBJECTIVE_ORDER[a] || 999;
    const orderB = OBJECTIVE_ORDER[b] || 999;
    return orderA - orderB;
  });

  return (
    <div className="fixed inset-0 z-50 bg-background flex h-screen">
      {/* Sidebar Navigation */}
      <div className="w-72 bg-muted/30 border-r border-border flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="px-6 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#2063F0] to-[#31C7AD] bg-clip-text text-transparent">
                Team Routines
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <img 
                src="/images/Pelico-small-logo.svg" 
                alt="Pelico" 
                className="h-8 w-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('users');
                  }
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage routines for {team.name}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('users');
                }
              }}
              className="w-full flex items-start gap-3 p-4 rounded-lg transition-all text-left border-2 border-border bg-background hover:border-[#2063F0]/30 hover:bg-muted/50 cursor-pointer"
            >
              <div className="flex-shrink-0 mt-0.5">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground mb-1">
                  Back to Teams
                </div>
                <div className="text-xs text-muted-foreground">
                  Return to Teams & members
                </div>
              </div>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="py-4 shrink-0">
          <div className="px-4 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Routines</span>
              <span className="font-semibold text-foreground">
                {teamRoutinesCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <div className="px-8 py-4 border-b border-border bg-background shrink-0">
          <div className="flex items-center justify-between">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-3 text-xs">
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('users');
                    }
                  }}
                  className="text-muted-foreground hover:text-[#2063F0] transition-colors"
                >
                  Teams & members
                </button>
                <span className="text-muted-foreground">/</span>
                <span className="text-[#2063F0] font-medium">{team.name}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-semibold">Routines</span>
              </div>
              
              <h2 className="text-2xl font-bold">{team.name} - Routines</h2>
              {team.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {team.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 pt-6 pb-6">
              {/* Routines Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#31C7AD]" />
                    <span className="text-sm font-medium">Routines ({teamRoutinesCount})</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTempSelectedRoutineIds([]);
                      setOpenAddRoutinesModal(true);
                    }}
                    className="h-7 gap-1.5 text-xs"
                    disabled={availableRoutinesForTeam.length === 0}
                  >
                    <Plus className="h-3 w-3" />
                    Add manually
                  </Button>
                </div>

                {/* Assigned Routines Display */}
                {teamRoutinesCount === 0 ? (
                  <div className="flex items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground">No routines assigned</p>
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
                          {/* Routines for this objective */}
                          <div className="space-y-2 pl-2 border-l-2 border-border/50">
                            {routines.map((routine) => {
                              return (
                                <div
                                  key={routine.id}
                                  className="group relative flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20 hover:border-[#31C7AD]/40 transition-all cursor-pointer"
                                  onClick={() => handleViewRoutine(routine.id)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-foreground">
                                        {routine.name}
                                      </span>
                                    </div>
                                    {routine.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                                        {routine.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-1 items-center">
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRoutineToggle(routine.id);
                                    }}
                                    className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove routine"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
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
          </ScrollArea>
        </div>
      </div>

      {/* Add Routines Modal */}
      {openAddRoutinesModal && (
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

