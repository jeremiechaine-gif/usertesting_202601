import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ScopeModal } from './ScopeModal';
import { OnboardingRoutineBuilder } from './OnboardingRoutineBuilder/OnboardingRoutineBuilder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanDropdown } from './PlanDropdown';
import { type Scope } from '@/lib/scopes';
import { createRoutinesFromLibraryEntries } from '@/lib/onboarding/routineConverter';
import { 
  Bell, 
  Menu, 
  Save, 
  ChevronDown, 
  Link as LinkIcon,
  CheckCircle2,
  Video,
  FileText,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HomePageProps {
  onNavigate?: (page: string) => void;
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

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'erp' | 'prod' | null>('erp');
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [routineBuilderOpen, setRoutineBuilderOpen] = useState(false);
  
  // Initialize tasks with default values
  const getInitialTasks = (): OnboardingTask[] => [
    {
      id: 'complete-profile',
      label: 'Complete company profile',
      action: 'Set up',
      completed: true,
      onClick: () => console.log('Complete profile'),
    },
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
      onClick: () => onNavigate?.('users'),
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
  const updateTaskStatus = (taskId: string, completed: boolean) => {
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
  };


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

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      <Sidebar
        activeItem="home"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={onNavigate}
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
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Banner */}
        <div className="bg-muted px-6 py-2.5 text-sm border-b">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
            <span className="font-medium">This is a test banner. You're on a test environment.</span>
          </div>
        </div>

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
                {/* Save/Download Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3 gap-1.5 hover:bg-[#31C7AD]/10">
                      <Save className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Save</DropdownMenuItem>
                    <DropdownMenuItem>Download</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Link Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3 gap-1.5 hover:bg-[#31C7AD]/10">
                      <LinkIcon className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Copy Link</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-border/60" />

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

          {/* Main Hero Card */}
          <div className="relative mb-8 rounded-xl p-8 overflow-hidden border border-[#2063F0]/20 bg-background shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2063F0]/10 via-[#31C7AD]/5 to-transparent" />
            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Kick-start your supply chain optimization with Pelico</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-3xl">
                    Optimize your supply chain operations with intelligent scopes, routines, and analytics. 
                    Define scopes to filter your data, create routines to save your preferred views, and 
                    manage your team to collaborate effectively on supply chain decisions.
                  </p>
                </div>
              </div>
            </div>
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
        </div>
      </div>

      {/* Scope Creation Modal - Always in guided mode from Home page */}
      <ScopeModal
        open={scopeModalOpen}
        onOpenChange={setScopeModalOpen}
        scope={editingScope}
        mode="guided"
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
              
              // Navigate to scope-routines page after modal closes
              // Small delay to ensure modal closing animation completes
              setTimeout(() => {
                onNavigate?.('scope-routines');
              }, 300);
            } else {
              console.log('All selected routines already exist');
            }
          }
        }}
      />
    </div>
  );
};

