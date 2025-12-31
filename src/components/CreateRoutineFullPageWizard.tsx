/**
 * Create Routine Full Page Wizard Component
 * Full-page version of the routine creation wizard
 * Reuses the same steps as CreateRoutineWizard but displays in full page mode
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createRoutine } from '@/lib/routines';
import { getCurrentUserId } from '@/lib/users';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import {
  PELICO_VIEWS,
  getRecommendedViewsForPersona,
  getViewsByIntent,
  mapPersonaToEnglish,
  type PelicoViewDefinition,
  type Persona,
} from '@/lib/onboarding/pelicoViews';
import { Step1ChooseView } from './SimpleOnboardingWizard/CreateRoutineWizard/Step1ChooseView';
import { Step2ExplainView } from './SimpleOnboardingWizard/CreateRoutineWizard/Step2ExplainView';
import { Step3ConfigureRoutine } from './SimpleOnboardingWizard/CreateRoutineWizard/Step3ConfigureRoutine';
import { Step4SaveRoutine } from './SimpleOnboardingWizard/CreateRoutineWizard/Step4SaveRoutine';

export type CreateRoutineStep = 'choose-view' | 'explain-view' | 'configure' | 'save';

interface CreateRoutineFullPageWizardProps {
  onClose: () => void;
  onRoutineCreated: (routineId: string) => void;
  teamId?: string;
  teamPersona?: string; // French persona name
}

export const CreateRoutineFullPageWizard: React.FC<CreateRoutineFullPageWizardProps> = ({
  onClose,
  onRoutineCreated,
  teamId,
  teamPersona: teamPersonaFrench,
}) => {
  const [currentStep, setCurrentStep] = useState<CreateRoutineStep>('choose-view');
  const [selectedView, setSelectedView] = useState<PelicoViewDefinition | null>(null);
  const [showAllViews, setShowAllViews] = useState(false);
  
  // Routine configuration state
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  
  // Map French persona to English and get recommended views
  const teamPersona = teamPersonaFrench ? mapPersonaToEnglish(teamPersonaFrench) : null;
  const recommendedViews = teamPersona ? getRecommendedViewsForPersona(teamPersona) : [];
  const viewsByIntent = getViewsByIntent();

  // Reset state when component mounts
  useEffect(() => {
    setCurrentStep('choose-view');
    setSelectedView(null);
    setShowAllViews(false);
    setFilters([]);
    setSorting([]);
    setRoutineName('');
    setRoutineDescription('');
    // Initialize personas with recommended personas from the view if available
    // Otherwise, initialize with team persona if available
    if (teamPersona) {
      setSelectedPersonas([teamPersona]);
    } else {
      setSelectedPersonas([]);
    }
  }, [teamPersona]);

  // Update selected personas when view changes
  useEffect(() => {
    if (selectedView) {
      if (teamPersona && selectedView.recommendedPersonas.includes(teamPersona)) {
        // If team has a persona and view recommends it, pre-select it
        setSelectedPersonas([teamPersona]);
      } else if (selectedView.recommendedPersonas.length > 0) {
        // Otherwise, pre-select recommended personas from the view (max 3)
        setSelectedPersonas(selectedView.recommendedPersonas.slice(0, 3));
      } else {
        // No recommended personas, keep current selection or empty
        setSelectedPersonas([]);
      }
    }
  }, [selectedView, teamPersona]);

  const handleViewSelect = (view: PelicoViewDefinition) => {
    setSelectedView(view);
    setCurrentStep('explain-view');
  };

  const handleNextFromExplain = () => {
    setCurrentStep('configure');
  };

  const handleBackFromConfigure = () => {
    setCurrentStep('explain-view');
  };

  const handleNextFromConfigure = () => {
    setCurrentStep('save');
  };

  const handleBackFromSave = () => {
    setCurrentStep('configure');
  };

  const handleSave = () => {
    if (!selectedView || !routineName.trim()) return;

    const currentUserId = getCurrentUserId();
    const routine = createRoutine({
      name: routineName.trim(),
      description: routineDescription.trim() || undefined,
      filters,
      sorting,
      pelicoView: selectedView.pelicoViewPage,
      scopeMode: 'scope-aware',
      createdBy: currentUserId,
      teamIds: teamId ? [teamId] : undefined,
      personas: selectedPersonas.length > 0 ? selectedPersonas : undefined,
    });

    onRoutineCreated(routine.id);
    onClose();
  };

  const canProceedFromChooseView = selectedView !== null;
  const canProceedFromExplain = true; // Always can proceed after explanation
  const canProceedFromConfigure = true; // Can always proceed (filters/sorting are optional)
  const canProceedFromSave = routineName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with step indicator */}
      <div className="relative shrink-0 border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              Create Routine
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {(['choose-view', 'explain-view', 'configure', 'save'] as CreateRoutineStep[]).map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === step;
              const isCompleted = ['choose-view', 'explain-view', 'configure', 'save'].indexOf(currentStep) > index;
              
              return (
                <React.Fragment key={step}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                        isCompleted
                          ? 'bg-[#31C7AD] text-white'
                          : isActive
                          ? 'bg-[#2063F0] text-white'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    {index < 3 && (
                      <div
                        className={cn(
                          'w-12 h-0.5 transition-colors',
                          isCompleted ? 'bg-[#31C7AD]' : 'bg-muted'
                        )}
                      />
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 pt-6 pb-6 max-w-4xl mx-auto">
            {currentStep === 'choose-view' && (
              <Step1ChooseView
                recommendedViews={recommendedViews}
                allViews={PELICO_VIEWS}
                viewsByIntent={viewsByIntent}
                showAllViews={showAllViews}
                onToggleShowAll={() => setShowAllViews(!showAllViews)}
                onViewSelect={handleViewSelect}
                hasPersona={!!teamPersona}
              />
            )}

            {currentStep === 'explain-view' && selectedView && (
              <Step2ExplainView
                view={selectedView}
                onNext={handleNextFromExplain}
                onBack={() => setCurrentStep('choose-view')}
              />
            )}

            {currentStep === 'configure' && selectedView && (
              <Step3ConfigureRoutine
                view={selectedView}
                filters={filters}
                sorting={sorting}
                onFiltersChange={setFilters}
                onSortingChange={setSorting}
                onNext={handleNextFromConfigure}
                onBack={handleBackFromConfigure}
              />
            )}

            {currentStep === 'save' && selectedView && (
              <Step4SaveRoutine
                view={selectedView}
                routineName={routineName}
                routineDescription={routineDescription}
                selectedPersonas={selectedPersonas}
                onNameChange={setRoutineName}
                onDescriptionChange={setRoutineDescription}
                onPersonasChange={setSelectedPersonas}
                onBack={handleBackFromSave}
              />
            )}
          </div>
        </ScrollArea>

        {/* Footer with navigation */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            {currentStep !== 'choose-view' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep === 'explain-view') {
                    setCurrentStep('choose-view');
                  } else if (currentStep === 'configure') {
                    setCurrentStep('explain-view');
                  } else if (currentStep === 'save') {
                    setCurrentStep('configure');
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {currentStep === 'choose-view' && (
              <Button
                disabled={!canProceedFromChooseView}
                className="opacity-0 pointer-events-none"
              >
                {/* Hidden - view selection triggers navigation directly */}
              </Button>
            )}
            
            {currentStep === 'explain-view' && (
              <Button onClick={handleNextFromExplain}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 'configure' && (
              <Button onClick={handleNextFromConfigure}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 'save' && (
              <Button
                onClick={handleSave}
                disabled={!canProceedFromSave}
                className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white"
              >
                Create Routine
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
