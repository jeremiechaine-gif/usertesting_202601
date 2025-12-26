/**
 * Step 4: Create and Apply Scopes
 * Assign scopes to each team member individually
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Target, CheckCircle2, X, Search, Plus, Star, Edit2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleTeamConfig } from './SimpleOnboardingWizard';
import { getAvailableScopes } from '@/lib/onboarding/teamWizardUtils';
import { getUsers, updateUser, type User } from '@/lib/users';
import { getScopes, type Scope } from '@/lib/scopes';
import { ScopeModal } from '../ScopeModal';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface ScopeAssignmentStepProps {
  teams: SimpleTeamConfig[];
  onTeamsUpdate: (teams: SimpleTeamConfig[]) => void;
  onNext: () => void;
  onBack: () => void;
  onClearAll: () => void;
}

export const ScopeAssignmentStep: React.FC<ScopeAssignmentStepProps> = ({
  teams,
  onTeamsUpdate,
  onBack,
  onNext,
  onClearAll,
}) => {
  const [availableScopes, setAvailableScopes] = useState<Scope[]>([]);
  const [userDefaultScopes, setUserDefaultScopes] = useState<Record<string, string>>({});
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [scopeToDuplicate, setScopeToDuplicate] = useState<Scope | null>(null);
  const [scopeSearchQuery, setScopeSearchQuery] = useState<Record<string, string>>({});
  const [openScopePopover, setOpenScopePopover] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render after user updates

  useEffect(() => {
    const scopes = getAvailableScopes();
    const allScopes = getScopes();
    console.log('[ScopeAssignmentStep] useEffect - Loading scopes:', {
      availableScopes: scopes.length,
      allScopes: allScopes.length,
      refreshKey,
      scopeModalOpen,
    });
    setAvailableScopes(scopes);
  }, [scopeModalOpen, refreshKey]); // Reload when modal closes or refreshKey changes

  const handleUserScopeToggle = (userId: string, scopeId: string) => {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return;
    
    if (!user.assignedScopeIds) {
      user.assignedScopeIds = [];
    }
    
    const scopeIndex = user.assignedScopeIds.indexOf(scopeId);
    if (scopeIndex === -1) {
      user.assignedScopeIds.push(scopeId);
      // If it's the first scope, set it as default
      if (user.assignedScopeIds.length === 1) {
        setUserDefaultScopes({ ...userDefaultScopes, [userId]: scopeId });
        updateUser(userId, { defaultScopeId: scopeId });
      }
    } else {
      user.assignedScopeIds.splice(scopeIndex, 1);
      // Remove from default if it was the default
      if (userDefaultScopes[userId] === scopeId) {
        const newDefaultScopes = { ...userDefaultScopes };
        delete newDefaultScopes[userId];
        setUserDefaultScopes(newDefaultScopes);
        updateUser(userId, { defaultScopeId: undefined });
      }
    }
    
    // Update user in localStorage
    updateUser(userId, { assignedScopeIds: user.assignedScopeIds });
    
    // Force re-render to show updated scopes
    setRefreshKey(prev => prev + 1);
  };

  const handleSetDefaultScope = (userId: string, scopeId: string) => {
    setUserDefaultScopes({ ...userDefaultScopes, [userId]: scopeId });
    updateUser(userId, { defaultScopeId: scopeId });
    // Force re-render
    setRefreshKey(prev => prev + 1);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserScopes = (userId: string): Scope[] => {
    const user = getUsers().find(u => u.id === userId);
    if (!user || !user.assignedScopeIds) {
      console.log('[ScopeAssignmentStep] getUserScopes - No user or no assignedScopeIds:', userId);
      return [];
    }
    const scopes = availableScopes.filter(s => user.assignedScopeIds!.includes(s.id));
    console.log('[ScopeAssignmentStep] getUserScopes:', {
      userId,
      userName: user.name,
      assignedScopeIds: user.assignedScopeIds,
      availableScopesIds: availableScopes.map(s => s.id),
      foundScopes: scopes.map(s => ({ id: s.id, name: s.name })),
    });
    return scopes;
  };

  const getFilteredScopes = (userId: string): Scope[] => {
    const query = scopeSearchQuery[userId] || '';
    const user = getUsers().find(u => u.id === userId);
    const selectedScopeIds = user?.assignedScopeIds || [];
    
    return availableScopes.filter(scope => {
      const matchesSearch = !query || 
        scope.name.toLowerCase().includes(query.toLowerCase()) ||
        scope.description?.toLowerCase().includes(query.toLowerCase());
      const isNotSelected = !selectedScopeIds.includes(scope.id);
      return matchesSearch && isNotSelected;
    });
  };

  // Check if a scope is shared (used by other members)
  const isScopeShared = (scopeId: string, excludeUserId: string): boolean => {
    const users = getUsers();
    return users.some(user => 
      user.id !== excludeUserId && 
      user.assignedScopeIds && 
      user.assignedScopeIds.includes(scopeId)
    );
  };

  const getTeamMembers = (teamId: string): User[] => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    return getUsers().filter(u => team.memberIds.includes(u.id));
  };

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-8 pt-4 space-y-6 pb-0">
            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5">
              <div className="p-2 rounded-lg bg-[#31C7AD]/10">
                <Target className="h-5 w-5 text-[#31C7AD]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Assign scopes to team members</p>
                <p className="text-xs text-muted-foreground">
                  Assign scopes to each team member individually. Each member can have multiple scopes, with one set as the default primary scope.
                </p>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teams.map((team) => {
                const teamMembers = getTeamMembers(team.id);
                
                return (
                  <div
                    key={team.id}
                    className="rounded-xl border-2 border-border bg-background hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Team Header */}
                    <div className="p-5 bg-gradient-to-br from-[#2063F0]/5 to-[#31C7AD]/5 border-b border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">{team.name}</h3>
                          {team.description && (
                            <p className="text-sm text-muted-foreground">{team.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />
                          {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Team Content */}
                    <div className="p-5 space-y-4">
                      {teamMembers.length > 0 ? (
                        teamMembers.map((member) => {
                          const memberScopes = getUserScopes(member.id);
                          const defaultScopeId = userDefaultScopes[member.id] || member.defaultScopeId;
                          const availableScopesForMember = getFilteredScopes(member.id);
                          const popoverKey = `${team.id}-${member.id}`;
                          
                          console.log('[ScopeAssignmentStep] Rendering member:', member.name, {
                            memberId: member.id,
                            assignedScopeIds: member.assignedScopeIds,
                            memberScopesCount: memberScopes.length,
                            memberScopes: memberScopes.map(s => ({ id: s.id, name: s.name })),
                            availableScopesCount: availableScopes.length,
                          });
                          
                          return (
                            <div
                              key={member.id}
                              className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
                            >
                              {/* Member Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#2063F0] to-[#31C7AD] flex items-center justify-center text-white text-sm font-semibold">
                                    {getInitials(member.name)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-foreground">
                                      {member.name}
                                    </div>
                                  </div>
                                </div>
                                {memberScopes.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {memberScopes.length} scope{memberScopes.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>

                              {/* Scopes Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">Scopes</span>
                                  <Popover 
                                    open={openScopePopover === popoverKey}
                                    onOpenChange={(open) => {
                                      setOpenScopePopover(open ? popoverKey : null);
                                      if (!open) {
                                        setScopeSearchQuery({ ...scopeSearchQuery, [member.id]: '' });
                                      }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 gap-1 text-xs"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Add Scope
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-96 p-0" align="end">
                                      <div className="p-3 border-b border-border space-y-2">
                                        <div className="relative">
                                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            placeholder="Search scopes..."
                                            value={scopeSearchQuery[member.id] || ''}
                                            onChange={(e) => setScopeSearchQuery({ ...scopeSearchQuery, [member.id]: e.target.value })}
                                            className="pl-8 h-9 text-sm"
                                          />
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setCurrentMemberId(member.id);
                                            setEditingScope(null);
                                            setScopeToDuplicate(null);
                                            setOpenScopePopover(null);
                                            setScopeModalOpen(true);
                                          }}
                                          className="w-full h-8 gap-1.5 text-xs"
                                        >
                                          <Plus className="h-3 w-3" />
                                          Create New Scope
                                        </Button>
                                      </div>
                                      <ScrollArea className="max-h-[400px]">
                                        <div className="p-2">
                                          {availableScopesForMember.length === 0 && availableScopes.length > 0 ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                              {scopeSearchQuery[member.id] ? 'No scopes found' : 'All scopes assigned'}
                                            </div>
                                          ) : availableScopesForMember.length > 0 ? (
                                            <div className="space-y-1">
                                              {availableScopesForMember.map((scope) => (
                                                <div
                                                  key={scope.id}
                                                  className="group"
                                                >
                                                  <div className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-muted transition-colors">
                                                    <button
                                                      onClick={() => {
                                                        // Open modal to modify scope before assigning
                                                        setCurrentMemberId(member.id);
                                                        setEditingScope(null);
                                                        setScopeToDuplicate(scope);
                                                        setOpenScopePopover(null);
                                                        setScopeModalOpen(true);
                                                      }}
                                                      className="flex-1 flex items-start gap-3 text-left min-w-0"
                                                    >
                                                      <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-foreground group-hover:text-[#31C7AD] transition-colors mb-1">
                                                          {scope.name}
                                                        </div>
                                                        {scope.description && (
                                                          <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                                            {scope.description}
                                                          </div>
                                                        )}
                                                        {scope.filters && scope.filters.length > 0 && (
                                                          <div className="text-xs text-muted-foreground">
                                                            {scope.filters.length} filter{scope.filters.length !== 1 ? 's' : ''}
                                                          </div>
                                                        )}
                                                      </div>
                                                      <Plus className="h-4 w-4 text-muted-foreground group-hover:text-[#31C7AD] transition-colors flex-shrink-0 mt-1" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                      </ScrollArea>
                                    </PopoverContent>
                                  </Popover>
                                </div>

                                {/* Selected Scopes */}
                                {memberScopes.length > 0 ? (
                                  <div className="space-y-2">
                                    {memberScopes.map((scope) => {
                                      const isDefault = defaultScopeId === scope.id;
                                      return (
                                        <div
                                          key={scope.id}
                                          className="group relative flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20 hover:border-[#31C7AD]/40 transition-all"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-sm font-medium text-foreground">
                                                {scope.name}
                                              </span>
                                              {isDefault && (
                                                <Badge variant="outline" className="text-xs h-4 px-1.5 bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/30 flex items-center gap-1">
                                                  <Star className="h-2.5 w-2.5 fill-[#2063F0]" />
                                                  Default
                                                </Badge>
                                              )}
                                            </div>
                                            {scope.description && (
                                              <p className="text-xs text-muted-foreground line-clamp-1">
                                                {scope.description}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              onClick={() => {
                                                setCurrentMemberId(member.id);
                                                // If scope is shared, duplicate it instead of editing
                                                if (isScopeShared(scope.id, member.id)) {
                                                  setEditingScope(null);
                                                  setScopeToDuplicate(scope);
                                                } else {
                                                  setEditingScope(scope);
                                                  setScopeToDuplicate(null);
                                                }
                                                setScopeModalOpen(true);
                                              }}
                                              className="p-1 rounded-md hover:bg-[#31C7AD]/10 text-muted-foreground hover:text-[#31C7AD] transition-colors opacity-0 group-hover:opacity-100"
                                              title={isScopeShared(scope.id, member.id) ? "Duplicate and modify scope" : "Edit scope"}
                                            >
                                              <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            {!isDefault && (
                                              <button
                                                onClick={() => handleSetDefaultScope(member.id, scope.id)}
                                                className="p-1 rounded-md hover:bg-[#2063F0]/10 text-muted-foreground hover:text-[#2063F0] transition-colors opacity-0 group-hover:opacity-100"
                                                title="Set as default"
                                              >
                                                <Star className="h-3.5 w-3.5" />
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleUserScopeToggle(member.id, scope.id)}
                                              className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                              title="Remove scope"
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center py-4 px-4 rounded-lg border-2 border-dashed border-border bg-muted/20">
                                    <p className="text-xs text-muted-foreground">No scopes assigned</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
                          <div className="text-center">
                            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              No members in this team. Add members in the previous step.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create Scope Option */}
            {availableScopes.length === 0 && (
              <div className="p-4 rounded-xl border-2 border-dashed border-border bg-muted/30 text-center">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground mb-3">No scopes available</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScopeModalOpen(true)}
                  className="h-9"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Scope
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Scope Creation/Edit Modal */}
      {scopeModalOpen && (
        <ScopeModal
          open={scopeModalOpen}
          onOpenChange={(open) => {
            setScopeModalOpen(open);
            if (!open) {
              setEditingScope(null);
              setScopeToDuplicate(null);
              setCurrentMemberId(null);
            }
          }}
          scope={scopeToDuplicate ? {
            ...scopeToDuplicate,
            id: `temp-${Date.now()}`,
            name: scopeToDuplicate.name, // Keep original name, user can modify it
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } : editingScope || undefined}
          title={scopeToDuplicate ? "Modify Scope" : editingScope ? "Edit Scope" : "Create New Scope"}
          saveButtonText={scopeToDuplicate ? "Add Scope" : editingScope ? "Update Scope" : undefined}
          onSave={() => {
            console.log('[ScopeAssignmentStep] onSave called', {
              currentMemberId,
              editingScope: editingScope?.id,
              scopeToDuplicate: scopeToDuplicate?.id,
            });
            
            // Reload scopes after creation/update
            const oldScopes = getAvailableScopes();
            const oldScopeIds = new Set(oldScopes.map(s => s.id));
            console.log('[ScopeAssignmentStep] Old scopes:', oldScopes.length, 'IDs:', Array.from(oldScopeIds));
            
            // Wait a bit for the scope to be saved
            setTimeout(() => {
              const allScopes = getScopes(); // Get ALL scopes from localStorage
              const newScopes = getAvailableScopes(); // Get filtered scopes
              console.log('[ScopeAssignmentStep] After save - All scopes:', allScopes.length, 'Available scopes:', newScopes.length);
              console.log('[ScopeAssignmentStep] All scope IDs:', allScopes.map(s => ({ id: s.id, name: s.name, isGlobal: s.isGlobal, userId: s.userId })));
              
              // Find the newly created scope (either new or duplicated)
              const newScope = newScopes.find(s => !oldScopeIds.has(s.id));
              console.log('[ScopeAssignmentStep] New scope found:', newScope ? { id: newScope.id, name: newScope.name } : 'NOT FOUND');
              
              // Also check in all scopes if not found in filtered
              const newScopeInAll = !newScope ? allScopes.find(s => !oldScopeIds.has(s.id)) : null;
              console.log('[ScopeAssignmentStep] New scope in all scopes:', newScopeInAll ? { id: newScopeInAll.id, name: newScopeInAll.name } : 'NOT FOUND');
              
              // Use the scope from all scopes if available
              const scopeToAssign = newScope || newScopeInAll;
              
              setAvailableScopes(newScopes);
              
              // If creating a new scope (not editing) and we have a current member, assign it automatically
              if (currentMemberId && !editingScope && !scopeToDuplicate && scopeToAssign) {
                console.log('[ScopeAssignmentStep] Assigning new scope to member:', currentMemberId, 'Scope:', scopeToAssign.id);
                // Directly assign the scope to the member without checking (to avoid timing issues)
                const user = getUsers().find(u => u.id === currentMemberId);
                console.log('[ScopeAssignmentStep] User found:', user ? { id: user.id, name: user.name, currentScopes: user.assignedScopeIds } : 'NOT FOUND');
                
                if (user) {
                  const assignedScopeIds = user.assignedScopeIds || [];
                  if (!assignedScopeIds.includes(scopeToAssign.id)) {
                    assignedScopeIds.push(scopeToAssign.id);
                    console.log('[ScopeAssignmentStep] Adding scope to user. New assignedScopeIds:', assignedScopeIds);
                    // If it's the first scope, set it as default
                    if (assignedScopeIds.length === 1) {
                      setUserDefaultScopes({ ...userDefaultScopes, [currentMemberId]: scopeToAssign.id });
                      updateUser(currentMemberId, { 
                        assignedScopeIds: assignedScopeIds,
                        defaultScopeId: scopeToAssign.id 
                      });
                      console.log('[ScopeAssignmentStep] Set as default scope');
                    } else {
                      updateUser(currentMemberId, { assignedScopeIds: assignedScopeIds });
                    }
                    // Force re-render
                    setRefreshKey(prev => prev + 1);
                    console.log('[ScopeAssignmentStep] Refresh key updated');
                  } else {
                    console.log('[ScopeAssignmentStep] Scope already assigned to user');
                  }
                }
              }
              
              // If duplicating a scope, assign the new copy to the current member
              if (currentMemberId && scopeToDuplicate && scopeToAssign) {
                console.log('[ScopeAssignmentStep] Assigning duplicated scope to member:', currentMemberId, 'Scope:', scopeToAssign.id);
                // Directly assign the duplicated scope to the member
                const user = getUsers().find(u => u.id === currentMemberId);
                if (user) {
                  const assignedScopeIds = user.assignedScopeIds || [];
                  if (!assignedScopeIds.includes(scopeToAssign.id)) {
                    assignedScopeIds.push(scopeToAssign.id);
                    // If it's the first scope, set it as default
                    if (assignedScopeIds.length === 1) {
                      setUserDefaultScopes({ ...userDefaultScopes, [currentMemberId]: scopeToAssign.id });
                      updateUser(currentMemberId, { 
                        assignedScopeIds: assignedScopeIds,
                        defaultScopeId: scopeToAssign.id 
                      });
                    } else {
                      updateUser(currentMemberId, { assignedScopeIds: assignedScopeIds });
                    }
                    // Force re-render
                    setRefreshKey(prev => prev + 1);
                  }
                }
              }
              
              setScopeModalOpen(false);
              setEditingScope(null);
              setScopeToDuplicate(null);
              setCurrentMemberId(null);
            }, 200);
          }}
        />
      )}
    </>
  );
};

