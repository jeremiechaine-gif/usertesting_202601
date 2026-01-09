/**
 * Step 2: Routine Selection
 * Choose routines for each team with the same design as "Manage Your Teams"
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Zap,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  AlertCircle,
  ArrowLeft,
  Eye,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleTeamConfig } from './SimpleOnboardingWizard';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type { RoutineLibraryEntry } from '@/lib/onboarding/types';
import { AddRoutinesModal } from './AddRoutinesModal';
import { CreateRoutineFullPageWizard } from '../CreateRoutineFullPageWizard';
import { getRoutines } from '@/lib/routines';
import { Substep4_1_RecommendedRoutines } from './RoutineSelectionStep/Substep4_1_RecommendedRoutines';
import { Substep4_2_RoutinePreview } from './RoutineSelectionStep/Substep4_2_RoutinePreview';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';

export type RoutineSelectionSubstep = 
  | 'team-selection'           // Sélection finale (vue actuelle)
  | 'recommended-routines'     // Sous-étape 4.1 : Routines recommandées
  | 'routine-preview'           // Sous-étape 4.2 : Aperçu de routine
  | 'routine-selection';        // Alias pour team-selection (backward compat)
export type CreateRoutineStep = 'choose-view' | 'configure-table' | 'save';

interface RoutineSelectionStepProps {
  teams: SimpleTeamConfig[];
  onTeamsUpdate: (teams: SimpleTeamConfig[]) => void;
  onNext: () => void;
  onBack: () => void;
  onClearAll: () => void;
  currentSubstep?: RoutineSelectionSubstep | string;
  onSubstepChange?: (substep: RoutineSelectionSubstep | string) => void;
  routineCreationStep?: CreateRoutineStep | null;
  onRoutineCreationStepChange?: (step: CreateRoutineStep | null) => void;
  onRoutineNameChange?: (name: string) => void; // Expose routine name for footer validation
  onCancelRoutineCreation?: () => void; // Callback to cancel routine creation
  // Expose handlers for footer actions
  onContinueFromRecommendedRef?: React.MutableRefObject<(() => void) | null>;
  onAddRoutineFromPreviewRef?: React.MutableRefObject<(() => void) | null>;
  onBackFromPreviewRef?: React.MutableRefObject<(() => void) | null>;
}

interface RoutineWithDetails {
  id: string;
  name: string;
  description?: string;
  personas?: string[];
  pelicoViews?: string[];
  objectives?: string[];
}

export const RoutineSelectionStep: React.FC<RoutineSelectionStepProps> = ({
  teams,
  onTeamsUpdate,
  onNext,
  onBack,
  onClearAll,
  currentSubstep = 'team-selection',
  onSubstepChange,
  routineCreationStep,
  onRoutineCreationStepChange,
  onRoutineNameChange,
  onCancelRoutineCreation,
  onContinueFromRecommendedRef,
  onAddRoutineFromPreviewRef,
  onBackFromPreviewRef,
}) => {
  const [routineAddMode, setRoutineAddMode] = useState<Record<string, 'personas' | 'manual'>>({});
  const [openAddRoutinesModal, setOpenAddRoutinesModal] = useState<string | null>(null);
  const [creatingRoutineForTeam, setCreatingRoutineForTeam] = useState<string | null>(null);
  const [tempSelectedRoutineIds, setTempSelectedRoutineIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh when routines are created
  
  // State for new substeps flow
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [previewingRoutineId, setPreviewingRoutineId] = useState<string | null>(null);
  const [tempRoutineConfigs, setTempRoutineConfigs] = useState<Record<string, { filters: ColumnFiltersState; sorting: SortingState }>>({});
  // Store current preview filters/sorting for footer button
  const [currentPreviewFilters, setCurrentPreviewFilters] = useState<ColumnFiltersState>([]);
  const [currentPreviewSorting, setCurrentPreviewSorting] = useState<SortingState>([]);

  // Get all available routines from library
  const availableRoutines: RoutineWithDetails[] = useMemo(() => {
    return ROUTINE_LIBRARY.map(routine => ({
      id: routine.id,
      name: routine.label,
      description: routine.description,
      personas: routine.personas,
      pelicoViews: routine.pelicoViews,
      objectives: routine.objectives,
    }));
  }, []);

  // Get user-created routines from localStorage
  const userCreatedRoutines: RoutineWithDetails[] = useMemo(() => {
    const routines = getRoutines();
    // Map PelicoViewPage to PelicoView name for display
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
      personas: [], // User-created routines don't have personas
      pelicoViews: routine.pelicoView ? [pelicoViewPageToName[routine.pelicoView] || routine.pelicoView] : [],
      objectives: routine.objectives && routine.objectives.length > 0 
        ? routine.objectives.map(obj => typeof obj === 'string' ? obj : String(obj))
        : [], // Include objectives from routine if they exist
    }));
  }, [refreshKey]); // Refresh when refreshKey changes

  // Combine library routines and user-created routines
  const allRoutines: RoutineWithDetails[] = useMemo(() => {
    return [...availableRoutines, ...userCreatedRoutines];
  }, [availableRoutines, userCreatedRoutines]);

  // Map French persona names to English for ROUTINE_LIBRARY lookup
  const PERSONA_FR_TO_EN: Record<string, string> = {
    'Approvisionneur': 'Supply Planner',
    'Acheteur': 'Buyer',
    'Manager Appro': 'Procurement Manager',
    'Ordonnanceur Assemblage': 'Assembly Scheduler',
    'Ordonnanceur': 'Scheduler',
    'Master Planner': 'Master Planner',
    'Support Logistique': 'Logistics Support',
    'Recette': 'Quality Control',
    'Responsable Supply Chain': 'Supply Chain Manager',
    'Directeur Supply Chain': 'Supply Chain Director',
    'Responsable Ordo & Support log': 'Scheduling & Logistics Manager',
    'Autre / Mixte': 'Other / Mixed',
  };

  // Get suggested routines for team persona
  const getSuggestedRoutinesForPersona = (persona: string): string[] => {
    const englishPersona = PERSONA_FR_TO_EN[persona] || persona;
    return ROUTINE_LIBRARY
      .filter(r => r.personas.includes(englishPersona as any))
      .map(r => r.id);
  };

  // Get routines assigned to a team, grouped by objectives
  const getTeamRoutinesGroupedByObjectives = (teamId: string): Record<string, RoutineWithDetails[]> => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return {};
    
    // Use allRoutines instead of availableRoutines to include user-created routines
    const routines = allRoutines.filter(r => team.assignedRoutineIds.includes(r.id));
    
    // Group routines by their first objective (or 'Other' if no objectives)
    const grouped: Record<string, RoutineWithDetails[]> = {};
    
    routines.forEach(routine => {
      const objectives = routine.objectives && routine.objectives.length > 0 
        ? routine.objectives 
        : ['Other'];
      
      // Use the first objective as the primary grouping key
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

  // Define objective display order (for consistent ordering)
  const OBJECTIVE_ORDER: Record<string, number> = {
    'Anticipate': 1,
    'Monitor': 2,
    'Correct': 3,
    'Prioritize': 4,
    'Report': 5,
    'Other': 6,
  };

  // Get filtered routines for a team (not already assigned)
  const getFilteredRoutines = (teamId: string): RoutineWithDetails[] => {
    const team = teams.find(t => t.id === teamId);
    const selectedRoutineIds = team?.assignedRoutineIds || [];
    
    // Use allRoutines instead of availableRoutines to include user-created routines
    return allRoutines.filter(routine => {
      const isNotSelected = !selectedRoutineIds.includes(routine.id);
      return isNotSelected;
    });
  };

  // Get suggested routines for a team
  const getSuggestedRoutinesForTeam = (teamId: string): RoutineWithDetails[] => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !team.persona) return [];
    
    const suggestedRoutineIds = getSuggestedRoutinesForPersona(team.persona);
    const selectedRoutineIds = team.assignedRoutineIds || [];
    
    // Only suggest library routines, not user-created ones
    return availableRoutines.filter(routine => 
      suggestedRoutineIds.includes(routine.id) && !selectedRoutineIds.includes(routine.id)
    );
  };

  // Check if routine is suggested for team
  const isRoutineSuggested = (teamId: string, routineId: string): boolean => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !team.persona) return false;
    const suggestedIds = getSuggestedRoutinesForPersona(team.persona);
    return suggestedIds.includes(routineId);
  };

  // Toggle routine selection
  const handleRoutineToggle = (teamId: string, routineId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const updatedTeams = teams.map(t => {
      if (t.id === teamId) {
        const routineIds = t.assignedRoutineIds || [];
        const isSelected = routineIds.includes(routineId);
        return {
          ...t,
          assignedRoutineIds: isSelected
            ? routineIds.filter(id => id !== routineId)
            : [...routineIds, routineId],
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    onTeamsUpdate(updatedTeams);
  };

  // Handle routine creation
  const handleRoutineCreated = (teamId: string, routineId: string) => {
    const updatedTeams = teams.map(t => {
      if (t.id === teamId) {
        const routineIds = t.assignedRoutineIds || [];
        if (!routineIds.includes(routineId)) {
          return {
            ...t,
            assignedRoutineIds: [...routineIds, routineId],
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return t;
    });
    onTeamsUpdate(updatedTeams);
    setCreatingRoutineForTeam(null);
    // Force refresh to reload user-created routines
    setRefreshKey(prev => prev + 1);
  };

  // Add all suggested routines (only those not already added)
  const handleAddAllSuggestedRoutines = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !team.persona) return;
    
    const suggestedRoutineIds = getSuggestedRoutinesForPersona(team.persona);
    const updatedTeams = teams.map(t => {
      if (t.id === teamId) {
        const routineIds = t.assignedRoutineIds || [];
        const routinesToAdd = suggestedRoutineIds.filter(id => !routineIds.includes(id));
        
        // Only update if there are routines to add
        if (routinesToAdd.length > 0) {
          return {
            ...t,
            assignedRoutineIds: [...routineIds, ...routinesToAdd],
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return t;
    });
    
    onTeamsUpdate(updatedTeams);
  };

  const canContinue = teams.every(team => team.assignedRoutineIds.length > 0);

  // Initialize routine creation step when starting to create a routine
  const handleCreateRoutineClick = (teamId: string) => {
    setCreatingRoutineForTeam(teamId);
    if (onRoutineCreationStepChange) {
      onRoutineCreationStepChange('choose-view');
    }
  };

  // Track routine name for validation in footer
  const [routineNameForValidation, setRoutineNameForValidation] = useState('');

  // Close routine creation when routineCreationStep is reset to null
  React.useEffect(() => {
    if (routineCreationStep === null && creatingRoutineForTeam) {
      setCreatingRoutineForTeam(null);
      setRoutineNameForValidation('');
      if (onSubstepChange) {
        onSubstepChange('team-selection');
      }
    }
  }, [routineCreationStep, creatingRoutineForTeam, onSubstepChange]);

  // Get teams with persona for guided flow
  const teamsWithPersona = useMemo(() => teams.filter(t => t.persona), [teams]);
  const hasMoreTeamsWithPersona = currentTeamIndex < teamsWithPersona.length - 1;

  // Get current team for substeps (use teamsWithPersona if in recommended flow)
  const currentTeamForSubstep = useMemo(() => {
    if (currentSubstep === 'recommended-routines' || currentSubstep === 'routine-preview') {
      return teamsWithPersona[currentTeamIndex] || null;
    }
    return null;
  }, [currentSubstep, teamsWithPersona, currentTeamIndex]);

  // Initialize: if we have teams with persona and we're starting, go to recommended routines for first team
  // Only do this when we're on team-selection AND we haven't processed all teams yet
  useEffect(() => {
    // Only trigger if:
    // 1. We're on team-selection
    // 2. We have teams with persona
    // 3. We're at index 0 (first team)
    // 4. There are still teams to process (currentTeamIndex < teamsWithPersona.length - 1 means we haven't finished)
    //    OR we haven't started yet (this is the initial load)
    const allTeamsProcessed = currentTeamIndex >= teamsWithPersona.length - 1;
    
    if (teamsWithPersona.length > 0 && 
        currentSubstep === 'team-selection' && 
        currentTeamIndex === 0 &&
        !allTeamsProcessed) {
      const firstTeam = teamsWithPersona[0];
      // Always navigate to recommended-routines for teams with persona
      if (firstTeam && onSubstepChange) {
        console.log('[RoutineSelectionStep] Initializing recommended flow for first team');
        onSubstepChange('recommended-routines');
      }
    }
  }, [teamsWithPersona, currentSubstep, currentTeamIndex, onSubstepChange]);

  // Handle preview routine
  const handlePreviewRoutine = useCallback((routineId: string) => {
    setPreviewingRoutineId(routineId);
    if (onSubstepChange) {
      onSubstepChange('routine-preview');
    }
  }, [onSubstepChange]);

  // Handle add routine from preview (with modified filters/sorting)
  const handleAddRoutineFromPreview = useCallback((filters: ColumnFiltersState, sorting: SortingState) => {
    if (!previewingRoutineId || !currentTeamForSubstep) return;
    
    // Store the modified configuration temporarily (will be saved at end of onboarding)
    setTempRoutineConfigs(prev => ({
      ...prev,
      [previewingRoutineId]: { filters, sorting },
    }));

    // Add routine to team
    const updatedTeams = teams.map(t => {
      if (t.id === currentTeamForSubstep.id) {
        const routineIds = t.assignedRoutineIds || [];
        if (!routineIds.includes(previewingRoutineId)) {
          return {
            ...t,
            assignedRoutineIds: [...routineIds, previewingRoutineId],
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return t;
    });
    onTeamsUpdate(updatedTeams);

    // Return to recommended routines
    setPreviewingRoutineId(null);
    if (onSubstepChange) {
      onSubstepChange('recommended-routines');
    }
  }, [previewingRoutineId, currentTeamForSubstep, teams, onTeamsUpdate, onSubstepChange]);

  // Wrapper for footer button that uses current preview state
  const handleAddRoutineFromPreviewWrapper = useCallback(() => {
    handleAddRoutineFromPreview(currentPreviewFilters, currentPreviewSorting);
  }, [handleAddRoutineFromPreview, currentPreviewFilters, currentPreviewSorting]);

  // Handle continue from recommended routines - go to next team or final selection
  const handleContinueFromRecommended = useCallback(() => {
    console.log('[RoutineSelectionStep] handleContinueFromRecommended called', { currentTeamIndex, teamsCount: teams.length });
    const teamsWithPersona = teams.filter(t => t.persona);
    const hasMore = currentTeamIndex < teamsWithPersona.length - 1;
    console.log('[RoutineSelectionStep] Teams with persona:', teamsWithPersona.length, 'Current index:', currentTeamIndex, 'Has more:', hasMore);
    
    if (hasMore) {
      // Move to next team
      console.log('[RoutineSelectionStep] Moving to next team');
      setCurrentTeamIndex(prev => {
        const next = prev + 1;
        console.log('[RoutineSelectionStep] Setting team index to:', next);
        return next;
      });
      if (onSubstepChange) {
        console.log('[RoutineSelectionStep] Calling onSubstepChange with recommended-routines');
        onSubstepChange('recommended-routines');
      }
    } else {
      // All teams processed, go to final selection view
      console.log('[RoutineSelectionStep] All teams processed, going to team-selection');
      if (onSubstepChange) {
        onSubstepChange('team-selection');
      }
    }
  }, [currentTeamIndex, teams, onSubstepChange]);

  // Handle back from preview
  const handleBackFromPreview = useCallback(() => {
    setPreviewingRoutineId(null);
    if (onSubstepChange) {
      onSubstepChange('recommended-routines');
    }
  }, [onSubstepChange]);

  // Expose handlers to parent via refs
  useEffect(() => {
    if (onContinueFromRecommendedRef) {
      onContinueFromRecommendedRef.current = handleContinueFromRecommended;
      console.log('[RoutineSelectionStep] Assigned handleContinueFromRecommended to ref');
    }
  }, [handleContinueFromRecommended, onContinueFromRecommendedRef]);

  useEffect(() => {
    if (onAddRoutineFromPreviewRef) {
      onAddRoutineFromPreviewRef.current = handleAddRoutineFromPreviewWrapper;
    }
  }, [handleAddRoutineFromPreviewWrapper, onAddRoutineFromPreviewRef]);

  useEffect(() => {
    if (onBackFromPreviewRef) {
      onBackFromPreviewRef.current = handleBackFromPreview;
    }
  }, [handleBackFromPreview, onBackFromPreviewRef]);

  // Handle next team or finish
  const handleNextTeam = useCallback(() => {
    if (hasMoreTeamsWithPersona) {
      setCurrentTeamIndex(prev => prev + 1);
      if (onSubstepChange) {
        onSubstepChange('recommended-routines');
      }
    } else {
      // All teams processed, go to final selection view
      if (onSubstepChange) {
        onSubstepChange('team-selection');
      }
    }
  }, [hasMoreTeamsWithPersona, onSubstepChange]);

  // Show recommended routines substep (4.1)
  if (currentSubstep === 'recommended-routines' && currentTeamForSubstep) {
    const suggestedRoutineIds = getSuggestedRoutinesForPersona(currentTeamForSubstep.persona || '');
    const assignedRoutineIds = currentTeamForSubstep.assignedRoutineIds || [];
    
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-8 pt-6 pb-6">
            <Substep4_1_RecommendedRoutines
              teamId={currentTeamForSubstep.id}
              teamName={currentTeamForSubstep.name}
              teamPersona={currentTeamForSubstep.persona}
              suggestedRoutineIds={suggestedRoutineIds}
              assignedRoutineIds={assignedRoutineIds}
              onPreviewRoutine={handlePreviewRoutine}
              onToggleRoutine={(routineId) => {
                handleRoutineToggle(currentTeamForSubstep.id, routineId);
              }}
              onAddAllSuggested={() => {
                handleAddAllSuggestedRoutines(currentTeamForSubstep.id);
                // Don't auto-continue, let user see the updated state
              }}
              onCreateRoutine={() => {
                handleCreateRoutineClick(currentTeamForSubstep.id);
                if (onSubstepChange) {
                  onSubstepChange('create-routine');
                }
              }}
              teams={teams}
              currentTeamIndex={currentTeamIndex}
              teamsWithPersona={teamsWithPersona}
              onTeamClick={(teamIndex) => {
                setCurrentTeamIndex(teamIndex);
                // Stay on recommended-routines substep, just switch team
              }}
              getTeamRoutineCount={(teamId) => {
                const teamRoutinesGrouped = getTeamRoutinesGroupedByObjectives(teamId);
                return Object.values(teamRoutinesGrouped).flat().length;
              }}
            />
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Show routine preview substep (4.2)
  if (currentSubstep === 'routine-preview' && previewingRoutineId && currentTeamForSubstep) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <Substep4_2_RoutinePreview
          routineId={previewingRoutineId}
          teamId={currentTeamForSubstep.id}
          onBack={handleBackFromPreview}
          onAddRoutine={(filters, sorting) => {
            setCurrentPreviewFilters(filters);
            setCurrentPreviewSorting(sorting);
            handleAddRoutineFromPreview(filters, sorting);
          }}
        />
      </div>
    );
  }

  // Show CreateRoutineFullPageWizard if active
  if (creatingRoutineForTeam) {
    const team = teams.find(t => t.id === creatingRoutineForTeam);
    return (
      <CreateRoutineFullPageWizard
        teamId={creatingRoutineForTeam}
        teamPersona={team?.persona}
        onClose={() => {
          setCreatingRoutineForTeam(null);
          setRoutineNameForValidation('');
          if (onRoutineCreationStepChange) {
            onRoutineCreationStepChange(null);
          }
          if (onSubstepChange) {
            onSubstepChange('team-selection');
          }
        }}
        onRoutineCreated={(routineId) => {
          handleRoutineCreated(creatingRoutineForTeam, routineId);
          setCreatingRoutineForTeam(null);
          setRoutineNameForValidation('');
          if (onRoutineCreationStepChange) {
            onRoutineCreationStepChange(null);
          }
          if (onSubstepChange) {
            onSubstepChange('team-selection');
          }
        }}
      />
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-8 pt-4 space-y-6 pb-0">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5">
            <div className="p-2 rounded-lg bg-[#31C7AD]/10">
              <AlertCircle className="h-5 w-5 text-[#31C7AD]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Create teams and assign routines</p>
              <p className="text-xs text-muted-foreground">
                Teams have been created from your selected roles. Assign routines to each team. Routines are automatically suggested based on personas.
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
            {teams.map((team) => {
              const teamRoutinesGrouped = getTeamRoutinesGroupedByObjectives(team.id);
              const teamRoutinesCount = Object.values(teamRoutinesGrouped).flat().length;
              const availableRoutinesForTeam = getFilteredRoutines(team.id);
              const currentMode = routineAddMode[team.id] || (team.persona ? 'personas' : 'manual');
              const suggestedRoutines = getSuggestedRoutinesForTeam(team.id);
              const hasAllSuggestedRoutines = !!(team.persona && suggestedRoutines.length === 0);
              
              // Sort objectives by predefined order
              const sortedObjectives = Object.keys(teamRoutinesGrouped).sort((a, b) => {
                const orderA = OBJECTIVE_ORDER[a] || 999;
                const orderB = OBJECTIVE_ORDER[b] || 999;
                return orderA - orderB;
              });
              
              return (
                <div
                  key={team.id}
                  className="group rounded-xl border-2 border-border bg-background hover:shadow-lg transition-all overflow-hidden"
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
                        </div>
                        {team.description && (
                          <p className="text-sm text-muted-foreground">{team.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement edit team
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit team"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onTeamsUpdate(teams.filter(t => t.id !== team.id));
                          }}
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
                          <span className="text-sm font-medium">Routines ({teamRoutinesCount})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Two distinct buttons */}
                          {team.persona ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Navigate to recommended routines substep for this team
                                  const teamIndex = teamsWithPersona.findIndex(t => t.id === team.id);
                                  if (teamIndex !== -1) {
                                    setCurrentTeamIndex(teamIndex);
                                    if (onSubstepChange) {
                                      onSubstepChange('recommended-routines');
                                    }
                                  }
                                }}
                                className="h-7 gap-1.5 text-xs"
                              >
                                <Sparkles className="h-3 w-3" />
                                View recommended
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRoutineAddMode({ ...routineAddMode, [team.id]: 'personas' });
                                  handleAddAllSuggestedRoutines(team.id);
                                }}
                                disabled={hasAllSuggestedRoutines}
                                className="h-7 gap-1.5 text-xs"
                              >
                                <Sparkles className="h-3 w-3" />
                                Add suggested
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRoutineAddMode({ ...routineAddMode, [team.id]: 'manual' });
                                  // Initialize temp selection with routines not already assigned
                                  const teamRoutineIds = team.assignedRoutineIds || [];
                                  setTempSelectedRoutineIds([]);
                                  setOpenAddRoutinesModal(team.id);
                                }}
                                className="h-7 gap-1.5 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                                Add manually
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleCreateRoutineClick(team.id);
                                  if (onSubstepChange) {
                                    onSubstepChange('create-routine');
                                  }
                                }}
                                className="h-7 gap-1.5 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                                Create Routine
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Initialize temp selection with routines not already assigned
                                  const teamRoutineIds = team.assignedRoutineIds || [];
                                  setTempSelectedRoutineIds([]);
                                  setOpenAddRoutinesModal(team.id);
                                }}
                                className="h-7 gap-1.5 text-xs"
                                disabled={availableRoutinesForTeam.length === 0}
                              >
                                <Plus className="h-3 w-3" />
                                Add manually
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleCreateRoutineClick(team.id);
                                  if (onSubstepChange) {
                                    onSubstepChange('create-routine');
                                  }
                                }}
                                className="h-7 gap-1.5 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                                Create Routine
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
                                {/* Routines for this objective */}
                                <div className="space-y-2 pl-2 border-l-2 border-border/50">
                                  {routines.map((routine) => {
                                    const isSuggested = isRoutineSuggested(team.id, routine.id);
                                    return (
                                      <div
                                        key={routine.id}
                                        data-routine-id={routine.id}
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
                                          onClick={() => handleRoutineToggle(team.id, routine.id)}
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
                </div>
              );
            })}
          </div>

          {/* Add Team Button */}
          <div className="flex justify-center pb-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // TODO: Implement add team functionality
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Team
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Add Routines Modal */}
      {openAddRoutinesModal && (() => {
        const team = teams.find(t => t.id === openAddRoutinesModal);
        const alreadyAssignedIds = team?.assignedRoutineIds || [];
        return (
          <AddRoutinesModal
            open={openAddRoutinesModal !== null}
            onOpenChange={(open) => {
              if (!open) {
                setOpenAddRoutinesModal(null);
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
            onAddSelected={() => {
              if (openAddRoutinesModal && team) {
                const updatedTeams = teams.map(t => {
                  if (t.id === openAddRoutinesModal) {
                    const routineIds = t.assignedRoutineIds || [];
                    const routinesToAdd = tempSelectedRoutineIds.filter(id => !routineIds.includes(id));
                    return {
                      ...t,
                      assignedRoutineIds: [...routineIds, ...routinesToAdd],
                      updatedAt: new Date().toISOString(),
                    };
                  }
                  return t;
                });
                onTeamsUpdate(updatedTeams);
              }
              setOpenAddRoutinesModal(null);
              setTempSelectedRoutineIds([]);
            }}
            alreadyAssignedRoutineIds={alreadyAssignedIds}
          />
        );
      })()}

    </div>
  );
};
