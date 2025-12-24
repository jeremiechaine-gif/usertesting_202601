/**
 * Step 3: Add Scopes to Team Members
 * Assign scopes to each team member individually
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Target, CheckCircle2, X, Search, Plus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamConfig } from './TeamSetupStep';
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

interface ScopesAndReviewStepProps {
  teams: TeamConfig[];
  onTeamsChange: (teams: TeamConfig[]) => void;
  onBack: () => void;
  onComplete: () => void;
  onClearAll: () => void;
}

export const ScopesAndReviewStep: React.FC<ScopesAndReviewStepProps> = ({
  teams,
  onTeamsChange,
  onBack,
  onComplete,
  onClearAll,
}) => {
  const [availableScopes, setAvailableScopes] = useState<Scope[]>([]);
  const [userDefaultScopes, setUserDefaultScopes] = useState<Record<string, string>>({});
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [scopeSearchQuery, setScopeSearchQuery] = useState<Record<string, string>>({});
  const [openScopePopover, setOpenScopePopover] = useState<string | null>(null);

  useEffect(() => {
    const scopes = getAvailableScopes();
    setAvailableScopes(scopes);
  }, []);

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
  };

  const handleSetDefaultScope = (userId: string, scopeId: string) => {
    setUserDefaultScopes({ ...userDefaultScopes, [userId]: scopeId });
    updateUser(userId, { defaultScopeId: scopeId });
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
    if (!user || !user.assignedScopeIds) return [];
    return availableScopes.filter(s => user.assignedScopeIds!.includes(s.id));
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

  const getTeamMembers = (teamIndex: number): User[] => {
    const team = teams[teamIndex];
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
              {teams.map((team, teamIndex) => {
                const teamMembers = getTeamMembers(teamIndex);
                
                return (
                  <div
                    key={teamIndex}
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
                          const popoverKey = `${teamIndex}-${member.id}`;
                          
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
                                    {member.email && (
                                      <div className="text-xs text-muted-foreground">
                                        {member.email}
                                      </div>
                                    )}
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
                                        disabled={availableScopesForMember.length === 0}
                                      >
                                        <Plus className="h-3 w-3" />
                                        Add Scope
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="end">
                                      <div className="p-3 border-b border-border">
                                        <div className="relative">
                                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            placeholder="Search scopes..."
                                            value={scopeSearchQuery[member.id] || ''}
                                            onChange={(e) => setScopeSearchQuery({ ...scopeSearchQuery, [member.id]: e.target.value })}
                                            className="pl-8 h-9 text-sm"
                                          />
                                        </div>
                                      </div>
                                      <ScrollArea className="max-h-64">
                                        <div className="p-2">
                                          {availableScopesForMember.length === 0 ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                              {scopeSearchQuery[member.id] ? 'No scopes found' : availableScopes.length === 0 ? 'No scopes available' : 'All scopes assigned'}
                                            </div>
                                          ) : (
                                            <div className="space-y-1">
                                              {availableScopesForMember.map((scope) => (
                                                <button
                                                  key={scope.id}
                                                  onClick={() => {
                                                    handleUserScopeToggle(member.id, scope.id);
                                                  }}
                                                  className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left group"
                                                >
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-foreground group-hover:text-[#31C7AD] transition-colors mb-1">
                                                      {scope.name}
                                                    </div>
                                                    {scope.description && (
                                                      <div className="text-xs text-muted-foreground line-clamp-2">
                                                        {scope.description}
                                                      </div>
                                                    )}
                                                    {scope.filters && scope.filters.length > 0 && (
                                                      <div className="text-xs text-muted-foreground mt-1">
                                                        {scope.filters.length} filter{scope.filters.length !== 1 ? 's' : ''}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-[#31C7AD] transition-colors flex-shrink-0 mt-1" />
                                                </button>
                                              ))}
                                            </div>
                                          )}
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

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border/50 bg-background shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-[#2063F0] hover:bg-[#2063F0]/5 gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                Clear All
              </Button>
            </div>
            <Button
              onClick={onComplete}
              className="gap-2 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete Setup
            </Button>
          </div>
        </div>
      </div>

      {/* Scope Creation Modal */}
      {scopeModalOpen && (
        <ScopeModal
          open={scopeModalOpen}
          onOpenChange={setScopeModalOpen}
          title="Create Scope"
          onSave={() => {
            // Reload scopes after creation
            const scopes = getAvailableScopes();
            setAvailableScopes(scopes);
            setScopeModalOpen(false);
          }}
        />
      )}
    </>
  );
};
