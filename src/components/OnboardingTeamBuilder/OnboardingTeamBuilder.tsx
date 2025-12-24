/**
 * Onboarding Team Builder
 * 
 * Progressive 4-step flow:
 * 0. Configuration type selection (Create from personas, Manual setup)
 * 1. Team names & Routines assignment (Create teams and assign routines)
 * 2. Add members to teams (Assign members to each team)
 * 3. Add scopes to team members (Assign scopes to each member individually)
 * 
 * State persisted to localStorage for recovery
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { TeamConfigurationTypeStep, type ConfigurationType } from './TeamConfigurationTypeStep';
import { TeamSetupStep, type TeamConfig } from './TeamSetupStep';
import { MembersAndRoutinesStep } from './MembersAndRoutinesStep';
import { ScopesAndReviewStep } from './ScopesAndReviewStep';
import { createTeam, updateTeam, getTeam } from '@/lib/teams';
import { updateUser, getUser } from '@/lib/users';
import { updateRoutine, getRoutine } from '@/lib/routines';

const STORAGE_KEY = 'pelico-onboarding-team-state';

interface TeamOnboardingState {
  configurationType: ConfigurationType | null;
  teams: TeamConfig[];
  currentStep: number;
}

interface OnboardingTeamBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const OnboardingTeamBuilder: React.FC<OnboardingTeamBuilderProps> = ({
  open,
  onOpenChange,
  onComplete,
}) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [configurationType, setConfigurationType] = useState<ConfigurationType | null>(null);
  const [teams, setTeams] = useState<TeamConfig[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const state: TeamOnboardingState = JSON.parse(stored);
          setConfigurationType(state.configurationType || null);
          setTeams(state.teams || []);
          
          // Determine step based on state
          if (state.currentStep !== undefined) {
            setStep(state.currentStep as 0 | 1 | 2 | 3);
          } else if (state.teams && state.teams.length > 0) {
            setStep(3); // If teams exist, go to review
          } else if (state.configurationType) {
            setStep(1); // If type selected, go to team setup
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
    const state: TeamOnboardingState = {
      configurationType,
      teams,
      currentStep: step,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Handle configuration type selection (Step 0 → Step 1)
  const handleConfigurationTypeSelect = (type: ConfigurationType) => {
    setConfigurationType(type);
    saveState();
  };

  const handleContinueFromConfigurationType = () => {
    if (configurationType) {
      setStep(1);
      saveState();
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (step > 0) {
      setStep((step - 1) as 0 | 1 | 2 | 3);
      saveState();
    }
  };


  // Handle final completion
  const handleComplete = () => {
    // Create/update teams
    const createdTeamIds: string[] = [];
    
    for (const teamConfig of teams) {
      if (teamConfig.id) {
        // Update existing team
        updateTeam(teamConfig.id, {
          name: teamConfig.name,
          description: teamConfig.description,
          assignedScopeIds: teamConfig.scopeIds || [],
          assignedRoutineIds: teamConfig.routineIds || [],
        });
        createdTeamIds.push(teamConfig.id);
      } else {
        // Create new team
        const newTeam = createTeam({
          name: teamConfig.name,
          description: teamConfig.description,
          assignedScopeIds: teamConfig.scopeIds || [],
          assignedRoutineIds: teamConfig.routineIds || [],
        });
        createdTeamIds.push(newTeam.id);
      }
    }

    // Assign members to teams
    // Note: Since users can belong to multiple teams, we'll use a different approach
    // For now, assign to the first team (we can enhance this later)
    teams.forEach((teamConfig, index) => {
      const teamId = teamConfig.id || createdTeamIds[index];
      if (teamId) {
        teamConfig.memberIds.forEach(userId => {
          const user = getUser(userId);
          if (user) {
            // For multi-team support, we might need to store teamIds array
            // For now, assign to primary team
            updateUser(userId, { teamId });
          }
        });
      }
    });

    // Assign routines to teams
    teams.forEach((teamConfig, index) => {
      const teamId = teamConfig.id || createdTeamIds[index];
      if (teamId) {
        teamConfig.routineIds.forEach(routineId => {
          const routine = getRoutine(routineId);
          if (routine) {
            const currentTeamIds = routine.teamIds || [];
            if (!currentTeamIds.includes(teamId)) {
              updateRoutine(routineId, {
                teamIds: [...currentTeamIds, teamId],
              });
            }
          }
        });
      }
    });

    // Assign scopes to teams (already done above)
    // Individual user scopes are already updated in ScopesAndReviewStep

    // Clean up and complete
    saveState();
    onComplete();
    onOpenChange(false);
    
    // Clear onboarding state after completion
    localStorage.removeItem(STORAGE_KEY);
    
    // Also clear saved personas for Team Wizard after completion
    localStorage.removeItem('pelico-team-wizard-personas');
  };

  // Handle clear all (reset wizard and go back to step 0)
  const handleClearAll = () => {
    setStep(0);
    setConfigurationType(null);
    setTeams([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      saveState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <div className="relative px-8 pt-6 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Manage Your Teams
              </DialogTitle>
            </div>
            
            {/* Enhanced Progress indicator */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`
                        relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                        transition-all duration-300
                        ${s === step
                          ? 'bg-gradient-to-br from-[#2063F0] to-[#1a54d8] text-white shadow-lg shadow-[#2063F0]/30 scale-110'
                          : s < step
                          ? 'bg-gradient-to-br from-[#31C7AD] to-[#2ab89a] text-white shadow-md'
                          : 'bg-muted/50 text-muted-foreground border-2 border-border'}
                      `}
                    >
                      {s < step ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        s + 1
                      )}
                      {s === step && (
                        <div className="absolute inset-0 rounded-full bg-[#2063F0] animate-ping opacity-20" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${s === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s === 0 ? 'Setup Type' : s === 1 ? 'Teams & Routines' : s === 2 ? 'Members' : 'Scopes'}
                    </span>
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        s < step 
                          ? 'bg-gradient-to-r from-[#31C7AD] to-[#2ab89a]' 
                          : 'bg-muted/30'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {step === 0 && (
            <TeamConfigurationTypeStep
              selectedType={configurationType}
              onSelect={handleConfigurationTypeSelect}
              onNext={handleContinueFromConfigurationType}
              onClearAll={handleClearAll}
            />
          )}
          {step === 1 && (
            <TeamSetupStep
              configurationType={configurationType!}
              teams={teams}
              onTeamsChange={(updatedTeams) => {
                setTeams(updatedTeams);
                saveState();
              }}
              onBack={handleBack}
              onNext={() => {
                setStep(2);
                saveState();
              }}
              onClearAll={handleClearAll}
            />
          )}
          {step === 2 && (
            <MembersAndRoutinesStep
              teams={teams}
              onTeamsChange={(updatedTeams) => {
                setTeams(updatedTeams);
                saveState();
              }}
              onBack={handleBack}
              onNext={() => {
                setStep(3);
                saveState();
              }}
              onClearAll={handleClearAll}
            />
          )}
          {step === 3 && (
            <ScopesAndReviewStep
              teams={teams}
              onTeamsChange={(updatedTeams) => {
                setTeams(updatedTeams);
                saveState();
              }}
              onBack={handleBack}
              onComplete={handleComplete}
              onClearAll={handleClearAll}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

