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

  const substeps: { id: CreateRoutineStep; label: string }[] = [
    { id: 'choose-view', label: 'Choose View' },
    { id: 'configure', label: 'Configure' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex overflow-hidden" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Sidebar */}
      <div className="hidden sm:flex w-48 lg:w-64 border-r border-border bg-muted/30 flex-col shrink-0">
        <div className="p-4 sm:p-6 border-b border-border">
          <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Create Routine
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <div className="space-y-2">
            {substeps.map((substep, index) => {
              const isActive = currentStep === substep.id;
              const isCompleted = ['choose-view', 'configure'].indexOf(currentStep) > index;
              
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
                    'w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm',
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden max-w-full w-0">
        {/* Header - fixed */}
        <div className="relative shrink-0 border-b border-border bg-background z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <div className="relative px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Routines / Create Routine / {substeps.find(s => s.id === currentStep)?.label}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold">
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
                variant="outline"
                onClick={() => {
                  if (currentStep === 'configure') {
                    setCurrentStep('choose-view');
                  }
                }}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 order-1 sm:order-2 justify-end sm:justify-start">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            
            {currentStep === 'configure' && (
              <Button
                onClick={handleSave}
                disabled={!canProceedFromConfigure}
                className="w-full sm:w-auto bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white"
              >
                Create
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
