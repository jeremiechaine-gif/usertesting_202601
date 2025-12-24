/**
 * Step 2: Add Members to Teams
 * Assign members to each team
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Users, Plus, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamConfig } from './TeamSetupStep';
import { getUsers, getCurrentUserId, type User } from '@/lib/users';
import { createMockUsersForTeams } from '@/lib/onboarding/teamWizardUtils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MembersAndRoutinesStepProps {
  teams: TeamConfig[];
  onTeamsChange: (teams: TeamConfig[]) => void;
  onBack: () => void;
  onNext: () => void;
  onClearAll: () => void;
}

export const MembersAndRoutinesStep: React.FC<MembersAndRoutinesStepProps> = ({
  teams,
  onTeamsChange,
  onBack,
  onNext,
  onClearAll,
}) => {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState<Record<number, string>>({});
  const [openMemberPopover, setOpenMemberPopover] = useState<number | null>(null);

  // Load available users
  useEffect(() => {
    const teamNames = teams.map(t => t.name);
    const allUsers = createMockUsersForTeams(teamNames);
    const adminId = getCurrentUserId();
    setAvailableUsers(allUsers.filter(u => u.id !== adminId));
  }, [teams]);

  const handleMemberToggle = (teamIndex: number, userId: string) => {
    const updatedTeams = [...teams];
    const team = updatedTeams[teamIndex];
    const memberIndex = team.memberIds.indexOf(userId);
    
    if (memberIndex === -1) {
      team.memberIds.push(userId);
    } else {
      team.memberIds.splice(memberIndex, 1);
    }
    
    onTeamsChange(updatedTeams);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFilteredMembers = (teamIndex: number): User[] => {
    const query = memberSearchQuery[teamIndex] || '';
    const team = teams[teamIndex];
    const selectedMemberIds = team?.memberIds || [];
    
    return availableUsers.filter(user => {
      const matchesSearch = !query || 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase());
      const isNotSelected = !selectedMemberIds.includes(user.id);
      return matchesSearch && isNotSelected;
    });
  };

  const getTeamMembers = (teamIndex: number): User[] => {
    const team = teams[teamIndex];
    return availableUsers.filter(u => team.memberIds.includes(u.id));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-8 pt-4 space-y-6 pb-0">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5">
            <div className="p-2 rounded-lg bg-[#31C7AD]/10">
              <Users className="h-5 w-5 text-[#31C7AD]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Add members to teams</p>
              <p className="text-xs text-muted-foreground">
                Assign team members to each team. Members can belong to multiple teams, allowing for flexible collaboration across different projects.
              </p>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map((team, teamIndex) => {
              const teamMembers = getTeamMembers(teamIndex);
              const availableMembers = getFilteredMembers(teamIndex);
              
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
                        <Users className="h-3.5 w-3.5" />
                        {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Team Content */}
                  <div className="p-5">
                    {/* Members Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#2063F0]" />
                          <span className="text-sm font-medium">Team Members</span>
                        </div>
                        <Popover 
                          open={openMemberPopover === teamIndex}
                          onOpenChange={(open) => {
                            setOpenMemberPopover(open ? teamIndex : null);
                            if (!open) {
                              setMemberSearchQuery({ ...memberSearchQuery, [teamIndex]: '' });
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                              disabled={availableMembers.length === 0}
                            >
                              <Plus className="h-3 w-3" />
                              Add Member
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="end">
                            <div className="p-3 border-b border-border">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search members..."
                                  value={memberSearchQuery[teamIndex] || ''}
                                  onChange={(e) => setMemberSearchQuery({ ...memberSearchQuery, [teamIndex]: e.target.value })}
                                  className="pl-8 h-9 text-sm"
                                />
                              </div>
                            </div>
                            <ScrollArea className="max-h-64">
                              <div className="p-2">
                                {availableMembers.length === 0 ? (
                                  <div className="text-center py-8 text-sm text-muted-foreground">
                                    {memberSearchQuery[teamIndex] ? 'No members found' : 'All members assigned'}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {availableMembers.map((user) => (
                                      <button
                                        key={user.id}
                                        onClick={() => {
                                          handleMemberToggle(teamIndex, user.id);
                                        }}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left group"
                                      >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#2063F0] to-[#31C7AD] flex items-center justify-center text-white text-xs font-semibold">
                                          {getInitials(user.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-foreground group-hover:text-[#2063F0] transition-colors">
                                            {user.name}
                                          </div>
                                          {user.email && (
                                            <div className="text-xs text-muted-foreground truncate">
                                              {user.email}
                                            </div>
                                          )}
                                        </div>
                                        <Plus className="h-4 w-4 text-muted-foreground group-hover:text-[#2063F0] transition-colors flex-shrink-0" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Selected Members */}
                      {teamMembers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-[#2063F0]/10 to-[#31C7AD]/5 border border-[#2063F0]/20 hover:border-[#2063F0]/40 transition-all"
                            >
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#2063F0] to-[#31C7AD] flex items-center justify-center text-white text-xs font-semibold">
                                {getInitials(member.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">
                                  {member.name}
                                </div>
                                {member.email && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {member.email}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleMemberToggle(teamIndex, member.id)}
                                className="flex-shrink-0 ml-1 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove member"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-6 px-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
                          <div className="text-center">
                            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              No members yet. Click "Add Member" to get started.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
            onClick={onNext}
            className="gap-2 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md"
          >
            Continue
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};
