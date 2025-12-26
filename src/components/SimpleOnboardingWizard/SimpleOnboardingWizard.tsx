/**
 * Simple Onboarding Wizard
 * 
 * Progressive 4-step flow:
 * 0. Welcome + Create teams (from personas or manually)
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
import { ScopeAssignmentStep } from './ScopeAssignmentStep';
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
  persona?: string; // French persona name if created from persona
  assignedRoutineIds: string[];
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type TeamCreationSubstep = 'welcome' | 'mode-selection' | 'persona-selection' | 'manual-creation';
export type RoutineSelectionSubstep = 'team-selection' | 'routine-selection';

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
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [teams, setTeams] = useState<SimpleTeamConfig[]>([]);
  const [currentSubstep, setCurrentSubstep] = useState<{
    step0?: TeamCreationSubstep;
    step3?: RoutineSelectionSubstep | string;
  }>({
    step0: 'welcome',
    step3: 'team-selection',
  });
  const [step0CanProceed, setStep0CanProceed] = useState(false);
  const step0ContinueHandlerRef = useRef<(() => boolean) | null>(null);
  // Routine creation substeps state
  const [routineCreationStep, setRoutineCreationStep] = useState<'choose-view' | 'configure-table' | 'save' | null>(null);

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

  // Save state to localStorage
  const saveState = () => {
    const state: SimpleOnboardingState = {
      teams,
      currentStep: step,
      currentSubstep,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Handle team creation/update
  const handleTeamsUpdate = (updatedTeams: SimpleTeamConfig[]) => {
    setTeams(updatedTeams);
    saveState();
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
    } else if (step > 0) {
      setStep((step - 1) as 0 | 1 | 2 | 3);
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
    } else if (step === 2) {
      // Step 2: Scopes are optional, can proceed
      setStep(3); // Go to Routines step
    }
    saveState();
  };

  // Handle clear all
  const handleClearAll = () => {
    setTeams([]);
    setStep(0);
    setCurrentSubstep({
      step0: 'welcome',
      step3: 'team-selection',
    });
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
    if (step === 3) return teams.every(team => team.assignedRoutineIds.length > 0);
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
            assignedRoutineIds: teamConfig.assignedRoutineIds,
          });
        } else {
          // Create new team
          const newTeam = await createTeam({
            name: teamConfig.name,
            description: teamConfig.description,
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
      alert('An error occurred while saving. Please try again.');
    }
  };

  // Step labels for progress indicator
  const stepLabels: Record<number, string> = {
    0: 'Welcome & Create Teams',
    1: 'Add Members',
    2: 'Create Scopes',
    3: 'Routines',
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex h-screen">
      {/* Sidebar Navigation */}
      <div className="w-72 bg-muted/30 border-r border-border flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="px-6 py-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#2063F0] to-[#31C7AD] bg-clip-text text-transparent">
              Set-up your workspace
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete these steps to configure your workspace
          </p>
        </div>

        {/* Steps Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            {[0, 1, 2, 3].map((stepIndex) => {
              const isActive = step === stepIndex;
              const isCompleted = step > stepIndex;
              // Allow navigation to completed steps, current step, and next accessible step
              const isAccessible = stepIndex === 0 || step >= stepIndex - 1;
              const canNavigate = isAccessible || isCompleted;
              const showRoutineSubsteps = stepIndex === 3 && isActive && routineCreationStep !== null;

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
                        Step {stepIndex + 1}
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
                          Completed
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {/* Routine Creation Substeps - Only show when Step 4 is active and creating a routine */}
                  {showRoutineSubsteps && (
                    <div className="ml-6 space-y-2 border-l-2 border-[#2063F0]/20 pl-4 mt-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Create routine
                      </div>
                      {(['choose-view', 'configure-table', 'save'] as const).map((substep, substepIndex) => {
                        const substepLabels = {
                          'choose-view': 'Choose View',
                          'configure-table': 'Configure',
                          'save': 'Save',
                        };
                        const isSubstepActive = routineCreationStep === substep;
                        const isSubstepCompleted = routineCreationStep && 
                          ['choose-view', 'configure-table', 'save'].indexOf(routineCreationStep) > substepIndex;
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
        <div className="py-4 border-t border-border shrink-0">
          <div className="px-4 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Progress</span>
              <span className="font-semibold text-foreground">
                {step + 1} / 4
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2063F0] to-[#31C7AD] transition-all duration-300"
                style={{ width: `${((step + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header - Hide on welcome substep */}
        {!(step === 0 && currentSubstep.step0 === 'welcome') && (
          <div className="px-8 py-4 border-b border-border bg-background shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{stepLabels[step]}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {step === 0 && 'Welcome and create teams from personas or manually'}
                  {step === 1 && 'Add members to each team'}
                  {step === 2 && 'Assign scopes to team members'}
                  {step === 3 && 'Assign routines to each team'}
                </p>
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
                setCurrentSubstep({ ...currentSubstep, step3: substep });
                saveState();
              }}
              routineCreationStep={routineCreationStep}
              onRoutineCreationStepChange={setRoutineCreationStep}
            />
          )}
        </div>

        {/* Fixed Footer - Same height as sidebar progress section */}
        <div className="py-4 border-t border-border bg-background shrink-0 flex items-center">
          <div className="px-8 flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleBack}
                disabled={step === 0 && currentSubstep.step0 === 'welcome'}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                Clear All
              </Button>
            </div>
            <Button
              onClick={step === 3 ? handleComplete : handleNext}
              disabled={!canProceed()}
              className="gap-2 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 3 ? 'Complete Setup' : 'Continue'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

