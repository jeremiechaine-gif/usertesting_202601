import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ScopeModal } from './ScopeModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanDropdown } from './PlanDropdown';
import { type Scope } from '@/lib/scopes';
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

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'erp' | 'prod' | null>('erp');
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const userName = 'Jérémie';

  // Mock onboarding tasks - in real app, these would come from API/state
  const [onboardingTasks] = useState<OnboardingTask[]>([
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
      onClick: () => onNavigate?.('scope-routines'),
    },
    {
      id: 'manage-team',
      label: 'Manage team',
      action: 'Manage team',
      completed: false,
      onClick: () => onNavigate?.('users'),
    },
  ]);

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

        {/* Main Header */}
        <div className="border-b bg-background">
          <div className="px-6 py-4">
            {/* Top Header Row */}
            <div className="flex items-center justify-between mb-4">
              {/* Left Side */}
              <div className="flex items-center gap-4">
                {sidebarCollapsed && (
                  <Button 
                    variant="ghost" 
                    className="h-8 px-3 gap-2"
                    onClick={() => setSidebarCollapsed(false)}
                  >
                    <Menu className="w-4 h-4" />
                    <span className="text-sm">Menu</span>
                  </Button>
                )}
                {/* Pelico small logo */}
                <img 
                  src="/images/Pelico-small-logo.svg" 
                  alt="Pelico" 
                  className="w-6 h-6 shrink-0"
                />
                <h1 className="text-2xl font-bold tracking-tight">Home</h1>
                <div className="h-6 w-px bg-border" />
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
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Save className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 ml-1" />
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
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <LinkIcon className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Copy Link</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-border" />

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bell className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1">Hello {userName},</h2>
            <p className="text-muted-foreground">Here's what we have for you today</p>
          </div>

          {/* Main Hero Card */}
          <div className="mb-6 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-semibold mb-2">Kick-start your supply chain optimization with Pelico</h3>
            <p className="text-muted-foreground mb-4 max-w-2xl">
              Optimize your supply chain operations with intelligent scopes, routines, and analytics. 
              Define scopes to filter your data, create routines to save your preferred views, and 
              manage your team to collaborate effectively on supply chain decisions.
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pelico Onboarding Card */}
            <div className="bg-background border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Pelico onboarding</h3>
              <div className="space-y-2">
                {onboardingTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md transition-colors",
                      task.completed 
                        ? "bg-green-50 dark:bg-green-950/20" 
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm",
                        task.completed && "text-muted-foreground line-through"
                      )}>
                        {task.label}
                      </span>
                    </div>
                    {!task.completed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm h-auto py-1 px-2 text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/10"
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
            <div className="bg-background border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pelico Academy</h3>
                <Button variant="ghost" size="sm" className="text-sm h-auto">
                  Help Center
                </Button>
              </div>
              <div className="space-y-3">
                {academyResources.map((resource) => {
                  const Icon = resource.icon;
                  return (
                    <button
                      key={resource.id}
                      onClick={resource.onClick}
                      className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-left"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1">{resource.title}</span>
                      {resource.isNew && (
                        <Badge variant="secondary" className="text-xs">
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
    </div>
  );
};

