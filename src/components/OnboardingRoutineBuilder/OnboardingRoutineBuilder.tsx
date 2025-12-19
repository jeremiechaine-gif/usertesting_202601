/**
 * Onboarding Routine Builder
 * 
 * Progressive 3-step flow:
 * 1. Role selection (preselects defaults)
 * 2. Intent-based refinement (scores routines)
 * 3. Concrete review (final selection)
 * 
 * State persisted to localStorage for recovery
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RoleSelectionStep } from './RoleSelectionStep';
import { IntentSelectionStep } from './IntentSelectionStep';
import { RoutineReviewStep } from './RoutineReviewStep';
import type { Persona, Intent } from '@/lib/onboarding/types';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import { scoreAndRankRoutines, groupRoutinesByFrequency } from '@/lib/onboarding/scoring';
import type { ScoredRoutine } from '@/lib/onboarding/scoring';

const STORAGE_KEY = 'pelico-onboarding-state';

interface OnboardingState {
  selectedPersonas: Persona[];
  selectedIntents: Intent[];
  selectedRoutineIds: string[];
  isUnsureOfRole?: boolean;
  showAllRoutines?: boolean;
}

interface OnboardingRoutineBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (selectedRoutineIds: string[]) => void;
}

export const OnboardingRoutineBuilder: React.FC<OnboardingRoutineBuilderProps> = ({
  open,
  onOpenChange,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [selectedIntents, setSelectedIntents] = useState<Intent[]>([]);
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);
  const [scoredRoutines, setScoredRoutines] = useState<ScoredRoutine[]>([]);
  const [isUnsureOfRole, setIsUnsureOfRole] = useState(false);
  const [showAllRoutines, setShowAllRoutines] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const state: OnboardingState = JSON.parse(stored);
          setSelectedPersonas(state.selectedPersonas || []);
          setSelectedIntents(state.selectedIntents || []);
          setSelectedRoutineIds(state.selectedRoutineIds || []);
          setIsUnsureOfRole(state.isUnsureOfRole || false);
          setShowAllRoutines(state.showAllRoutines || false);
          
          // Determine step based on state
          if (state.selectedPersonas && state.selectedPersonas.length > 0 && state.selectedIntents.length > 0) {
            setStep(3);
          } else if (state.selectedPersonas && state.selectedPersonas.length > 0) {
            setStep(2);
          } else {
            setStep(1);
          }
        } catch {
          // Invalid stored state, start fresh
        }
      }
    }
  }, [open]);

  // Save state to localStorage
  const saveState = () => {
    const state: OnboardingState = {
      selectedPersonas,
      selectedIntents,
      selectedRoutineIds,
      isUnsureOfRole,
      showAllRoutines,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Handle role toggle (Step 1)
  const handleRoleToggle = (persona: Persona) => {
    if (selectedPersonas.includes(persona)) {
      setSelectedPersonas(selectedPersonas.filter(p => p !== persona));
    } else {
      setSelectedPersonas([...selectedPersonas, persona]);
    }
    saveState();
  };

  // Handle continue to step 2
  const handleContinueToStep2 = () => {
    if (selectedPersonas.length > 0 || isUnsureOfRole) {
      setStep(2);
    }
  };

  // Handle intent selection (Step 2 → Step 3)
  const handleIntentsSelect = (intents: Intent[]) => {
    setSelectedIntents(intents);
    
    // If unsure or showing all routines, show ALL routines
    // Otherwise, score and limit to top 7
    const limit = (isUnsureOfRole || showAllRoutines) ? undefined : 7;
    
    // Score and rank routines with multiple personas
    const scored = scoreAndRankRoutines(
      ROUTINE_LIBRARY,
      {
        personas: selectedPersonas,
        intents,
      },
      limit
    );
    
    setScoredRoutines(scored);
    
    // Preselect top routines (or all if showing all)
    const topRoutineIds = scored
      .slice(0, limit || scored.length)
      .map((s) => s.routine.id);
    setSelectedRoutineIds(topRoutineIds);
    
    saveState();
    setStep(3);
  };

  // Handle routine selection changes (Step 3)
  const handleRoutineToggle = (routineId: string, selected: boolean) => {
    if (selected) {
      setSelectedRoutineIds([...selectedRoutineIds, routineId]);
    } else {
      setSelectedRoutineIds(selectedRoutineIds.filter((id) => id !== routineId));
    }
    saveState();
  };

  // Handle final completion
  const handleComplete = () => {
    saveState();
    onComplete(selectedRoutineIds);
    onOpenChange(false);
    
    // Clear onboarding state after completion
    localStorage.removeItem(STORAGE_KEY);
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
  };

  // Handle "Skip to all routines"
  const handleSkipToAll = () => {
    setShowAllRoutines(true);
    setIsUnsureOfRole(false);
    
    // Score ALL routines with no personas/intents
    const scored = scoreAndRankRoutines(
      ROUTINE_LIBRARY,
      {
        personas: [],
        intents: [],
      },
      undefined // No limit, show all
    );
    
    setScoredRoutines(scored);
    
    // Preselect top 7 routines
    const topRoutineIds = scored.slice(0, 7).map((s) => s.routine.id);
    setSelectedRoutineIds(topRoutineIds);
    
    saveState();
    setStep(3);
  };

  // Handle clear all (reset wizard and go back to step 1)
  const handleClearAll = () => {
    setStep(1);
    setSelectedPersonas([]);
    setSelectedIntents([]);
    setSelectedRoutineIds([]);
    setScoredRoutines([]);
    setIsUnsureOfRole(false);
    setShowAllRoutines(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Handle close/reset
  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setStep(1);
      setSelectedPersonas([]);
      setSelectedIntents([]);
      setSelectedRoutineIds([]);
      setScoredRoutines([]);
      setIsUnsureOfRole(false);
      setShowAllRoutines(false);
    }
    onOpenChange(open);
  };

  // Group routines by frequency for Step 3
  const groupedRoutines = scoredRoutines.length > 0
    ? groupRoutinesByFrequency(scoredRoutines)
    : { Daily: [], Weekly: [], Monthly: [] };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <div className="relative px-8 pt-8 pb-6 border-b border-border/50">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <DialogTitle className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Create Your Routines
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  {step === 1 && 'Start by selecting your primary role to get personalized recommendations'}
                  {step === 2 && 'Select areas you want to improve to refine your routine selection'}
                  {step === 3 && (showAllRoutines 
                    ? 'Browse and select from all available routines' 
                    : isUnsureOfRole 
                    ? 'Review all available routines to help you discover what might be useful'
                    : 'Review and finalize your routine collection')}
                </DialogDescription>
              </div>
            </div>
            
            {/* Enhanced Progress indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`
                        relative flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold
                        transition-all duration-300
                        ${s === step
                          ? 'bg-gradient-to-br from-[#2063F0] to-[#1a54d8] text-white shadow-lg shadow-[#2063F0]/30 scale-110'
                          : s < step
                          ? 'bg-gradient-to-br from-[#31C7AD] to-[#2ab89a] text-white shadow-md'
                          : 'bg-muted/50 text-muted-foreground border-2 border-border'}
                      `}
                    >
                      {s < step ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        s
                      )}
                      {s === step && (
                        <div className="absolute inset-0 rounded-full bg-[#2063F0] animate-ping opacity-20" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${s === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s === 1 ? 'Role' : s === 2 ? 'Goals' : 'Review'}
                    </span>
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
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
          {step === 1 && (
            <RoleSelectionStep
              selectedPersonas={selectedPersonas}
              onToggle={handleRoleToggle}
              isUnsure={isUnsureOfRole}
              onUnsureChange={setIsUnsureOfRole}
              onSkipToAll={handleSkipToAll}
              onNext={handleContinueToStep2}
            />
          )}
          {step === 2 && (
            <IntentSelectionStep
              selectedIntents={selectedIntents}
              onSelect={handleIntentsSelect}
              onBack={handleBack}
            />
          )}
          {step === 3 && (
            <RoutineReviewStep
              groupedRoutines={groupedRoutines}
              selectedRoutineIds={selectedRoutineIds}
              onRoutineToggle={handleRoutineToggle}
              onComplete={handleComplete}
              onBack={handleBack}
              onClearAll={handleClearAll}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

