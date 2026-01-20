/**
 * Create Routine Full Page Wizard Component
 * Full-page version of the routine creation wizard
 * Displays with sidebar showing CREATE ROUTINE substeps
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ArrowRight, 
  X,
  CheckCircle2,
  Circle,
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
import type { Objective } from '@/lib/onboarding/types';

export type CreateRoutineStep = 'choose-view' | 'configure';

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
  const [selectedObjective, setSelectedObjective] = useState<Objective | string>('');
  const [customObjective, setCustomObjective] = useState('');
  const [showCustomObjectiveInput, setShowCustomObjectiveInput] = useState(false);
  
  const viewsByIntent = getViewsByIntent();
  const contentRef = useRef<HTMLDivElement>(null);

  // Debug and fix width issues
  useEffect(() => {
    const checkWidth = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        const parentRect = contentRef.current.parentElement?.getBoundingClientRect();
        const grandParentRect = contentRef.current.parentElement?.parentElement?.getBoundingClientRect();
        
        console.log('Width check:', {
          elementWidth: rect.width,
          parentWidth: parentRect?.width,
          grandParentWidth: grandParentRect?.width,
          windowWidth: window.innerWidth,
          scrollWidth: contentRef.current.scrollWidth,
          clientWidth: contentRef.current.clientWidth,
        });
        
        if (rect.width > (parentRect?.width || window.innerWidth)) {
          console.warn('Width overflow detected:', {
            elementWidth: rect.width,
            parentWidth: parentRect?.width,
            grandParentWidth: grandParentRect?.width,
            windowWidth: window.innerWidth,
            scrollWidth: contentRef.current.scrollWidth,
            clientWidth: contentRef.current.clientWidth,
          });
          
          // Find the widest child
          const children = Array.from(contentRef.current.children);
          children.forEach((child, index) => {
            const childRect = (child as HTMLElement).getBoundingClientRect();
            if (childRect.width > (parentRect?.width || window.innerWidth)) {
              console.warn(`Child ${index} is too wide:`, {
                tagName: child.tagName,
                className: child.className,
                width: childRect.width,
                scrollWidth: (child as HTMLElement).scrollWidth,
                clientWidth: (child as HTMLElement).clientWidth,
              });
            }
          });
          
          // Force correct width
          const maxAllowedWidth = Math.min(parentRect?.width || window.innerWidth, window.innerWidth);
          contentRef.current.style.maxWidth = `${maxAllowedWidth}px`;
          contentRef.current.style.width = '100%';
          contentRef.current.style.boxSizing = 'border-box';
        }
      }
    };
    
    checkWidth();
    const interval = setInterval(checkWidth, 500);
    window.addEventListener('resize', checkWidth);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkWidth);
    };
  }, [currentStep]);

  // Reset state when component mounts
  useEffect(() => {
    setCurrentStep('choose-view');
    setSelectedView(null);
    setFilters([]);
    setSorting([]);
    setRoutineName('');
    setRoutineDescription('');
    setSelectedPersonas([]);
    setSelectedObjective('');
    setCustomObjective('');
    setShowCustomObjectiveInput(false);
  }, []);

  // Suggest objective based on view intent
  const suggestObjectiveFromView = (view: PelicoViewDefinition): Objective => {
    const intentToObjective: Record<string, Objective> = {
      'resolve-blockers': 'Correct',
      'execute-operations': 'Monitor',
      'anticipate-risks': 'Anticipate',
      'manage-customer-commitments': 'Monitor',
      'investigate-causes-impacts': 'Monitor',
    };
    return intentToObjective[view.intent] || 'Monitor';
  };

  const handleViewSelect = (view: PelicoViewDefinition) => {
    setSelectedView(view);
    setCurrentStep('configure');
    // Suggest objective when view is selected
    const suggested = suggestObjectiveFromView(view);
    setSelectedObjective(suggested);
  };

  const handleNextFromConfigure = () => {
    // No longer needed - Create button directly saves
  };

  const handleBackFromConfigure = () => {
    setCurrentStep('choose-view');
  };


  const handleSave = () => {
    if (!selectedView || !routineName.trim()) return;

    const currentUserId = getCurrentUserId();
    const objectives: Objective[] = selectedObjective && !showCustomObjectiveInput 
      ? [selectedObjective as Objective]
      : customObjective.trim() 
      ? [customObjective.trim() as Objective]
      : [];
    
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
      objectives: objectives.length > 0 ? objectives : undefined,
    });

    onRoutineCreated(routine.id);
    onClose();
  };

  const canProceedFromConfigure = routineName.trim().length > 0;

  // Step labels matching SimpleOnboardingWizard
  const stepLabels: Record<number, string> = {
    0: 'Bienvenue & Création d\'équipes',
    1: 'Ajouter des membres',
    2: 'Créer des périmètres',
    3: 'Routines',
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex overflow-hidden" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Sidebar Navigation - Matching SimpleOnboardingWizard design */}
      <div className="w-72 bg-muted/30 border-r border-border flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="px-6 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#2063F0] to-[#31C7AD] bg-clip-text text-transparent">
                Configurer votre espace de travail
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
                onClick={onClose}
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
            {[0, 1, 2, 3].map((stepIndex) => {
              const isActive = stepIndex === 3; // Step 4 (Routines) is active when creating routine
              const isCompleted = stepIndex < 3; // Steps 1-3 are completed
              const showRoutineSubsteps = stepIndex === 3 && isActive;

              return (
                <React.Fragment key={stepIndex}>
                  <div
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-lg transition-all text-left',
                      'border-2',
                      isActive
                        ? 'border-[#2063F0] bg-[#2063F0]/10 shadow-md'
                        : isCompleted
                        ? 'border-[#31C7AD]/30 bg-[#31C7AD]/5'
                        : 'border-border bg-background'
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
                  </div>
                  
                  {/* Routine Creation Substeps - Only show when Step 4 is active */}
                  {showRoutineSubsteps && (
                    <div className="ml-6 space-y-2 border-l-2 border-[#2063F0]/20 pl-4 mt-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Créer une routine
                      </div>
                      {(['choose-view', 'configure'] as const).map((substep, substepIndex) => {
                        const substepLabels = {
                          'choose-view': 'Choisir la vue',
                          'configure': 'Configurer',
                        };
                        const isSubstepActive = currentStep === substep;
                        const isSubstepCompleted = ['choose-view', 'configure'].indexOf(currentStep) > substepIndex;
                        const canNavigateToSubstep = isSubstepCompleted || isSubstepActive;

                        return (
                          <button
                            key={substep}
                            onClick={() => {
                              if (canNavigateToSubstep) {
                                setCurrentStep(substep);
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
                4 / 4
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2063F0] to-[#31C7AD] transition-all duration-300"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden max-w-full w-0">
        {/* Header - fixed */}
        <div className="relative shrink-0 border-b border-border bg-background z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <div className="relative px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Routines / Créer une routine / {currentStep === 'choose-view' ? 'Choisir la vue' : 'Configurer'}
                </div>
                <h1 className="text-xl sm:text-2xl page-title">
                  Créer une routine
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

        {/* Content area - scrollable */}
        <div 
          className="flex-1 min-h-0 overflow-hidden" 
          style={{ 
            maxWidth: '100%', 
            overflowX: 'hidden', 
            width: '100%',
            position: 'relative'
          }}
        >
          <div 
            className="h-full w-full overflow-y-auto overflow-x-hidden"
            style={{ 
              maxWidth: '100%', 
              overflowX: 'hidden', 
              width: '100%',
              position: 'relative'
            }}
          >
            <div 
              ref={contentRef}
              data-routine-wizard-content
              className="px-2 pt-2 pb-2 w-full box-border" 
              style={{ 
                maxWidth: '100%', 
                width: '100%', 
                overflowX: 'hidden',
                boxSizing: 'border-box'
              }}
            >
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
                  routineName={routineName}
                  routineDescription={routineDescription}
                  onRoutineNameChange={setRoutineName}
                  onRoutineDescriptionChange={setRoutineDescription}
                  selectedObjective={selectedObjective}
                  customObjective={customObjective}
                  showCustomObjectiveInput={showCustomObjectiveInput}
                  onObjectiveChange={setSelectedObjective}
                  onCustomObjectiveChange={setCustomObjective}
                  onShowCustomObjectiveInputChange={setShowCustomObjectiveInput}
                />
              )}

            </div>
          </div>
        </div>

        {/* Footer with navigation - fixed */}
        <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2 w-full bg-background z-10">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            {currentStep !== 'choose-view' && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (currentStep === 'configure') {
                    setCurrentStep('choose-view');
                  }
                }}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 order-1 sm:order-2 justify-end sm:justify-start">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Annuler
            </Button>
            
            {currentStep === 'configure' && (
              <Button
                variant="default"
                onClick={handleSave}
                disabled={!canProceedFromConfigure}
                className="w-full sm:w-auto"
              >
                Créer la routine
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
