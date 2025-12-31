/**
 * Create Routine Full Page Wizard Component
 * Full-page version of the routine creation wizard
 * Displays with sidebar showing CREATE ROUTINE substeps
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
  getViewsByIntent,
  type PelicoViewDefinition,
  type Persona,
} from '@/lib/onboarding/pelicoViews';
import { Step1ChooseView } from './SimpleOnboardingWizard/CreateRoutineWizard/Step1ChooseView';
import { Step3ConfigureRoutine } from './SimpleOnboardingWizard/CreateRoutineWizard/Step3ConfigureRoutine';
import { Step4SaveRoutine } from './SimpleOnboardingWizard/CreateRoutineWizard/Step4SaveRoutine';

export type CreateRoutineStep = 'choose-view' | 'configure' | 'save';

interface CreateRoutineFullPageWizardProps {
  onClose: () => void;
  onRoutineCreated: (routineId: string) => void;
  teamId?: string;
  teamPersona?: string; // French persona name (not used for recommendations)
}

export const CreateRoutineFullPageWizard: React.FC<CreateRoutineFullPageWizardProps> = ({
  onClose,
  onRoutineCreated,
  teamId,
}) => {
  const [currentStep, setCurrentStep] = useState<CreateRoutineStep>('choose-view');
  const [selectedView, setSelectedView] = useState<PelicoViewDefinition | null>(null);
  
  // Routine configuration state
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  
  const viewsByIntent = getViewsByIntent();

  // Reset state when component mounts
  useEffect(() => {
    setCurrentStep('choose-view');
    setSelectedView(null);
    setFilters([]);
    setSorting([]);
    setRoutineName('');
    setRoutineDescription('');
    setSelectedPersonas([]);
  }, []);

  const handleViewSelect = (view: PelicoViewDefinition) => {
    setSelectedView(view);
    setCurrentStep('configure');
  };

  const handleNextFromConfigure = () => {
    setCurrentStep('save');
  };

  const handleBackFromConfigure = () => {
    setCurrentStep('choose-view');
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

  const canProceedFromSave = routineName.trim().length > 0;

  const substeps: { id: CreateRoutineStep; label: string }[] = [
    { id: 'choose-view', label: 'Choose View' },
    { id: 'configure', label: 'Configure' },
    { id: 'save', label: 'Save' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-muted/30 flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Create Routine
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {substeps.map((substep, index) => {
              const isActive = currentStep === substep.id;
              const isCompleted = ['choose-view', 'configure', 'save'].indexOf(currentStep) > index;
              
              return (
                <button
                  key={substep.id}
                  onClick={() => {
                    // Allow navigation to completed steps or current step
                    if (isCompleted || isActive) {
                      setCurrentStep(substep.id);
                    }
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2',
                    isActive && 'bg-[#2063F0] text-white',
                    isCompleted && !isActive && 'bg-muted hover:bg-muted/80',
                    !isActive && !isCompleted && 'text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                      isCompleted
                        ? 'bg-[#31C7AD] text-white'
                        : isActive
                        ? 'bg-white text-[#2063F0]'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-sm font-medium">{substep.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="relative shrink-0 border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <div className="relative px-8 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Routines / Create Routine / {substeps.find(s => s.id === currentStep)?.label}
                </div>
                <h1 className="text-2xl font-bold">
                  Create Routine
                </h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-8 pt-6 pb-6 max-w-4xl mx-auto">
              {currentStep === 'choose-view' && (
                <Step1ChooseView
                  recommendedViews={[]} // No recommendations when creating from Scope and Routines
                  allViews={PELICO_VIEWS}
                  viewsByIntent={viewsByIntent}
                  showAllViews={true} // Always show all views
                  onToggleShowAll={() => {}} // No-op since we always show all
                  onViewSelect={handleViewSelect}
                  hasPersona={false} // No persona-based recommendations
                  selectedViewId={selectedView?.id}
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
          <div className="px-8 py-4 border-t border-border flex items-center justify-between shrink-0 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2">
              {currentStep !== 'choose-view' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 'configure') {
                      setCurrentStep('choose-view');
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
    </div>
  );
};
