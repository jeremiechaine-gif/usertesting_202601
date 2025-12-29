import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { ScopeModal } from './ScopeModal';
import { OnboardingRoutineBuilder } from './OnboardingRoutineBuilder/OnboardingRoutineBuilder';
import { OnboardingTeamBuilder } from './OnboardingTeamBuilder/OnboardingTeamBuilder';
import { SimpleOnboardingWizard } from './SimpleOnboardingWizard/SimpleOnboardingWizard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanDropdown } from './PlanDropdown';
import { type Scope, getScopes } from '@/lib/scopes';
import { createRoutinesFromLibraryEntries } from '@/lib/onboarding/routineConverter';
import { resetScopesAndRoutines } from '@/lib/resetData';
import { 
  Bell, 
  Menu, 
  CheckCircle2,
  Video,
  FileText,
  Sparkles,
  TrendingUp,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface HomePageProps {
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

interface OnboardingTask {
  id: string;
  label: string;
  action: string;
  completed: boolean;
  onClick: () => void;
}

interface AcademyResource {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isNew?: boolean;
  onClick: () => void;
}

const ONBOARDING_TASKS_STORAGE_KEY = 'pelico-onboarding-tasks-status';

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'erp' | 'prod' | null>('erp');
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [routineBuilderOpen, setRoutineBuilderOpen] = useState(false);
  const [teamBuilderOpen, setTeamBuilderOpen] = useState(false);
  const [simpleOnboardingOpen, setSimpleOnboardingOpen] = useState(false);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetConfirmStep, setResetConfirmStep] = useState<'first' | 'second'>('first');
  const [simpleOnboardingProgress, setSimpleOnboardingProgress] = useState({ completed: 0, total: 4 });
  
  // Initialize tasks with default values
  const getInitialTasks = (): OnboardingTask[] => [
    {
      id: 'define-scope',
      label: 'Define scope',
      action: 'Define scope',
      completed: false,
      onClick: () => {
        setEditingScope(null);
        setScopeModalOpen(true);
      },
    },
    {
      id: 'create-routine',
      label: 'Create routine',
      action: 'Create routine',
      completed: false,
      onClick: () => setRoutineBuilderOpen(true),
    },
    {
      id: 'manage-team',
      label: 'Manage team',
      action: 'Manage team',
      completed: false,
      onClick: () => {
        // Open team builder wizard
        setTeamBuilderOpen(true);
      },
    },
  ];
  
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>(getInitialTasks);
  const userName = 'Jérémie';

  // Load task completion status from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ONBOARDING_TASKS_STORAGE_KEY);
      if (stored) {
        const completionStatus: Record<string, boolean> = JSON.parse(stored);
        setOnboardingTasks((tasks) =>
          tasks.map((task) => ({
            ...task,
            completed: completionStatus[task.id] ?? task.completed,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load onboarding tasks status:', error);
    }
  }, []);

  // Helper to update task status and persist to localStorage
  const updateTaskStatus = useCallback((taskId: string, completed: boolean) => {
    setOnboardingTasks((tasks) => {
      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, completed } : task
      );
      
      // Persist completion status to localStorage
      const completionStatus: Record<string, boolean> = {};
      updatedTasks.forEach((task) => {
        completionStatus[task.id] = task.completed;
      });
      localStorage.setItem(ONBOARDING_TASKS_STORAGE_KEY, JSON.stringify(completionStatus));
      
      return updatedTasks;
    });
  }, []);

  // Recalculate progress when Simple Onboarding wizard closes
  useEffect(() => {
    if (!simpleOnboardingOpen) {
      const STORAGE_KEY = 'pelico-simple-onboarding-state';
      const stored = localStorage.getItem(STORAGE_KEY);
      let completedSteps = 0;
      const totalSteps = 4;
      
      if (stored) {
        try {
          const state = JSON.parse(stored);
          const teams = state.teams || [];
          
          // Step 0: Create Teams - at least one team created
          if (teams.length > 0) {
            completedSteps++;
            
            // Step 1: Choose Routines - all teams have at least one routine
            const allTeamsHaveRoutines = teams.every((team: any) => 
              team.assignedRoutineIds && team.assignedRoutineIds.length > 0
            );
            if (allTeamsHaveRoutines && teams.length > 0) {
              completedSteps++;
              
              // Step 2: Add Members - all teams have at least one member
              const allTeamsHaveMembers = teams.every((team: any) => 
                team.memberIds && team.memberIds.length > 0
              );
              if (allTeamsHaveMembers && teams.length > 0) {
                completedSteps++;
                
                // Step 3: Create Scopes - optional, but if we reached step 3, consider it done
                if (state.currentStep >= 3) {
                  completedSteps++;
                }
              }
            }
          }
        } catch (e) {
          // Invalid state, progress stays at 0
        }
      }
      
      setSimpleOnboardingProgress({ completed: completedSteps, total: totalSteps });
    }
  }, [simpleOnboardingOpen]);

  // Check if "Define scope" task should be marked as completed based on scopes
  useEffect(() => {
    const scopes = getScopes();
    const hasAtLeastOneScope = scopes.length > 0;
    updateTaskStatus('define-scope', hasAtLeastOneScope);
  }, [updateTaskStatus]); // Run on mount and when updateTaskStatus changes

  // Listen for scope changes (when modal closes after saving)
  useEffect(() => {
    const scopes = getScopes();
    const hasAtLeastOneScope = scopes.length > 0;
    updateTaskStatus('define-scope', hasAtLeastOneScope);
  }, [scopeModalOpen, updateTaskStatus]); // Run when scope modal opens/closes


  // Mock academy resources
  const academyResources: AcademyResource[] = [
    {
      id: 'getting-started',
      title: 'Getting started with Pelico',
      icon: Sparkles,
      isNew: true,
      onClick: () => console.log('Getting started'),
    },
    {
      id: 'video-tutorials',
      title: 'Video tutorials',
      icon: Video,
      onClick: () => console.log('Video tutorials'),
    },
    {
      id: 'best-practices',
      title: 'Best practices guide',
      icon: FileText,
      onClick: () => console.log('Best practices'),
    },
    {
      id: 'advanced-features',
      title: 'Advanced features',
      icon: TrendingUp,
      onClick: () => console.log('Advanced features'),
    },
  ];

  const handleTaskAction = (task: OnboardingTask) => {
    task.onClick();
  };

  const handleResetClick = () => {
    setResetConfirmStep('first');
    setResetConfirmOpen(true);
  };

  const handleResetConfirm = () => {
    if (resetConfirmStep === 'first') {
      setResetConfirmStep('second');
    } else {
      // Second confirmation - proceed with reset
      try {
        resetScopesAndRoutines();
        setResetConfirmOpen(false);
        setResetConfirmStep('first');
        // Reload the page
        window.location.reload();
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('An error occurred while resetting data. Please try again.');
      }
    }
  };

  const handleResetCancel = () => {
    setResetConfirmOpen(false);
    setResetConfirmStep('first');
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      <Sidebar
        activeItem="home"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {sidebarCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-0 top-4 z-50 h-8 w-8"
          onClick={() => setSidebarCollapsed(false)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        {/* Main Header with Gradient */}
        <div className="relative border-b bg-background">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/5 via-[#2063F0]/5 to-transparent pointer-events-none" />
          <div className="relative px-6 py-5">
            {/* Top Header Row */}
            <div className="flex items-center justify-between">
              {/* Left Side */}
              <div className="flex items-center gap-4">
                {sidebarCollapsed && (
                  <Button 
                    variant="ghost" 
                    className="h-9 px-3 gap-2 hover:bg-[#31C7AD]/10"
                    onClick={() => setSidebarCollapsed(false)}
                  >
                    <Menu className="w-4 h-4" />
                    <img 
                      src="/images/Pelico-small-logo.svg" 
                      alt="Pelico" 
                      className="h-4 w-auto"
                    />
                    <span className="text-sm font-medium">Menu</span>
                  </Button>
                )}
                {/* Pelico small logo */}
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-sm">
                  <img 
                    src="/images/Pelico-small-logo.svg" 
                    alt="Pelico" 
                    className="w-5 h-5 shrink-0 brightness-0 invert"
                  />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Home</h1>
                <div className="h-6 w-px bg-border/60" />
                <PlanDropdown
                  selectedPlan={selectedPlan}
                  onPlanSelect={setSelectedPlan}
                />
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-[#31C7AD]/10">
                  <Bell className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text mb-2">
              Hello {userName},
            </h2>
            <p className="text-muted-foreground text-base">Here's what we have for you today</p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pelico Onboarding Card */}
            <div className="bg-background border border-border/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 border border-[#31C7AD]/20">
                  <CheckCircle2 className="h-5 w-5 text-[#31C7AD]" />
                </div>
                <h3 className="text-xl font-bold">Pelico onboarding</h3>
              </div>
              <div className="space-y-3">
                {onboardingTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg transition-all border",
                      task.completed 
                        ? "bg-[#31C7AD]/10 border-[#31C7AD]/20" 
                        : "bg-muted/30 border-border/60 hover:bg-muted/50 hover:border-[#2063F0]/30 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#31C7AD] shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        task.completed && "text-muted-foreground line-through"
                      )}>
                        {task.label}
                      </span>
                    </div>
                    {!task.completed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm h-auto py-1.5 px-3 text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/10 font-medium"
                        onClick={() => handleTaskAction(task)}
                      >
                        {task.action}
                      </Button>
                    )}
                  </div>
                ))}
                
                {/* Reset Data Button */}
                <div className="pt-3 mt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetClick}
                    className="w-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset data
                  </Button>
                </div>
              </div>
            </div>

            {/* Pelico Academy Card */}
            <div className="bg-background border border-border/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 border border-[#2063F0]/20">
                    <Sparkles className="h-5 w-5 text-[#2063F0]" />
                  </div>
                  <h3 className="text-xl font-bold">Pelico Academy</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-sm h-auto font-medium hover:bg-[#2063F0]/10 hover:text-[#2063F0]">
                  Help Center
                </Button>
              </div>
              <div className="space-y-2">
                {academyResources.map((resource) => {
                  const Icon = resource.icon;
                  return (
                    <button
                      key={resource.id}
                      onClick={resource.onClick}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 hover:border-[#2063F0]/20 transition-all text-left border border-transparent"
                    >
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-muted/50 to-muted/30">
                        <Icon className="h-4 w-4 text-foreground shrink-0" />
                      </div>
                      <span className="text-sm font-medium flex-1">{resource.title}</span>
                      {resource.isNew && (
                        <Badge className="text-xs bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/20">
                          New
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Simple Onboarding Section */}
          <div className="mt-6">
            <div className="bg-background border border-border/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 border border-[#31C7AD]/20">
                  <CheckCircle2 className="h-5 w-5 text-[#31C7AD]" />
                </div>
                <h3 className="text-xl font-bold">Simple onboarding</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg transition-all border bg-muted/30 border-border/60 hover:bg-muted/50 hover:border-[#2063F0]/30 hover:shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm h-auto py-1.5 px-3 text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/10 font-medium"
                    onClick={() => setSimpleOnboardingOpen(true)}
                  >
                    Set-up your workspace
                  </Button>
                  
                  {/* Progress Bar */}
                  <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{simpleOnboardingProgress.completed} / {simpleOnboardingProgress.total}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2063F0] to-[#31C7AD] transition-all duration-300"
                        style={{ width: `${(simpleOnboardingProgress.completed / simpleOnboardingProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Reset Data Button */}
                <div className="pt-3 mt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetClick}
                    className="w-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Onboarding Wizard */}
      <SimpleOnboardingWizard
        open={simpleOnboardingOpen}
        onOpenChange={setSimpleOnboardingOpen}
        onComplete={() => {
          setSimpleOnboardingOpen(false);
          // Reload page to reflect changes
          window.location.reload();
        }}
      />

      {/* Reset Confirmation Modal */}
      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle className="text-xl">
                {resetConfirmStep === 'first' ? 'Reset Onboarding Data?' : 'Are you absolutely sure?'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              {resetConfirmStep === 'first' ? (
                <>
                  This will permanently delete <strong>all data created during onboarding</strong>:
                  <br /><br />
                  • All scopes<br />
                  • All routines<br />
                  • All teams<br />
                  • All team and member assignments<br />
                  • All onboarding progress<br /><br />
                  <strong>User accounts will be preserved, but their assignments will be cleared.</strong>
                  <br /><br />
                  This action cannot be undone. Are you sure you want to continue?
                </>
              ) : (
                <>
                  This is your final confirmation. Clicking "Confirm Reset" will:
                  <br /><br />
                  • Delete all scopes<br />
                  • Delete all routines<br />
                  • Delete all routine folders<br />
                  • Delete all teams<br />
                  • Clear all member assignments<br />
                  • Clear all scope assignments<br />
                  • Reset all onboarding progress<br /><br />
                  <strong>User accounts will be preserved, but all their assignments will be cleared.</strong>
                  <br /><br />
                  The page will reload automatically after reset.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleResetCancel}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetConfirm}
            >
              {resetConfirmStep === 'first' ? 'Continue' : 'Confirm Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scope Creation Modal */}
      <ScopeModal
        open={scopeModalOpen}
        onOpenChange={setScopeModalOpen}
        scope={editingScope}
        title={editingScope ? 'Edit Scope' : 'Define Your Scope'}
        onSave={() => {
          setScopeModalOpen(false);
          setEditingScope(null);
        }}
      />

      {/* Onboarding Routine Builder */}
      <OnboardingRoutineBuilder
        open={routineBuilderOpen}
        onOpenChange={setRoutineBuilderOpen}
        onComplete={(selectedRoutineIds) => {
          // Create routines from selected library entry IDs
          if (selectedRoutineIds.length > 0) {
            const { created, skipped } = createRoutinesFromLibraryEntries(selectedRoutineIds);
            
            if (created.length > 0) {
              console.log(`Created ${created.length} routine${created.length > 1 ? 's' : ''} from onboarding${skipped > 0 ? ` (${skipped} skipped - already exist)` : ''}`);
              
              // Mark onboarding task as completed and persist to localStorage
              updateTaskStatus('create-routine', true);
            } else {
              console.log('All selected routines already exist');
            }
          }
        }}
      />

      {/* Onboarding Team Builder */}
      <OnboardingTeamBuilder
        open={teamBuilderOpen}
        onOpenChange={setTeamBuilderOpen}
        onComplete={() => {
          // Mark onboarding task as completed and persist to localStorage
          updateTaskStatus('manage-team', true);
        }}
      />
    </div>
  );
};

