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
import { getCurrentUserId, getCurrentUser, getUser } from '@/lib/users';
import { getTeam, getTeams, type Team } from '@/lib/teams';
import { useScope } from '@/contexts/ScopeContext';
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
  Link as LinkIcon,
  CheckCircle2,
  Sparkles,
  Zap
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

export const ScopeAndRoutinesPage: React.FC<{ 
  onNavigate?: (page: string) => void;
  viewMode?: 'scope-routines' | 'my-routines' | 'shared-routines';
}> = ({ onNavigate, viewMode = 'scope-routines' }) => {
  const { refreshScopes, currentScopeId, setCurrentScopeId } = useScope();
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [viewSelectionModalOpen, setViewSelectionModalOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [shareType, setShareType] = useState<'scope' | 'routine'>('scope');
  const [shareItemName, setShareItemName] = useState<string>('');

  useEffect(() => {
    loadScopes();
    loadRoutines();
  }, [viewMode]);

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

  const handleCreateRoutine = () => {
    setEditingRoutine(null);
    setViewSelectionModalOpen(true);
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

  const handleDuplicateRoutine = (routine: Routine) => {
    const currentUserId = getCurrentUserId();
    duplicateRoutine(routine.id, currentUserId);
    loadRoutines();
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
        />
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {viewMode === 'my-routines' ? 'My Routines' : 
                   viewMode === 'shared-routines' ? 'Shared Routines' : 
                   'Scope & Routines'}
                </h1>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3">
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
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6">
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
                  onClick={handleCreateScope}
                  className="gap-2 h-9 bg-gradient-to-r from-[#31C7AD] to-[#2063F0] hover:from-[#2ab89a] hover:to-[#1a54d8] text-white shadow-md"
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
                  <p className="text-sm text-muted-foreground mb-5 max-w-sm text-center">
                    Create your first scope to filter data across the application
                  </p>
                  <Button
                    onClick={handleCreateScope}
                    className="gap-2 h-9 bg-gradient-to-r from-[#31C7AD] to-[#2063F0] hover:from-[#2ab89a] hover:to-[#1a54d8] text-white shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Create Scope
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {scopes.map((scope) => (
                    <div
                      key={scope.id}
                      className={cn(
                        'group border border-border/60 rounded-xl p-5 hover:shadow-lg transition-all bg-background hover:border-[#31C7AD]/30',
                        currentScopeId === scope.id && 'ring-2 ring-[#31C7AD] shadow-md bg-[#31C7AD]/5'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg truncate">{scope.name}</h3>
                            {scope.isDefault && (
                              <Star className="h-4 w-4 text-[#31C7AD] fill-[#31C7AD] shrink-0" />
                            )}
                            {currentScopeId === scope.id && (
                              <Badge className="text-xs shrink-0 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/20">
                                Active
                              </Badge>
                            )}
                          </div>
                          {scope.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                              {scope.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <Badge variant="outline" className="text-xs bg-background/50 border-[#31C7AD]/30 text-[#31C7AD]">
                          {scope.filters.length} filter{scope.filters.length !== 1 ? 's' : ''}
                        </Badge>
                        {scope.isGlobal && (
                          <Badge variant="secondary" className="text-xs bg-muted/50">
                            Global
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD]"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleShareScope(scope)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
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
                            className="h-8 w-8 hover:bg-[#31C7AD]/10 hover:text-[#31C7AD]"
                            onClick={() => handleEditScope(scope)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteScope(scope.id)}
                            disabled={scope.isDefault}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <Separator orientation="vertical" className="hidden lg:block h-auto" />

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
                <Button
                  onClick={handleCreateRoutine}
                  className="gap-2 h-9 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Create Routine
                </Button>
              </div>

              {routines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border/60 bg-gradient-to-br from-[#2063F0]/5 to-transparent">
                  <div className="p-4 rounded-full bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10 mb-4">
                    <Zap className="h-8 w-8 text-[#2063F0]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No routines yet</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-sm text-center">
                    Create your first routine to save view configurations
                  </p>
                  <Button
                    onClick={handleCreateRoutine}
                    className="gap-2 h-9 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Create Routine
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {routines.map((routine) => {
                    const creator = getUser(routine.createdBy);
                    const currentUserId = getCurrentUserId();
                    const isOwner = routine.createdBy === currentUserId;
                    const canEdit = isOwner; // Only owner can edit
                    
                    // Find teams that share this routine (via teamIds or legacy teamId or assignedRoutineIds)
                    const allTeams = getTeams();
                    const sharedTeamIds = routine.teamIds || (routine.teamId ? [routine.teamId] : []);
                    const sharedTeams = sharedTeamIds
                      .map(teamId => getTeam(teamId))
                      .filter(Boolean);
                    
                    // Also check if routine is assigned to any team via assignedRoutineIds
                    const assignedTeams = allTeams.filter(team => 
                      team.assignedRoutineIds?.includes(routine.id)
                    );
                    
                    // Combine and deduplicate teams
                    const allSharedTeams = [...sharedTeams, ...assignedTeams]
                      .filter((team, index, self) => 
                        team && index === self.findIndex(t => t && t.id === team.id)
                      )
                      .filter((team): team is Team => team !== null);
                    
                    return (
                    <div
                      key={routine.id}
                      className="group border border-border/60 rounded-xl p-5 hover:shadow-lg transition-all bg-background hover:border-[#2063F0]/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate">{routine.name}</h3>
                          {routine.description && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                              {routine.description}
                            </p>
                          )}
                          {creator && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Created by <span className="font-medium">{creator.name}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <Badge variant="outline" className="text-xs bg-background/50 border-[#2063F0]/30 text-[#2063F0]">
                          {routine.filters.length} filter{routine.filters.length !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-background/50 border-[#2063F0]/30 text-[#2063F0]">
                          {routine.sorting.length} sort{routine.sorting.length !== 1 ? 's' : ''}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs bg-background/50',
                            routine.scopeMode === 'scope-aware' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300',
                            routine.scopeMode === 'scope-fixed' && 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300'
                          )}
                        >
                          {routine.scopeMode === 'scope-aware' ? 'Scope-aware' : 'Scope-fixed'}
                        </Badge>
                        {allSharedTeams.map((team) => (
                          <Badge key={team.id} className="text-xs bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/20">
                            {team.name}
                          </Badge>
                        ))}
                        
                        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-[#2063F0]/10 hover:text-[#2063F0]"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleShareRoutine(routine)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
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
                                className="h-8 w-8 hover:bg-[#2063F0]/10 hover:text-[#2063F0]"
                                onClick={() => handleEditRoutine(routine)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteRoutine(routine.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
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
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
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
              variant="outline"
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
            loadRoutines();
            setRoutineModalOpen(false);
            setEditingRoutine(null);
          }}
          currentFilters={[]}
          currentSorting={[]}
          currentGroupBy={null}
          currentPageSize={100}
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
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
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
                variant="outline"
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
              variant="outline"
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
    </div>
  );
};
