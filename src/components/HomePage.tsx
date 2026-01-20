import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { ScopeModal } from './ScopeModal';
import { OnboardingRoutineBuilder } from './OnboardingRoutineBuilder/OnboardingRoutineBuilder';
import { OnboardingTeamBuilder } from './OnboardingTeamBuilder/OnboardingTeamBuilder';
import { SimpleOnboardingWizard } from './SimpleOnboardingWizard/SimpleOnboardingWizard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type Scope, getScopes } from '@/lib/scopes';
import { createRoutinesFromLibraryEntries } from '@/lib/onboarding/routineConverter';
import { resetScopesAndRoutines } from '@/lib/resetData';
import { useRoutine } from '@/contexts/RoutineContext';
import { getCurrentUser } from '@/lib/users';
import { 
  Bell, 
  Menu, 
  CheckCircle2,
  Video,
  FileText,
  Sparkles,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  Package,
  Clock,
  TrendingDown,
  Users,
  BarChart3,
  AlertCircle,
  MessageCircle
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
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [routineBuilderOpen, setRoutineBuilderOpen] = useState(false);
  const [teamBuilderOpen, setTeamBuilderOpen] = useState(false);
  const [simpleOnboardingOpen, setSimpleOnboardingOpen] = useState(false);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetConfirmStep, setResetConfirmStep] = useState<'first' | 'second'>('first');
  const [simpleOnboardingProgress, setSimpleOnboardingProgress] = useState({ completed: 0, total: 4 });
  
  // Get routine refresh function to update sidebar after reset
  const { refreshRoutines } = useRoutine();
  
  // Check if current user is a manager
  const currentUser = getCurrentUser();
  const isManager = currentUser?.role === 'manager';
  
  // Initialize tasks with default values
  const getInitialTasks = (): OnboardingTask[] => [
    {
      id: 'define-scope',
      label: 'Définir le périmètre',
      action: 'Définir le périmètre',
      completed: false,
      onClick: () => {
        setEditingScope(null);
        setScopeModalOpen(true);
      },
    },
    {
      id: 'create-routine',
      label: 'Créer une routine',
      action: 'Créer une routine',
      completed: false,
      onClick: () => setRoutineBuilderOpen(true),
    },
    {
      id: 'manage-team',
      label: 'Gérer l\'équipe',
      action: 'Gérer l\'équipe',
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
      title: 'Démarrer avec Pelico',
      icon: Sparkles,
      isNew: true,
      onClick: () => console.log('Getting started'),
    },
    {
      id: 'video-tutorials',
      title: 'Tutoriels vidéo',
      icon: Video,
      onClick: () => console.log('Video tutorials'),
    },
    {
      id: 'best-practices',
      title: 'Guide des bonnes pratiques',
      icon: FileText,
      onClick: () => console.log('Best practices'),
    },
    {
      id: 'advanced-features',
      title: 'Fonctionnalités avancées',
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
        
        // Reset local state instead of reloading the page
        setOnboardingTasks(getInitialTasks());
        setSimpleOnboardingProgress({ completed: 0, total: 4 });
        
        // Refresh routines in sidebar to reflect the reset
        refreshRoutines();
        
        // Note: We stay on the home page - no page reload needed
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Une erreur s\'est produite lors de la réinitialisation des données. Veuillez réessayer.');
      }
    }
  };

  const handleResetCancel = () => {
    setResetConfirmOpen(false);
    setResetConfirmStep('first');
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] relative">
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
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative p-4 bg-muted/50">
        {/* Rounded container wrapping header + content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background border border-border/60 rounded-2xl shadow-sm">
          {/* Main Header with Gradient */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/5 via-[#2063F0]/5 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="relative px-6 py-5">
              {/* Top Header Row */}
              <div className="flex items-start justify-between mb-4">
                {/* Left Side */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
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
                  {/* Welcome Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-3xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text mb-2">
                          Bonjour {userName},
                        </h2>
                        <p className="text-muted-foreground text-base">Voici ce que nous avons pour vous aujourd'hui</p>
                      </div>
                      {/* Notifications - aligned with Hello */}
                      <div className="flex items-center gap-3 shrink-0">
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-[#31C7AD]/10">
                          <Bell className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto px-6 py-6">
          {isManager ? (
            /* Manager Dashboard - Metrics First, Then Academy and Onboarding */
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Key Metrics Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* OTD Rate */}
                <div className="bg-gradient-to-br from-background to-[#31C7AD]/5 border-2 border-[#31C7AD]/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10">
                      <Clock className="h-5 w-5 text-[#31C7AD]" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cette semaine</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Taux de livraison OTD</p>
                    <p className="text-3xl font-bold text-foreground">87.3%</p>
                    <div className="flex items-center gap-1 text-xs text-[#31C7AD] font-medium">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>+2.4% vs semaine dernière</span>
                    </div>
                  </div>
                </div>

                {/* Late Orders */}
                <div className="bg-gradient-to-br from-background to-red-500/5 border-2 border-red-500/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-red-500/20 to-red-500/10">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aujourd'hui</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Commandes en retard</p>
                    <p className="text-3xl font-bold text-foreground">23</p>
                    <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>5 critiques</span>
                    </div>
                  </div>
                </div>

                {/* Active Teams */}
                <div className="bg-gradient-to-br from-background to-[#2063F0]/5 border-2 border-[#2063F0]/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10">
                      <Users className="h-5 w-5 text-[#2063F0]" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actif</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Équipes actives</p>
                    <p className="text-3xl font-bold text-foreground">12</p>
                    <div className="flex items-center gap-1 text-xs text-[#2063F0] font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>48 membres au total</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supply Chain Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stock Alerts */}
                <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-border/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/10">
                      <Package className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">Alertes stock</h4>
                      <p className="text-xs text-muted-foreground">Surveillance en temps réel</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium">Ruptures de stock</span>
                      </div>
                      <span className="text-lg font-bold text-red-500">7</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-medium">Stock critique</span>
                      </div>
                      <span className="text-lg font-bold text-orange-500">15</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#31C7AD]/10 border border-[#31C7AD]/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#31C7AD]"></div>
                        <span className="text-sm font-medium">Stock optimal</span>
                      </div>
                      <span className="text-lg font-bold text-[#31C7AD]">156</span>
                    </div>
                  </div>
                </div>

                {/* Production Overview */}
                <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-border/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10">
                      <BarChart3 className="h-5 w-5 text-[#2063F0]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">Vue production</h4>
                      <p className="text-xs text-muted-foreground">Performances du mois</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-sm font-medium text-muted-foreground">Taux d'utilisation</span>
                      <span className="text-base font-bold text-foreground">92%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-sm font-medium text-muted-foreground">Ordres complétés</span>
                      <span className="text-base font-bold text-foreground">342</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-sm font-medium text-muted-foreground">Taux de rebut</span>
                      <span className="text-base font-bold text-foreground">1.8%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout for Onboarding and Academy - At the Bottom */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Onboarding Card - Enhanced - Left Side */}
                <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-[#31C7AD]/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#31C7AD] to-[#31C7AD]/80 shadow-lg">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Onboarding</h3>
                      <p className="text-sm text-muted-foreground mt-1">Configuration rapide de votre espace</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-[#31C7AD]/10 border-2 border-[#31C7AD]/20">
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          variant="default"
                          size="lg"
                          onClick={() => setSimpleOnboardingOpen(true)}
                        >
                          Configurer votre espace de travail
                        </Button>
                      </div>
                      
                      {/* Enhanced Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">Progression</span>
                          <span className="text-sm font-bold text-[#31C7AD]">{simpleOnboardingProgress.completed} / {simpleOnboardingProgress.total}</span>
                        </div>
                        <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2063F0] via-[#31C7AD] to-[#2063F0] transition-all duration-500 shadow-lg"
                            style={{ width: `${(simpleOnboardingProgress.completed / simpleOnboardingProgress.total) * 100}%` }}
                          />
                        </div>
                        {simpleOnboardingProgress.completed === simpleOnboardingProgress.total && (
                          <p className="text-xs text-[#31C7AD] font-medium text-center mt-2">
                            ✓ Configuration terminée
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Reset Data Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetClick}
                      className="w-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Réinitialiser les données
                    </Button>
                  </div>
                </div>

                {/* Académie Pelico Card - Enhanced - Right Side */}
                <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-[#2063F0]/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[#2063F0] to-[#2063F0]/80 shadow-lg">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">Académie Pelico</h3>
                        <p className="text-sm text-muted-foreground mt-1">Ressources et formations</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-sm h-auto font-medium hover:bg-[#2063F0]/10 hover:text-[#2063F0]">
                      Centre d'aide
                    </Button>
                  </div>
                  <div className="space-y-2.5">
                    {academyResources.map((resource) => {
                      const Icon = resource.icon;
                      return (
                        <button
                          key={resource.id}
                          onClick={resource.onClick}
                          className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-[#2063F0]/10 hover:to-[#31C7AD]/5 hover:border-[#2063F0]/30 transition-all text-left border-2 border-transparent hover:shadow-md group"
                        >
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0]/10 to-[#31C7AD]/10 group-hover:from-[#2063F0]/20 group-hover:to-[#31C7AD]/20 transition-all">
                            <Icon className="h-5 w-5 text-[#2063F0] group-hover:text-[#2063F0] shrink-0" />
                          </div>
                          <span className="text-base font-semibold flex-1 group-hover:text-[#2063F0] transition-colors">{resource.title}</span>
                          {resource.isNew && (
                            <Badge className="text-xs bg-gradient-to-r from-[#2063F0] to-[#31C7AD] text-white border-0 shadow-sm">
                              Nouveau
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Key Metrics Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* OTD Rate */}
                <div className="bg-gradient-to-br from-background to-[#31C7AD]/5 border-2 border-[#31C7AD]/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10">
                      <Clock className="h-5 w-5 text-[#31C7AD]" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cette semaine</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Taux de livraison OTD</p>
                    <p className="text-3xl font-bold text-foreground">87.3%</p>
                    <div className="flex items-center gap-1 text-xs text-[#31C7AD] font-medium">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>+2.4% vs semaine dernière</span>
                    </div>
                  </div>
                </div>

                {/* Late Orders */}
                <div className="bg-gradient-to-br from-background to-red-500/5 border-2 border-red-500/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-red-500/20 to-red-500/10">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aujourd'hui</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Commandes en retard</p>
                    <p className="text-3xl font-bold text-foreground">23</p>
                    <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>5 critiques</span>
                    </div>
                  </div>
                </div>

                {/* Active Teams */}
                <div className="bg-gradient-to-br from-background to-[#2063F0]/5 border-2 border-[#2063F0]/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10">
                      <Users className="h-5 w-5 text-[#2063F0]" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actif</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Équipes actives</p>
                    <p className="text-3xl font-bold text-foreground">12</p>
                    <div className="flex items-center gap-1 text-xs text-[#2063F0] font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>48 membres au total</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supply Chain Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Stock Alerts */}
                <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-border/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/10">
                      <Package className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">Alertes stock</h4>
                      <p className="text-xs text-muted-foreground">Surveillance en temps réel</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium">Ruptures de stock</span>
                      </div>
                      <span className="text-lg font-bold text-red-500">7</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-medium">Stock critique</span>
                      </div>
                      <span className="text-lg font-bold text-orange-500">15</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#31C7AD]/10 border border-[#31C7AD]/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#31C7AD]"></div>
                        <span className="text-sm font-medium">Stock optimal</span>
                      </div>
                      <span className="text-lg font-bold text-[#31C7AD]">156</span>
                    </div>
                  </div>
                </div>

                {/* Production Overview */}
                <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-border/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10">
                      <BarChart3 className="h-5 w-5 text-[#2063F0]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">Vue production</h4>
                      <p className="text-xs text-muted-foreground">Performances du mois</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-sm font-medium text-muted-foreground">Taux d'utilisation</span>
                      <span className="text-base font-bold text-foreground">92%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-sm font-medium text-muted-foreground">Ordres complétés</span>
                      <span className="text-base font-bold text-foreground">342</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-sm font-medium text-muted-foreground">Taux de rebut</span>
                      <span className="text-base font-bold text-foreground">1.8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Regular User Dashboard - Original Layout */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pelico Onboarding Card */}
              <div className="bg-background border border-border/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 border border-[#31C7AD]/20">
                    <CheckCircle2 className="h-5 w-5 text-[#31C7AD]" />
                  </div>
                  <h3 className="text-xl font-bold">Intégration Pelico</h3>
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
                      Réinitialiser les données
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
                    <h3 className="text-xl font-bold">Académie Pelico</h3>
                  </div>
                  <Button variant="ghost" size="sm" className="text-sm h-auto font-medium hover:bg-[#2063F0]/10 hover:text-[#2063F0]">
                    Centre d'aide
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
                            Nouveau
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Floating "Ask Pelicia" Button */}
          <Button
            onClick={() => console.log('Ask Pelicia clicked')}
            className="fixed bottom-8 right-8 h-14 px-6 rounded-full shadow-2xl bg-white text-[#2063F0] hover:bg-gradient-to-r hover:from-[#2063F0] hover:to-[#31C7AD] hover:text-white border-2 border-[#2063F0] hover:border-transparent transition-all duration-300 z-50 group"
          >
            <MessageCircle className="h-5 w-5 mr-2 group-hover:animate-pulse" />
            <span className="font-semibold">Ask Pelicia</span>
          </Button>

          {/* Simple Onboarding Section - Only for non-managers */}
          {!isManager && (
            <div className="mt-6">
              <div className="bg-background border border-border/60 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 border border-[#31C7AD]/20">
                    <CheckCircle2 className="h-5 w-5 text-[#31C7AD]" />
                  </div>
                  <h3 className="text-xl font-bold">Intégration simplifiée</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg transition-all border bg-muted/30 border-border/60 hover:bg-muted/50 hover:border-[#2063F0]/30 hover:shadow-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm h-auto py-1.5 px-3 text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/10 font-medium"
                      onClick={() => setSimpleOnboardingOpen(true)}
                    >
                      Configurer votre espace de travail
                    </Button>
                    
                    {/* Progress Bar */}
                    <div className="flex flex-col gap-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Progression</span>
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
                      Réinitialiser les données
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                {resetConfirmStep === 'first' ? 'Réinitialiser les données d\'intégration ?' : 'Êtes-vous absolument sûr ?'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              {resetConfirmStep === 'first' ? (
                <>
                  Cette action supprimera définitivement <strong>toutes les données créées lors de l'intégration</strong> :
                  <br /><br />
                  • Tous les périmètres<br />
                  • Toutes les équipes<br />
                  • Toutes les affectations d'équipes et de membres<br />
                  • Toute la progression d'intégration<br /><br />
                  <strong>Les routines et les comptes utilisateurs seront conservés, mais leurs affectations seront effacées.</strong>
                  <br /><br />
                  Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?
                </>
              ) : (
                <>
                  Ceci est votre confirmation finale. Cliquer sur "Confirmer la réinitialisation" va :
                  <br /><br />
                  • Supprimer tous les périmètres<br />
                  • Supprimer tous les dossiers de routines<br />
                  • Supprimer toutes les équipes<br />
                  • Effacer toutes les affectations de membres<br />
                  • Supprimer toutes les routines<br />
                  • Effacer toutes les affectations de périmètres<br />
                  • Réinitialiser toute la progression d'intégration<br /><br />
                  <strong>Les comptes utilisateurs seront conservés, mais toutes leurs affectations seront effacées.</strong>
                  <br /><br />
                  Vous resterez sur cette page après la réinitialisation.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="secondary"
              onClick={handleResetCancel}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetConfirm}
            >
              {resetConfirmStep === 'first' ? 'Continuer' : 'Confirmer la réinitialisation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scope Creation Modal */}
      <ScopeModal
        open={scopeModalOpen}
        onOpenChange={setScopeModalOpen}
        scope={editingScope}
        title={editingScope ? 'Modifier le périmètre' : 'Définir votre périmètre'}
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

