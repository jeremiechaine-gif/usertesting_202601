/**
 * Scope & Routines Management Page
 * Allows users to manage scopes and routines (CRUD operations + sharing)
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScopeModal } from './ScopeModal';
import { RoutineModal } from './RoutineModal';
import { Sidebar } from './Sidebar';
import { 
  getScopes, 
  deleteScope, 
  shareScope, 
  duplicateScope,
  setDefaultScope,
  getUsersAssignedToScope,
  type Scope 
} from '@/lib/scopes';
import { 
  getRoutines, 
  deleteRoutine, 
  shareRoutine, 
  duplicateRoutine,
  getRoutinesByCreator,
  getAccessibleRoutines,
  type Routine 
} from '@/lib/routines';
import { getCurrentUserId, getCurrentUser, getUser, getUsers, updateUser, type User } from '@/lib/users';
import { getTeam, getTeams, type Team } from '@/lib/teams';
import { updateRoutine } from '@/lib/routines';
import { useScope } from '@/contexts/ScopeContext';
import { useRoutine } from '@/contexts/RoutineContext';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type { Objective } from '@/lib/onboarding/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Settings, 
  Share2, 
  Copy,
  Menu,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Zap,
  Eye,
  Users,
  ArrowRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CreateRoutineFullPageWizard } from './CreateRoutineFullPageWizard';

export const ScopeAndRoutinesPage: React.FC<{ 
  onNavigate?: (page: string) => void;
  viewMode?: 'scope-routines' | 'my-routines' | 'shared-routines';
  onLogout?: () => void;
}> = ({ onNavigate, viewMode = 'scope-routines', onLogout }) => {
  const { refreshScopes, currentScopeId, setCurrentScopeId } = useScope();
  const { refreshRoutines, refreshKey } = useRoutine();
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [viewSelectionModalOpen, setViewSelectionModalOpen] = useState(false);
  const [createRoutineWizardOpen, setCreateRoutineWizardOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [shareType, setShareType] = useState<'scope' | 'routine'>('scope');
  const [shareItemName, setShareItemName] = useState<string>('');
  const [reassignScopeDialogOpen, setReassignScopeDialogOpen] = useState(false);
  const [scopeToReassign, setScopeToReassign] = useState<Scope | null>(null);
  const [selectedSourceUser, setSelectedSourceUser] = useState<string | null>(null);
  const [selectedTargetUser, setSelectedTargetUser] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [routineSharePopoverOpen, setRoutineSharePopoverOpen] = useState<string | null>(null);

  useEffect(() => {
    loadScopes();
    loadRoutines();
    loadTeams();
  }, [viewMode, refreshKey]); // Reload when routines change

  const loadTeams = () => {
    setTeams(getTeams());
  };

  const loadScopes = () => {
    setScopes(getScopes());
    refreshScopes();
  };

  const loadRoutines = () => {
    const currentUserId = getCurrentUserId();
    const currentUser = getCurrentUser();
    
    if (viewMode === 'my-routines') {
      setRoutines(getRoutinesByCreator(currentUserId));
    } else if (viewMode === 'shared-routines') {
      setRoutines(getAccessibleRoutines(currentUserId, currentUser?.teamId || null).filter(r => r.createdBy !== currentUserId));
    } else {
      setRoutines(getRoutines());
    }
  };

  // Get objectives for a routine (from library or empty array)
  const getRoutineObjectives = (routine: Routine): Objective[] => {
    // Try to find routine in library by ID first
    const libraryRoutine = ROUTINE_LIBRARY.find(r => r.id === routine.id);
    if (libraryRoutine) {
      return libraryRoutine.objectives;
    }
    
    // Try to find by name (label)
    const libraryRoutineByName = ROUTINE_LIBRARY.find(r => r.label === routine.name);
    if (libraryRoutineByName) {
      return libraryRoutineByName.objectives;
    }
    
    // User-created routines don't have objectives
    return [];
  };

  // Group routines by objectives
  const getRoutinesGroupedByObjectives = (routinesList: Routine[]): Record<string, Routine[]> => {
    const grouped: Record<string, Routine[]> = {};
    
    routinesList.forEach(routine => {
      const objectives = getRoutineObjectives(routine);
      const primaryObjective = objectives.length > 0 ? objectives[0] : 'Other';
      
      if (!grouped[primaryObjective]) {
        grouped[primaryObjective] = [];
      }
      grouped[primaryObjective].push(routine);
    });
    
    // Sort routines within each group alphabetically by name
    Object.keys(grouped).forEach(objective => {
      grouped[objective].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  };

  // Define objective display order (for consistent ordering)
  const OBJECTIVE_ORDER: Record<string, number> = {
    'Anticipate': 1,
    'Monitor': 2,
    'Correct': 3,
    'Prioritize': 4,
    'Report': 5,
    'Other': 6,
  };

  const handleCreateScope = () => {
    setEditingScope(null);
    setScopeModalOpen(true);
  };

  const handleEditScope = (scope: Scope) => {
    setEditingScope(scope);
    setScopeModalOpen(true);
  };

  const handleDeleteScope = (scopeId: string) => {
    if (confirm('Are you sure you want to delete this scope?')) {
      deleteScope(scopeId);
      loadScopes();
      // If deleted scope was current, reset to default
      if (currentScopeId === scopeId) {
        const defaultScope = scopes.find(s => s.id !== scopeId && s.isDefault);
        if (defaultScope) {
          setCurrentScopeId(defaultScope.id);
        } else {
          const remainingScopes = scopes.filter(s => s.id !== scopeId);
          if (remainingScopes.length > 0) {
            setCurrentScopeId(remainingScopes[0].id);
          } else {
            setCurrentScopeId(null);
          }
        }
      }
    }
  };

  const handleShareScope = (scope: Scope) => {
    const link = shareScope(scope.id);
    if (link) {
      setShareLink(link);
      setShareType('scope');
      setShareItemName(scope.name);
      setShareDialogOpen(true);
    }
  };

  const handleDuplicateScope = (scope: Scope) => {
    duplicateScope(scope.id);
    loadScopes();
  };

  const handleSetDefaultScope = (scopeId: string) => {
    setDefaultScope(scopeId);
    loadScopes();
  };

  const handleReassignScope = () => {
    if (!scopeToReassign || !selectedSourceUser || !selectedTargetUser) return;
    
    const sourceUser = getUser(selectedSourceUser);
    const targetUser = getUser(selectedTargetUser);
    
    if (!sourceUser || !targetUser) return;
    
    // Remove scope from source user
    const sourceScopeIds = sourceUser.assignedScopeIds || [];
    const updatedSourceScopeIds = sourceScopeIds.filter(id => id !== scopeToReassign.id);
    updateUser(selectedSourceUser, { 
      assignedScopeIds: updatedSourceScopeIds,
      defaultScopeId: sourceUser.defaultScopeId === scopeToReassign.id ? null : sourceUser.defaultScopeId
    });
    
    // Add scope to target user
    const targetScopeIds = targetUser.assignedScopeIds || [];
    if (!targetScopeIds.includes(scopeToReassign.id)) {
      updateUser(selectedTargetUser, { 
        assignedScopeIds: [...targetScopeIds, scopeToReassign.id]
      });
    }
    
    // Reload data
    loadScopes();
    setReassignScopeDialogOpen(false);
    setScopeToReassign(null);
    setSelectedSourceUser(null);
    setSelectedTargetUser(null);
  };

  const handleCreateRoutine = () => {
    setEditingRoutine(null);
    setCreateRoutineWizardOpen(true);
  };

  const handleRoutineCreated = (routineId: string) => {
    loadRoutines();
    refreshRoutines();
    setCreateRoutineWizardOpen(false);
  };

  const handleSelectView = (view: string) => {
    setViewSelectionModalOpen(false);
    if (view === 'supply') {
      onNavigate?.('supply');
    }
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setRoutineModalOpen(true);
  };

  const handleDeleteRoutine = (routineId: string) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      deleteRoutine(routineId);
      refreshRoutines(); // Notify all components that routines have changed
      loadRoutines();
    }
  };

  const handleShareRoutine = (routine: Routine) => {
    const link = shareRoutine(routine.id);
    if (link) {
      setShareLink(link);
      setShareType('routine');
      setShareItemName(routine.name);
      setShareDialogOpen(true);
    }
  };

  const handleToggleRoutineShare = (routineId: string, teamId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    const currentTeamIds = routine.teamIds || [];
    const isShared = currentTeamIds.includes(teamId);
    
    const newTeamIds = isShared
      ? currentTeamIds.filter(id => id !== teamId)
      : [...currentTeamIds, teamId];

    updateRoutine(routineId, { teamIds: newTeamIds });
    loadRoutines();
    refreshRoutines();
  };

  const handleDuplicateRoutine = (routine: Routine) => {
    const currentUserId = getCurrentUserId();
    duplicateRoutine(routine.id, currentUserId);
    refreshRoutines(); // Notify all components that routines have changed
    loadRoutines();
  };

  const handleViewRoutine = (routine: Routine) => {
    // Navigate to the Pelico view page associated with this routine
    if (!routine.pelicoView) {
      // Error: routine should always have a pelicoView
      alert(`Error: Routine "${routine.name}" does not have a Pelico View associated. Please edit the routine to assign a view.`);
      return;
    }
    
    // Store routine ID in sessionStorage to auto-apply it when page loads
    sessionStorage.setItem('pendingRoutineId', routine.id);
    
    // Navigate to the Pelico View page
    const pelicoViewPage = routine.pelicoView;
    onNavigate?.(pelicoViewPage);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    // You could add a toast notification here
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {!sidebarCollapsed && (
        <Sidebar 
          activeItem={viewMode} 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(true)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Main Header with Gradient */}
        <div className="relative bg-background">
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
                <h1 className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {viewMode === 'my-routines' ? 'My Routines' : 
                   viewMode === 'shared-routines' ? 'Shared Routines' : 
                   'Scope & Routines'}
                </h1>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3">
                {/* Empty - removed Save and Link dropdowns */}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col gap-6">
            {/* Routines Section */}
            <div className="flex flex-col min-w-0">
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 border border-[#2063F0]/20">
                    <Zap className="h-5 w-5 text-[#2063F0]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Routines</h2>
                    <p className="text-xs text-muted-foreground">Standard ways of working</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  A <em>generic</em> view (filters + display configuration) that standardizes a way of working, and can be shared and used by a team.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="accent"
                    onClick={handleCreateRoutine}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Routine
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => onNavigate?.('routines-library')}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    See all generic routines
                  </Button>
                </div>
              </div>

              {routines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border/60 bg-gradient-to-br from-[#2063F0]/5 to-transparent">
                  <div className="p-4 rounded-full bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 mb-4">
                    <Zap className="h-8 w-8 text-[#2063F0]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No routines yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm text-center">
                    Use the button above to create your first routine and save view configurations
                  </p>
                </div>
              ) : (
                (() => {
                  const routinesGrouped = getRoutinesGroupedByObjectives(routines);
                  const sortedObjectives = Object.keys(routinesGrouped).sort((a, b) => {
                    const orderA = OBJECTIVE_ORDER[a] || 999;
                    const orderB = OBJECTIVE_ORDER[b] || 999;
                    return orderA - orderB;
                  });
                  
                  return (
                    <div className="space-y-6">
                      {sortedObjectives.map((objective) => {
                        const objectiveRoutines = routinesGrouped[objective];
                        return (
                          <div key={objective} className="space-y-3">
                            {/* Objective Section Title */}
                            <h4 className="text-sm font-semibold text-foreground/90 tracking-tight">
                              {objective}
                            </h4>
                            {/* Routines for this objective */}
                            <div className="space-y-2 pl-2 border-l-2 border-border/50">
                              {objectiveRoutines.map((routine) => {
                                const creator = getUser(routine.createdBy);
                                const currentUserId = getCurrentUserId();
                                const isOwner = routine.createdBy === currentUserId;
                                const canEdit = isOwner; // Only owner can edit
                                
                                // Map pelicoView to display name
                                const getPelicoViewDisplayName = (view?: string): string => {
                                  const viewMap: Record<string, string> = {
                                    'supply': 'PO Book',
                                    'production': 'WO Book',
                                    'customer': 'CO Book',
                                    'escalation': 'Escalation Room',
                                    'value-engineering': 'Value Engineering',
                                    'event-explorer': 'Events Explorer',
                                    'simulation': 'Planning',
                                  };
                                  return view ? (viewMap[view] || view) : '';
                                };

                                // Check if routine is suggested (exists in library with personas)
                                const libraryRoutine = ROUTINE_LIBRARY.find(r => r.id === routine.id || r.label === routine.name);
                                const isSuggested = libraryRoutine && libraryRoutine.personas && libraryRoutine.personas.length > 0;
                                
                                const routineTeamIds = routine.teamIds || [];
                                const isShared = routineTeamIds.length > 0;
                                const sharedTeams = teams.filter(team => routineTeamIds.includes(team.id));
                                
                                return (
                                  <div
                                    key={routine.id}
                                    className="group relative flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20 hover:border-[#31C7AD]/40 transition-all cursor-pointer"
                                    onClick={() => handleViewRoutine(routine)}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-foreground">
                                          {routine.name}
                                        </span>
                                        {isSuggested && (
                                          <Badge variant="secondary" className="text-xs h-4 px-1.5 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30 flex items-center gap-1">
                                            <Sparkles className="h-2.5 w-2.5" />
                                            Suggested
                                          </Badge>
                                        )}
                                      </div>
                                      {routine.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                                          {routine.description}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-1 items-center mb-2">
                                        {routine.pelicoView && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs h-4 px-1.5 bg-pink-500/10 text-pink-600 border-pink-500/30"
                                          >
                                            {getPelicoViewDisplayName(routine.pelicoView)}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Sharing Section */}
                                      {isOwner && (
                                        <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-border/30">
                                          {isShared ? (
                                            <>
                                              <span className="text-xs text-muted-foreground">Shared with:</span>
                                              {sharedTeams.map((team) => (
                                                <Badge
                                                  key={team.id}
                                                  variant="secondary"
                                                  className="text-xs h-4 px-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1 group/badge"
                                                >
                                                  <Users className="h-3 w-3" />
                                                  {team.name}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleToggleRoutineShare(routine.id, team.id);
                                                    }}
                                                    className="ml-1 opacity-0 group-hover/badge:opacity-100 transition-opacity hover:text-destructive"
                                                    title="Remove sharing"
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </button>
                                                </Badge>
                                              ))}
                                              <Popover
                                                open={routineSharePopoverOpen === routine.id}
                                                onOpenChange={(open) => setRoutineSharePopoverOpen(open ? routine.id : null)}
                                              >
                                                <PopoverTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 px-1.5 text-xs gap-1"
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                    Add
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 p-2" align="start">
                                                  <div className="space-y-1">
                                                    {teams.filter(team => !routineTeamIds.includes(team.id)).map((team) => (
                                                      <button
                                                        key={team.id}
                                                        onClick={() => {
                                                          handleToggleRoutineShare(routine.id, team.id);
                                                          setRoutineSharePopoverOpen(null);
                                                        }}
                                                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted text-sm transition-colors flex items-center gap-2"
                                                      >
                                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{team.name}</span>
                                                      </button>
                                                    ))}
                                                    {teams.filter(team => !routineTeamIds.includes(team.id)).length === 0 && (
                                                      <p className="text-xs text-muted-foreground px-2 py-1.5">
                                                        All teams already have access
                                                      </p>
                                                    )}
                                                  </div>
                                                </PopoverContent>
                                              </Popover>
                                            </>
                                          ) : (
                                            <Popover
                                              open={routineSharePopoverOpen === routine.id}
                                              onOpenChange={(open) => setRoutineSharePopoverOpen(open ? routine.id : null)}
                                            >
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant="secondary"
                                                  size="sm"
                                                  className="h-5 px-2 text-xs gap-1"
                                                >
                                                  <Share2 className="h-3 w-3" />
                                                  Share
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-64 p-2" align="start">
                                                <div className="space-y-1">
                                                  {teams.map((team) => (
                                                    <button
                                                      key={team.id}
                                                      onClick={() => {
                                                        handleToggleRoutineShare(routine.id, team.id);
                                                        setRoutineSharePopoverOpen(null);
                                                      }}
                                                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted text-sm transition-colors flex items-center gap-2"
                                                    >
                                                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                      <span>{team.name}</span>
                                                    </button>
                                                  ))}
                                                  {teams.length === 0 && (
                                                    <p className="text-xs text-muted-foreground px-2 py-1.5">
                                                      No teams available
                                                    </p>
                                                  )}
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          )}
                                        </div>
                                      )}
                                      {!isOwner && isShared && (
                                        <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-border/30">
                                          <span className="text-xs text-muted-foreground">Shared with:</span>
                                          {sharedTeams.map((team) => (
                                            <Badge
                                              key={team.id}
                                              variant="secondary"
                                              className="text-xs h-4 px-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1"
                                            >
                                              <Users className="h-3 w-3" />
                                              {team.name}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:bg-[#2063F0]/10 hover:text-[#2063F0]"
                                          >
                                            <Share2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleViewRoutine(routine)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            View
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleShareRoutine(routine)}>
                                            <Share2 className="h-4 w-4 mr-2" />
                                            Share link
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleDuplicateRoutine(routine)}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Duplicate
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      
                                      {canEdit && (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:bg-[#2063F0]/10 hover:text-[#2063F0]"
                                            onClick={() => handleEditRoutine(routine)}
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </Button>
                                          <button
                                            onClick={() => handleDeleteRoutine(routine.id)}
                                            className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                            title="Remove routine"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Separator */}
            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Scopes Section */}
            <div className="flex flex-col min-w-0">
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 border border-[#31C7AD]/20">
                    <Settings className="h-5 w-5 text-[#31C7AD]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Scopes</h2>
                    <p className="text-xs text-muted-foreground">Personal data perimeter</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Your <em>personal</em> data perimeter (e.g., plants, cells, codes) applied by default to see what is relevant to you.
                </p>
                <Button
                  variant="accent"
                  onClick={handleCreateScope}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Scope
                </Button>
              </div>

              {scopes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border/60 bg-gradient-to-br from-[#31C7AD]/5 to-transparent">
                  <div className="p-4 rounded-full bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 mb-4">
                    <Settings className="h-8 w-8 text-[#31C7AD]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No scopes yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm text-center">
                    Use the button above to create your first scope and filter data across the application
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scopes.map((scope) => {
                    const assignedUsers = getUsersAssignedToScope(scope.id);
                    return (
                      <div
                        key={scope.id}
                        className="group relative flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20 hover:border-[#31C7AD]/40 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">
                              {scope.name}
                            </span>
                            {scope.isDefault && (
                              <Badge variant="secondary" className="text-xs h-4 px-1.5 bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/30 flex items-center gap-1">
                                <Star className="h-2.5 w-2.5 fill-[#2063F0]" />
                                Default
                              </Badge>
                            )}
                            {currentScopeId === scope.id && (
                              <Badge variant="secondary" className="text-xs h-4 px-1.5 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30">
                                Active
                              </Badge>
                            )}
                            {scope.isGlobal && (
                              <Badge variant="secondary" className="text-xs h-4 px-1.5 bg-muted/50 border-border/60">
                                Global
                              </Badge>
                            )}
                          </div>
                          {scope.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                              {scope.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 items-center mb-2">
                            <Badge
                              variant="secondary"
                              className="text-xs h-4 px-1.5 bg-pink-500/10 text-pink-600 border-pink-500/30"
                            >
                              {scope.filters.length} filter{scope.filters.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          
                          {/* Assigned Users Section */}
                          {assignedUsers.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-border/30">
                              <span className="text-xs text-muted-foreground">Assigned to:</span>
                              {assignedUsers.map(({ user, assignmentType, teamName }) => (
                                <Badge
                                  key={user.id}
                                  variant="secondary"
                                  className="text-xs h-4 px-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1"
                                  title={assignmentType === 'via-team' ? `Via team: ${teamName}` : 'Direct assignment'}
                                >
                                  <Users className="h-3 w-3" />
                                  {user.name}
                                  {assignmentType === 'via-team' && (
                                    <span className="ml-1 text-[10px] opacity-70">({teamName})</span>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-[#2063F0]/10 hover:text-[#2063F0]"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setScopeToReassign(scope);
                                setReassignScopeDialogOpen(true);
                              }}>
                                <Users className="h-4 w-4 mr-2" />
                                Reassign to User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareScope(scope)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateScope(scope)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              {!scope.isDefault && (
                                <DropdownMenuItem onClick={() => handleSetDefaultScope(scope.id)}>
                                  <Star className="h-4 w-4 mr-2" />
                                  Set as Default
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-[#2063F0]/10 hover:text-[#2063F0]"
                            onClick={() => handleEditScope(scope)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <button
                            onClick={() => handleDeleteScope(scope.id)}
                            className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove scope"
                            disabled={scope.isDefault}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Selection Modal */}
      <Dialog open={viewSelectionModalOpen} onOpenChange={setViewSelectionModalOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {/* Hero Header */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
            <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Create a new routine
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose a view to configure your routine settings
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 py-6">
            <button
              onClick={() => handleSelectView('supply')}
              className="w-full group relative rounded-xl border-2 border-border/60 hover:border-[#31C7AD] bg-background p-6 transition-all hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 group-hover:from-[#31C7AD]/30 group-hover:to-[#31C7AD]/20 transition-colors shrink-0 shadow-sm">
                  <Settings className="h-6 w-6 text-[#31C7AD]" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-[#31C7AD] transition-colors">Supply</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure filters, sorting, and display options for your supply chain data
                  </p>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90 group-hover:text-[#31C7AD] transition-colors shrink-0" />
              </div>
            </button>
          </div>

          <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20">
            <Button
              variant="secondary"
              onClick={() => setViewSelectionModalOpen(false)}
              className="border-border/60 hover:bg-muted"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scope Modal */}
      {scopeModalOpen && (
        <ScopeModal
          open={scopeModalOpen}
          onOpenChange={setScopeModalOpen}
          scope={editingScope}
          title={editingScope ? 'Edit Scope' : 'Create New Scope'}
          onSave={() => {
            loadScopes();
            setScopeModalOpen(false);
            setEditingScope(null);
          }}
        />
      )}

      {/* Routine Modal */}
      {routineModalOpen && (
        <RoutineModal
          open={routineModalOpen}
          onOpenChange={setRoutineModalOpen}
          routine={editingRoutine}
          onSave={() => {
            refreshRoutines(); // Notify all components that routines have changed
            loadRoutines();
            setRoutineModalOpen(false);
            setEditingRoutine(null);
          }}
          currentFilters={[]}
          currentSorting={[]}
          currentGroupBy={null}
          currentPageSize={100}
          onNavigate={onNavigate}
        />
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          {/* Hero Header */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
            <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Share {shareType === 'scope' ? 'Scope' : 'Routine'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                Share "{shareItemName}" with others by copying the link below
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 py-6 space-y-3">
            <Label htmlFor="share-link" className="text-sm font-semibold">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareLink}
                readOnly
                className="flex-1 font-mono text-sm h-10 border-border/60 bg-muted/30"
              />
              <Button
                variant="secondary"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0 h-10 w-10 border-border/60 hover:bg-[#31C7AD]/10 hover:border-[#31C7AD] hover:text-[#31C7AD]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2">
            <Button
              variant="secondary"
              onClick={() => setShareDialogOpen(false)}
              className="border-border/60 hover:bg-muted"
            >
              Close
            </Button>
            <Button
              onClick={copyToClipboard}
              className="gap-2 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" />
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Scope Dialog */}
      <Dialog open={reassignScopeDialogOpen} onOpenChange={setReassignScopeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Reassign Scope
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Transfer scope "{scopeToReassign?.name}" from one user to another
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source-user" className="text-sm font-semibold">From User</Label>
              <Select value={selectedSourceUser || ''} onValueChange={setSelectedSourceUser}>
                <SelectTrigger id="source-user">
                  <SelectValue placeholder="Select source user..." />
                </SelectTrigger>
                <SelectContent>
                  {scopeToReassign && getUsersAssignedToScope(scopeToReassign.id)
                    .filter(({ assignmentType }) => assignmentType === 'direct')
                    .map(({ user }) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center py-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-user" className="text-sm font-semibold">To User</Label>
              <Select value={selectedTargetUser || ''} onValueChange={setSelectedTargetUser}>
                <SelectTrigger id="target-user">
                  <SelectValue placeholder="Select target user..." />
                </SelectTrigger>
                <SelectContent>
                  {getUsers()
                    .filter(user => {
                      // Don't show source user in target list
                      if (selectedSourceUser && user.id === selectedSourceUser) return false;
                      // Don't show users who already have this scope directly assigned
                      if (scopeToReassign && user.assignedScopeIds?.includes(scopeToReassign.id)) return false;
                      return true;
                    })
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setReassignScopeDialogOpen(false);
                setScopeToReassign(null);
                setSelectedSourceUser(null);
                setSelectedTargetUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignScope}
              disabled={!selectedSourceUser || !selectedTargetUser}
              className="bg-gradient-to-r from-[#31C7AD] to-[#2063F0] hover:from-[#2ab89a] hover:to-[#1a54d8] text-white"
            >
              Reassign Scope
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Routine Full Page Wizard */}
      {createRoutineWizardOpen && (
        <CreateRoutineFullPageWizard
          onClose={() => setCreateRoutineWizardOpen(false)}
          onRoutineCreated={handleRoutineCreated}
        />
      )}
    </div>
  );
};
