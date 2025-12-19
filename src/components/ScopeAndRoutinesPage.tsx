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
import { getTeam, getTeams } from '@/lib/teams';
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
  CheckCircle2
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
    setRoutineModalOpen(true);
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
                <h1 className="text-2xl font-bold tracking-tight">
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
                <h2 className="text-lg font-semibold mb-2">Scopes</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Your <em>personal</em> data perimeter (e.g., plants, cells, codes) applied by default to see what is relevant to you.
                </p>
                <Button onClick={handleCreateScope} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Scope
                </Button>
              </div>

              {scopes.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No scopes yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first scope to filter data across the application
                  </p>
                  <Button onClick={handleCreateScope} className="gap-2">
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
                        'border rounded-lg p-4 hover:shadow-md transition-shadow bg-background',
                        currentScopeId === scope.id && 'ring-2 ring-[#2063F0]'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{scope.name}</h3>
                            {scope.isDefault && (
                              <Star className="h-4 w-4 text-[#2063F0] fill-[#2063F0] shrink-0" />
                            )}
                            {currentScopeId === scope.id && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Active
                              </Badge>
                            )}
                          </div>
                          {scope.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {scope.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {scope.filters.length} filter{scope.filters.length !== 1 ? 's' : ''}
                        </Badge>
                        {scope.isGlobal && (
                          <Badge variant="secondary" className="text-xs">
                            Global
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-1 ml-auto">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Share2 className="h-3 w-3" />
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
                            className="h-8 w-8"
                            onClick={() => handleEditScope(scope)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteScope(scope.id)}
                            disabled={scope.isDefault}
                          >
                            <Trash2 className="h-3 w-3" />
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
                <h2 className="text-lg font-semibold mb-2">Routines</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  A <em>generic</em> view (filters + display configuration) that standardizes a way of working, and can be shared and used by a team.
                </p>
                <Button onClick={handleCreateRoutine} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Routine
                </Button>
              </div>

              {routines.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No routines yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first routine to save view configurations
                  </p>
                  <Button onClick={handleCreateRoutine} className="gap-2">
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
                    
                    // Find team that shares this routine (via teamId or assignedRoutineIds)
                    let sharedTeam = routine.teamId ? getTeam(routine.teamId) : null;
                    if (!sharedTeam) {
                      // Check if routine is assigned to any team via assignedRoutineIds
                      const allTeams = getTeams();
                      sharedTeam = allTeams.find(team => 
                        team.assignedRoutineIds?.includes(routine.id)
                      ) || null;
                    }
                    
                    return (
                    <div
                      key={routine.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-background"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{routine.name}</h3>
                          {routine.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {routine.description}
                            </p>
                          )}
                          {creator && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Created by {creator.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          {routine.filters.length} filter{routine.filters.length !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {routine.sorting.length} sort{routine.sorting.length !== 1 ? 's' : ''}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            routine.scopeMode === 'scope-aware' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300',
                            routine.scopeMode === 'scope-fixed' && 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300'
                          )}
                        >
                          {routine.scopeMode === 'scope-aware' ? 'Scope-aware' : 'Scope-fixed'}
                        </Badge>
                        {sharedTeam && (
                          <Badge variant="secondary" className="text-xs">
                            {sharedTeam.name}
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-1 ml-auto">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Share2 className="h-3 w-3" />
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
                                className="h-8 w-8"
                                onClick={() => handleEditRoutine(routine)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteRoutine(routine.id)}
                              >
                                <Trash2 className="h-3 w-3" />
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {shareType === 'scope' ? 'Scope' : 'Routine'}</DialogTitle>
            <DialogDescription>
              Share "{shareItemName}" with others by copying the link below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="share-link">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareLink}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={copyToClipboard} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
