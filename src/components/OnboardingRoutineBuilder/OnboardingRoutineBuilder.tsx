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
  selectedPersona: Persona | null;
  selectedIntents: Intent[];
  selectedRoutineIds: string[];
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
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedIntents, setSelectedIntents] = useState<Intent[]>([]);
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);
  const [scoredRoutines, setScoredRoutines] = useState<ScoredRoutine[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const state: OnboardingState = JSON.parse(stored);
          setSelectedPersona(state.selectedPersona);
          setSelectedIntents(state.selectedIntents || []);
          setSelectedRoutineIds(state.selectedRoutineIds || []);
          
          // Determine step based on state
          if (state.selectedPersona && state.selectedIntents.length > 0) {
            setStep(3);
          } else if (state.selectedPersona) {
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
      selectedPersona,
      selectedIntents,
      selectedRoutineIds,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Handle role selection (Step 1 → Step 2)
  const handleRoleSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    saveState();
    setStep(2);
  };

  // Handle intent selection (Step 2 → Step 3)
  const handleIntentsSelect = (intents: Intent[]) => {
    setSelectedIntents(intents);
    
    // Score and rank routines
    const scored = scoreAndRankRoutines(
      ROUTINE_LIBRARY,
      {
        persona: selectedPersona,
        intents,
      },
      7 // Initial limit
    );
    
    setScoredRoutines(scored);
    
    // Preselect top routines
    const topRoutineIds = scored.map((s) => s.routine.id);
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

  // Handle close/reset
  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setStep(1);
      setSelectedPersona(null);
      setSelectedIntents([]);
      setSelectedRoutineIds([]);
      setScoredRoutines([]);
    }
    onOpenChange(open);
  };

  // Group routines by frequency for Step 3
  const groupedRoutines = scoredRoutines.length > 0
    ? groupRoutinesByFrequency(scoredRoutines)
    : { Daily: [], Weekly: [], Monthly: [] };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-2xl font-bold">
            Create Your Routines
          </DialogTitle>
          <DialogDescription className="text-base">
            {step === 1 && 'Start by selecting your primary role'}
            {step === 2 && 'What do you want to improve first?'}
            {step === 3 && 'Review and customize your routines'}
          </DialogDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${s === step
                      ? 'bg-[#2063F0] text-white'
                      : s < step
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'}
                  `}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 flex-1 rounded ${
                      s < step ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              Step {step}/3
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {step === 1 && (
            <RoleSelectionStep
              selectedPersona={selectedPersona}
              onSelect={handleRoleSelect}
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
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

