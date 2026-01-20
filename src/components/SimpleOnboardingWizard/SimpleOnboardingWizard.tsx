/**
 * Simple Onboarding Wizard
 * 
 * Progressive 4-step flow:
 * 0. Welcome + Create teams (from Role profiles or manually)
 * 1. Add members to each team
 * 2. Create and apply scopes for each member
 * 3. Choose routines for each team (with sub-step modal)
 * 
 * State persisted to localStorage for recovery
 */

import React, { useState, useEffect, useRef } from 'react';
import { TeamCreationStep } from './TeamCreationStep';
import { RoutineSelectionStep } from './RoutineSelectionStep';
import { MemberAssignmentStep } from './MemberAssignmentStep';
import { ScopeAssignmentStep, type ScopeAssignmentSubstep } from './ScopeAssignmentStep';
import { SummaryStep } from './SummaryStep';
import { createTeam, updateTeam, getTeam } from '@/lib/teams';
import { updateUser, getUser } from '@/lib/users';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'pelico-simple-onboarding-state';

export type TeamCreationMode = 'personas' | 'manual';

export interface SimpleTeamConfig {
  id: string;
  name: string;
  description?: string;
  persona?: string; // French Role profile name if created from Role profile
  personas?: string[]; // Multiple Role profiles (optional, helps with routine suggestions)
  assignedRoutineIds: string[];
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type TeamCreationSubstep = 'welcome' | 'mode-selection' | 'persona-selection' | 'manual-creation';
export type RoutineSelectionSubstep = 
  | 'team-selection'           // Sélection finale (vue actuelle)
  | 'recommended-routines'     // Sous-étape 4.1 : Routines recommandées
  | 'routine-preview'           // Sous-étape 4.2 : Aperçu de routine
  | 'routine-selection';        // Alias pour team-selection (backward compat)

interface SimpleOnboardingState {
  teams: SimpleTeamConfig[];
  currentStep: number;
  currentSubstep?: {
    step0?: TeamCreationSubstep;
    step1?: RoutineSelectionSubstep | string; // string = teamId for routine selection
  };
}

interface SimpleOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  userData?: { email: string; firstName: string; lastName: string } | null;
}

export const SimpleOnboardingWizard: React.FC<SimpleOnboardingWizardProps> = ({
  open,
  onOpenChange,
  onComplete,
  userData,
}) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [teams, setTeams] = useState<SimpleTeamConfig[]>([]);
  const [currentSubstep, setCurrentSubstep] = useState<{
    step0?: TeamCreationSubstep;
    step2?: ScopeAssignmentSubstep;
    step3?: RoutineSelectionSubstep | string;
  }>({
    step0: 'welcome',
    step3: 'team-selection',
  });
  const [step0CanProceed, setStep0CanProceed] = useState(false);
  const step0ContinueHandlerRef = useRef<(() => boolean) | null>(null);
  // Routine creation substeps state
  const [routineCreationStep, setRoutineCreationStep] = useState<'choose-view' | 'configure-table' | 'save' | null>(null);
  const [routineNameForValidation, setRoutineNameForValidation] = useState('');
  // Refs for RoutineSelectionStep handlers
  const continueFromRecommendedRef = useRef<(() => void) | null>(null);
  const addRoutineFromPreviewRef = useRef<(() => void) | null>(null);
  const backFromPreviewRef = useRef<(() => void) | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const state: SimpleOnboardingState = JSON.parse(stored);
          setTeams(state.teams || []);
          
          // Determine step based on state
          if (state.currentStep !== undefined) {
            setStep(state.currentStep as 0 | 1 | 2 | 3);
          }
          if (state.currentSubstep) {
            setCurrentSubstep(state.currentSubstep);
          }
          if (state.currentStep === undefined && state.teams && state.teams.length > 0) {
            // Check which step we should be on based on completion
            // New order: 0. Welcome+Teams, 1. Members, 2. Scopes, 3. Routines
            const hasMembers = state.teams.some(t => t.memberIds.length > 0);
            const hasRoutines = state.teams.some(t => t.assignedRoutineIds.length > 0);
            
            if (hasRoutines) {
              setStep(3); // Routines step (last)
            } else if (hasMembers) {
              setStep(2); // Scopes step
            } else {
              setStep(1); // Members step
            }
          } else {
            setStep(0);
          }
        } catch {
          // Invalid stored state, start fresh
        }
      }
    }
  }, [open]);

  // Reload teams from localStorage when returning to step 0 to ensure we have the latest state
  useEffect(() => {
    if (open && step === 0) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const state: SimpleOnboardingState = JSON.parse(stored);
          if (state.teams) {
            // Only update if the stored teams are different to avoid unnecessary re-renders
            setTeams(prevTeams => {
              const prevIds = new Set(prevTeams.map(t => t.id));
              const newIds = new Set(state.teams.map(t => t.id));
              if (prevIds.size !== newIds.size || ![...prevIds].every(id => newIds.has(id))) {
                return state.teams;
              }
              return prevTeams;
            });
          }
        } catch {
          // Invalid stored state, ignore
        }
      }
    }
  }, [open, step]);

  // Save state to localStorage
  const saveState = (teamsToSave?: SimpleTeamConfig[]) => {
    const state: SimpleOnboardingState = {
      teams: teamsToSave !== undefined ? teamsToSave : teams,
      currentStep: step,
      currentSubstep,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Handle team creation/update
  const handleTeamsUpdate = (updatedTeams: SimpleTeamConfig[]) => {
    setTeams(updatedTeams);
    // Save state with the updated teams immediately to avoid async state issues
    saveState(updatedTeams);
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 0) {
      // Handle substeps within step 0
      const currentStep0Substep = currentSubstep.step0 || 'welcome';
      if (currentStep0Substep === 'mode-selection') {
        // Go back to welcome
        setCurrentSubstep({ ...currentSubstep, step0: 'welcome' });
        saveState();
      } else if (currentStep0Substep === 'persona-selection' || currentStep0Substep === 'manual-creation') {
        // Go back to mode-selection
        setCurrentSubstep({ ...currentSubstep, step0: 'mode-selection' });
        saveState();
      }
      // If on welcome, don't go back (first screen)
    } else if (step === 2) {
      // Handle substeps within step 2 (Scope Assignment)
      const currentStep2Substep = currentSubstep.step2 || 'template-scope';
      if (currentStep2Substep === 'assign-scopes') {
        // Go back to template-scope substep
        setCurrentSubstep({ ...currentSubstep, step2: 'template-scope' });
        saveState();
      } else {
        // Go back to previous step
        setStep(1);
        saveState();
      }
    } else if (step === 4) {
      // Go back from summary to routines
      setStep(3);
      setCurrentSubstep({ ...currentSubstep, step3: 'team-selection' });
      saveState();
    } else if (step > 0) {
      const newStep = (step - 1) as 0 | 1 | 2 | 3 | 4;
      setStep(newStep);
      // When going back to step 0, ensure we save the current state
      saveState();
    }
  };

  // Handle next navigation
  const handleNext = () => {
    // Validation at each step
    // New order: 0. Welcome+Teams, 1. Members, 2. Scopes, 3. Routines
    if (step === 0) {
      // Step 0: Check if we need to create teams from substep
      if (step0ContinueHandlerRef.current) {
        const canProceed = step0ContinueHandlerRef.current();
        if (!canProceed) {
          return;
        }
      } else if (teams.length === 0) {
        // Fallback: must have at least one team
        return;
      }
      setStep(1); // Go to Members step
    } else if (step === 1) {
      // Step 1: Must have at least one member per team
      const allTeamsHaveMembers = teams.every(team => team.memberIds.length > 0);
      if (!allTeamsHaveMembers) {
        return;
      }
      setStep(2); // Go to Scopes step
      // Initialize step 2 with first substep
      setCurrentSubstep({ ...currentSubstep, step2: 'template-scope' });
    } else if (step === 2) {
      // Step 2: Handle substeps
      const currentStep2Substep = currentSubstep.step2 || 'template-scope';
      if (currentStep2Substep === 'template-scope') {
        // Move to assign-scopes substep
        setCurrentSubstep({ ...currentSubstep, step2: 'assign-scopes' });
        saveState();
      } else {
        // On assign-scopes substep, proceed to Routines step
        setStep(3);
        // Always start with team-selection view to show all team cards
        setCurrentSubstep({ ...currentSubstep, step3: 'team-selection' });
      }
    } else if (step === 3) {
      // Step 3: Routines - proceed to Summary step
      setStep(4);
    }
    saveState();
  };

  // Handle clear all - Reset wizard to initial state (step 0)
  const handleClearAll = () => {
    // Reset all state variables to initial values
    setTeams([]);
    setStep(0);
    setCurrentSubstep({
      step0: 'welcome',
      step2: 'template-scope',
      step3: 'team-selection',
    });
    setStep0CanProceed(false);
    setRoutineCreationStep(null);
    setRoutineNameForValidation('');
    step0ContinueHandlerRef.current = null;
    
    // Clear localStorage state
    localStorage.removeItem(STORAGE_KEY);
  };

  // Check if can proceed to next step
  const canProceed = () => {
    // New order: 0. Welcome+Teams, 1. Members, 2. Scopes, 3. Routines
    if (step === 0) {
      // For step 0, check if teams exist OR if substep validation allows proceeding
      return teams.length > 0 || step0CanProceed;
    }
    if (step === 1) return teams.every(team => team.memberIds.length > 0);
    if (step === 2) return true; // Scopes are optional
    if (step === 3) {
      // For step 3, allow proceeding if we're in a substep (navigation within step 3)
      // or if all teams have routines assigned (final validation)
      if (currentSubstep.step3 === 'recommended-routines' || currentSubstep.step3 === 'routine-preview') {
        return true; // Always allow navigation within substeps
      }
      return teams.every(team => team.assignedRoutineIds.length > 0);
    }
    if (step === 4) {
      // Summary step - always allow proceeding
      return true;
    }
    return false;
  };

  // Handle completion
  const handleComplete = async () => {
    try {
      // Import getTeams dynamically
      const { getTeams } = await import('@/lib/teams');
      const existingTeams = getTeams();
      const teamMap = new Map(existingTeams.map((t: any) => [t.id, t]));

      for (const teamConfig of teams) {
        let teamId = teamConfig.id;
        
        if (teamMap.has(teamConfig.id)) {
          // Update existing team
          await updateTeam(teamConfig.id, {
            name: teamConfig.name,
            description: teamConfig.description,
            persona: teamConfig.persona,
            assignedRoutineIds: teamConfig.assignedRoutineIds,
          });
        } else {
          // Create new team
          const newTeam = await createTeam({
            name: teamConfig.name,
            description: teamConfig.description,
            persona: teamConfig.persona,
            assignedRoutineIds: teamConfig.assignedRoutineIds,
            assignedScopeIds: [],
          });
          teamId = newTeam.id;
        }

        // Update team members
        const team = await getTeam(teamId);
        if (team) {
          // Update users' teamId
          for (const memberId of teamConfig.memberIds) {
            const user = await getUser(memberId);
            if (user) {
              await updateUser(memberId, {
                teamId: teamId,
              });
            }
          }
        }
      }

      // Clear wizard state
      localStorage.removeItem(STORAGE_KEY);
      
      // Mark Simple onboarding task as completed
      const tasksStorage = localStorage.getItem('pelico-onboarding-tasks-status');
      if (tasksStorage) {
        const tasks = JSON.parse(tasksStorage);
        tasks['set-up-workspace'] = true;
        localStorage.setItem('pelico-onboarding-tasks-status', JSON.stringify(tasks));
      }

      onComplete();
    } catch (error) {
      console.error('Error completing Simple onboarding:', error);
      alert('Une erreur s\'est produite lors de l\'enregistrement. Veuillez réessayer.');
    }
  };

  // Step labels for progress indicator
  const stepLabels: Record<number, string> = {
    0: 'Bienvenue & Créer les équipes',
    1: 'Ajouter des membres',
    2: 'Créer les périmètres',
    3: 'Routines',
    4: 'Récapitulatif',
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex h-screen">
      {/* Sidebar Navigation */}
      <div className="w-72 bg-muted/30 border-r border-border flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="px-6 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#2063F0] to-[#31C7AD] bg-clip-text text-transparent">
                Configuration de votre espace de travail
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
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Complétez ces étapes pour configurer votre espace de travail
          </p>
        </div>

        {/* Steps Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((stepIndex) => {
              const isActive = step === stepIndex;
              const isCompleted = step > stepIndex;
              // Allow navigation to completed steps, current step, and next accessible step
              const isAccessible = stepIndex === 0 || step >= stepIndex - 1;
              const canNavigate = isAccessible || isCompleted;
              const showRoutineSubsteps = stepIndex === 3 && isActive && routineCreationStep !== null;
              const showScopeSubsteps = stepIndex === 2 && isActive;

              return (
                <React.Fragment key={stepIndex}>
                  <button
                    onClick={() => {
                      if (canNavigate) {
                        setStep(stepIndex as 0 | 1 | 2 | 3);
                        // Reset routine creation step when leaving step 3
                        if (stepIndex !== 3) {
                          setRoutineCreationStep(null);
                        }
                        saveState();
                      }
                    }}
                    disabled={!canNavigate}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-lg transition-all text-left',
                      'border-2',
                      isActive
                        ? 'border-[#2063F0] bg-[#2063F0]/10 shadow-md'
                        : isCompleted
                        ? 'border-[#31C7AD]/30 bg-[#31C7AD]/5 hover:border-[#31C7AD]/50 hover:bg-[#31C7AD]/10 cursor-pointer'
                        : isAccessible
                        ? 'border-border bg-background hover:border-[#2063F0]/30 hover:bg-muted/50 cursor-pointer'
                        : 'border-border/50 bg-muted/20 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#31C7AD] text-white">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : isActive ? (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2063F0] text-white font-semibold">
                          {stepIndex + 1}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-muted-foreground/30 bg-background">
                          <Circle className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'text-sm font-semibold mb-1',
                          isActive && 'text-[#2063F0]',
                          isCompleted && 'text-[#31C7AD]',
                          !isActive && !isCompleted && 'text-foreground'
                        )}
                      >
                        Étape {stepIndex + 1}
                      </div>
                      <div
                        className={cn(
                          'text-xs',
                          isActive ? 'text-[#2063F0]' : 'text-muted-foreground'
                        )}
                      >
                        {stepLabels[stepIndex]}
                      </div>
                      {isCompleted && (
                        <div className="mt-1 text-xs text-[#31C7AD] font-medium">
                          Terminé
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {/* Scope Assignment Substeps - Only show when Step 3 is active */}
                  {showScopeSubsteps && (
                    <div className="ml-6 space-y-2 border-l-2 border-[#2063F0]/20 pl-4 mt-2">
                      {(['template-scope', 'assign-scopes'] as const).map((substep, substepIndex) => {
                        const substepLabels = {
                          'template-scope': 'Template scope',
                          'assign-scopes': 'Assigner les périmètres',
                        };
                        const currentStep2Substep = currentSubstep.step2 || 'template-scope';
                        const isSubstepActive = currentStep2Substep === substep;
                        const isSubstepCompleted = currentStep2Substep && 
                          ['template-scope', 'assign-scopes'].indexOf(currentStep2Substep) > substepIndex;
                        const canNavigateToSubstep = isSubstepCompleted || isSubstepActive;

                        return (
                          <button
                            key={substep}
                            onClick={() => {
                              if (canNavigateToSubstep) {
                                setCurrentSubstep({ ...currentSubstep, step2: substep });
                                saveState();
                              }
                            }}
                            disabled={!canNavigateToSubstep}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-left text-xs',
                              isSubstepActive
                                ? 'bg-[#2063F0]/10 text-[#2063F0] font-medium'
                                : isSubstepCompleted
                                ? 'text-[#31C7AD] hover:bg-[#31C7AD]/5 cursor-pointer'
                                : 'text-muted-foreground opacity-50 cursor-not-allowed'
                            )}
                          >
                            <div className="flex-shrink-0">
                              {isSubstepCompleted ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#31C7AD]" />
                              ) : isSubstepActive ? (
                                <div className="w-3.5 h-3.5 rounded-full bg-[#2063F0]" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
                              )}
                            </div>
                            <span>{substepLabels[substep]}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Routine Creation Substeps - Only show when Step 4 is active and creating a routine */}
                  {showRoutineSubsteps && (
                    <div className="ml-6 space-y-2 border-l-2 border-[#2063F0]/20 pl-4 mt-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Créer une routine
                      </div>
                      {(['choose-view', 'configure-table'] as const).map((substep, substepIndex) => {
                        const substepLabels = {
                          'choose-view': 'Choisir la vue',
                          'configure-table': 'Configurer',
                        };
                        const isSubstepActive = routineCreationStep === substep;
                        const isSubstepCompleted = routineCreationStep && 
                          ['choose-view', 'configure-table'].indexOf(routineCreationStep) > substepIndex;
                        const canNavigateToSubstep = isSubstepCompleted || isSubstepActive;

                        return (
                          <button
                            key={substep}
                            onClick={() => {
                              if (canNavigateToSubstep) {
                                setRoutineCreationStep(substep);
                              }
                            }}
                            disabled={!canNavigateToSubstep}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-left text-xs',
                              isSubstepActive
                                ? 'bg-[#2063F0]/10 text-[#2063F0] font-medium'
                                : isSubstepCompleted
                                ? 'text-[#31C7AD] hover:bg-[#31C7AD]/5 cursor-pointer'
                                : 'text-muted-foreground opacity-50 cursor-not-allowed'
                            )}
                          >
                            <div className="flex-shrink-0">
                              {isSubstepCompleted ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#31C7AD]" />
                              ) : isSubstepActive ? (
                                <div className="w-3.5 h-3.5 rounded-full bg-[#2063F0]" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
                              )}
                            </div>
                            <span>{substepLabels[substep]}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="py-4 shrink-0">
          <div className="px-4 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Progression</span>
              <span className="font-semibold text-foreground">
                {step + 1} / 5
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2063F0] to-[#31C7AD] transition-all duration-300"
                style={{ width: `${((step + 1) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header - Hide on welcome substep and when creating a routine (substep) */}
        {!(step === 0 && currentSubstep.step0 === 'welcome') && !routineCreationStep && (
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-border bg-background shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl page-title break-words">{stepLabels[step]}</h2>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 0 && (
            <TeamCreationStep
              teams={teams}
              onTeamsUpdate={handleTeamsUpdate}
              onNext={handleNext}
              onBack={handleBack}
              onClearAll={handleClearAll}
              currentSubstep={currentSubstep.step0 || 'welcome'}
              onSubstepChange={(substep) => {
                setCurrentSubstep({ ...currentSubstep, step0: substep });
                saveState();
              }}
              onValidationChange={setStep0CanProceed}
              onStep0Continue={(handler) => {
                step0ContinueHandlerRef.current = handler;
              }}
              userData={userData}
            />
          )}
          {step === 1 && (
            <MemberAssignmentStep
              teams={teams}
              onTeamsUpdate={handleTeamsUpdate}
              onNext={handleNext}
              onBack={handleBack}
              onClearAll={handleClearAll}
            />
          )}
          {step === 2 && (
            <ScopeAssignmentStep
              teams={teams}
              onTeamsUpdate={handleTeamsUpdate}
              onNext={handleNext}
              onBack={handleBack}
              onClearAll={handleClearAll}
              currentSubstep={currentSubstep.step2 || 'template-scope'}
              onSubstepChange={(substep) => {
                setCurrentSubstep({ ...currentSubstep, step2: substep });
                saveState();
              }}
            />
          )}
          {step === 3 && (
            <RoutineSelectionStep
              teams={teams}
              onTeamsUpdate={handleTeamsUpdate}
              onNext={handleNext}
              onBack={handleBack}
              onClearAll={handleClearAll}
              currentSubstep={currentSubstep.step3 || 'team-selection'}
              onSubstepChange={(substep) => {
                console.log('[SimpleOnboardingWizard] onSubstepChange called with:', substep);
                setCurrentSubstep((prev) => {
                  const newState = { ...prev, step3: substep };
                  console.log('[SimpleOnboardingWizard] Setting substep to:', newState);
                  return newState;
                });
                saveState();
              }}
              routineCreationStep={routineCreationStep}
              onRoutineCreationStepChange={(step) => setRoutineCreationStep(step)}
              onRoutineNameChange={setRoutineNameForValidation}
              onCancelRoutineCreation={() => {
                setRoutineCreationStep(null);
                setRoutineNameForValidation('');
              }}
              onContinueFromRecommendedRef={continueFromRecommendedRef}
              onAddRoutineFromPreviewRef={addRoutineFromPreviewRef}
              onBackFromPreviewRef={backFromPreviewRef}
            />
          )}
          {step === 4 && (
            <SummaryStep
              teams={teams}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          )}
        </div>

        {/* Fixed Footer - Hide when creating a routine (substep) */}
        {!routineCreationStep && (
          <div className="py-3 sm:py-4 border-t border-border bg-background shrink-0 flex items-center">
            <div className="px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    // Handle back for step 3 substeps
                    if (step === 3 && currentSubstep.step3 === 'routine-preview' && backFromPreviewRef.current) {
                      backFromPreviewRef.current();
                    } else if (step === 3 && currentSubstep.step3 === 'recommended-routines') {
                      // Go back to team-selection from recommended-routines
                      setCurrentSubstep({ ...currentSubstep, step3: 'team-selection' });
                      saveState();
                    } else {
                      handleBack();
                    }
                  }}
                  disabled={step === 0 && currentSubstep.step0 === 'welcome'}
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Précédent</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearAll}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 flex-1 sm:flex-initial"
                >
                  <span className="hidden sm:inline">Tout effacer</span>
                  <span className="sm:hidden">Effacer</span>
                </Button>
              </div>
              <Button
                variant={step === 3 && currentSubstep.step3 === 'routine-preview' ? 'secondary' : 'default'}
                onClick={() => {
                  console.log('[SimpleOnboardingWizard] Button clicked, step:', step, 'substep:', currentSubstep.step3);
                  // Handle continue for step 3 substeps
                  if (step === 3 && currentSubstep.step3 === 'recommended-routines') {
                    // Use ref handler if available, otherwise use direct navigation
                    console.log('[SimpleOnboardingWizard] Continue from recommended clicked, ref:', continueFromRecommendedRef.current);
                    if (continueFromRecommendedRef.current) {
                      try {
                        console.log('[SimpleOnboardingWizard] Calling ref handler...');
                        continueFromRecommendedRef.current();
                        console.log('[SimpleOnboardingWizard] Ref handler called successfully');
                      } catch (error) {
                        console.error('[SimpleOnboardingWizard] Error calling ref handler:', error);
                        // Fallback: directly change substep
                        setCurrentSubstep({ ...currentSubstep, step3: 'team-selection' });
                        saveState();
                      }
                    } else {
                      // Fallback: directly change substep if ref not available
                      console.log('[SimpleOnboardingWizard] Ref not available, using direct fallback');
                      setCurrentSubstep({ ...currentSubstep, step3: 'team-selection' });
                      saveState();
                    }
                  } else if (step === 3 && currentSubstep.step3 === 'routine-preview') {
                    // For preview, try ref first, fallback to direct navigation
                    if (addRoutineFromPreviewRef.current) {
                      addRoutineFromPreviewRef.current();
                    } else {
                      // Fallback: go back to team-selection
                      setCurrentSubstep({ ...currentSubstep, step3: 'team-selection' });
                      saveState();
                    }
                  } else if (step === 3) {
                    handleNext(); // Go to summary step
                  } else if (step === 4) {
                    handleComplete(); // Finalize from summary
                  } else {
                    handleNext();
                  }
                }}
                disabled={
                  // Don't disable button for substeps navigation or summary step
                  (step === 3 && (currentSubstep.step3 === 'recommended-routines' || currentSubstep.step3 === 'routine-preview'))
                    ? false
                    : step === 4
                    ? false
                    : !canProceed()
                }
                className="gap-2 w-full sm:w-auto"
              >
                {step === 3 && currentSubstep.step3 === 'recommended-routines' 
                  ? (() => {
                      // Determine if there are more teams or if we're going to final selection
                      const teamsWithPersona = teams.filter(t => t.persona);
                      // We can't easily access currentTeamIndex here, so use a generic message
                      // The actual logic is handled in RoutineSelectionStep
                      return 'Suivant';
                    })()
                  : step === 3 && currentSubstep.step3 === 'routine-preview'
                  ? 'Retirer la routine'
                  : step === 3 
                  ? 'Voir le récapitulatif' 
                  : step === 4
                  ? 'Finaliser'
                  : 'Suivant'}
                {!(step === 3 && currentSubstep.step3 === 'routine-preview') && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Footer for Routine Creation - Only show when creating a routine */}
        {routineCreationStep && (
          <div className="py-4 border-t border-border bg-background shrink-0 flex items-center">
            <div className="px-8 flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                {routineCreationStep !== 'choose-view' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      switch (routineCreationStep) {
                        case 'configure-table':
                          setRoutineCreationStep('choose-view');
                          break;
                        case 'choose-view':
                          setRoutineCreationStep('configure-table');
                          break;
                        case 'save':
                          setRoutineCreationStep(null);
                          break;
                        default:
                          break;
                      }
                    }}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setRoutineCreationStep(null);
                    setRoutineNameForValidation('');
                    // Reset creatingRoutineForTeam in RoutineSelectionStep
                    // This is handled by passing a ref or callback, but for now we'll rely on
                    // the state reset to trigger the close in RoutineSelectionStep
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Annuler
                </Button>
              </div>
              {routineCreationStep === 'configure-table' && (
                <Button
                  variant="default"
                  onClick={() => {
                    // Call handleSave from CreateRoutineView
                    const handleSave = (window as any).__createRoutineViewHandleSave;
                    if (handleSave) {
                      handleSave();
                    }
                  }}
                  disabled={!routineNameForValidation.trim()}
                  className="gap-2"
                >
                  Créer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

