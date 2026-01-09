/**
 * Step 3: Add Members to Teams
 * Assign members to each team
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Users, Plus, X, Search, CheckSquare, Square, Filter, ArrowLeft, Zap, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleTeamConfig } from './SimpleOnboardingWizard';
import { getUsers, getCurrentUserId, type User } from '@/lib/users';
import { createMockUsersForTeams } from '@/lib/onboarding/teamWizardUtils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateUserModal } from './CreateUserModal';
import { ImportMembersModal } from './ImportMembersModal';

interface MemberAssignmentStepProps {
  teams: SimpleTeamConfig[];
  onTeamsUpdate: (teams: SimpleTeamConfig[]) => void;
  onNext: () => void;
  onBack: () => void;
  onClearAll: () => void;
}

export const MemberAssignmentStep: React.FC<MemberAssignmentStepProps> = ({
  teams,
  onTeamsUpdate,
  onNext,
  onBack,
  onClearAll,
}) => {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState<Record<string, string>>({});
  const [openMemberPopover, setOpenMemberPopover] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState<Record<string, 'all' | 'not-assigned'>>({});
  const [selectedMembersInPopover, setSelectedMembersInPopover] = useState<Record<string, Set<string>>>({});
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createUserModalTeamId, setCreateUserModalTeamId] = useState<string | undefined>(undefined);
  const [importMembersModalOpen, setImportMembersModalOpen] = useState(false);
  const [importMembersModalTeamId, setImportMembersModalTeamId] = useState<string | undefined>(undefined);

  // Load available users
  useEffect(() => {
    const loadUsers = () => {
      const teamNames = teams.map(t => t.name);
      const mockUsers = createMockUsersForTeams(teamNames);
      const allUsers = getUsers();
      const adminId = getCurrentUserId();
      
      // Combine mock users and real users, filter out admin
      const combinedUsers = [...mockUsers, ...allUsers].filter(u => u.id !== adminId);
      
      // Remove duplicates by email (keep first occurrence)
      const uniqueUsers = combinedUsers.filter((user, index, self) =>
        index === self.findIndex(u => u.email?.toLowerCase() === user.email?.toLowerCase())
      );
      
      setAvailableUsers(uniqueUsers);
    };
    
    loadUsers();
  }, [teams]);

  // Refresh users when modal closes (in case a new user was created)
  useEffect(() => {
    if (!createUserModalOpen) {
      const loadUsers = () => {
        const teamNames = teams.map(t => t.name);
        const mockUsers = createMockUsersForTeams(teamNames);
        const allUsers = getUsers();
        const adminId = getCurrentUserId();
        
        const combinedUsers = [...mockUsers, ...allUsers].filter(u => u.id !== adminId);
        const uniqueUsers = combinedUsers.filter((user, index, self) =>
          index === self.findIndex(u => u.email?.toLowerCase() === user.email?.toLowerCase())
        );
        
        setAvailableUsers(uniqueUsers);
      };
      
      loadUsers();
    }
  }, [createUserModalOpen, teams]);

  const handleUserCreated = (userId: string) => {
    // Refresh users list
    const teamNames = teams.map(t => t.name);
    const mockUsers = createMockUsersForTeams(teamNames);
    const allUsers = getUsers();
    const adminId = getCurrentUserId();
    
    const combinedUsers = [...mockUsers, ...allUsers].filter(u => u.id !== adminId);
    const uniqueUsers = combinedUsers.filter((user, index, self) =>
      index === self.findIndex(u => u.email?.toLowerCase() === user.email?.toLowerCase())
    );
    
    setAvailableUsers(uniqueUsers);
    
    // If a team ID was specified, automatically add the new user to that team
    if (createUserModalTeamId) {
      handleMemberToggle(createUserModalTeamId, userId);
    }
    
    // Close the member popover if it was open
    if (openMemberPopover === createUserModalTeamId) {
      setOpenMemberPopover(null);
    }
  };

  const handleMembersImported = (userIds: string[]) => {
    // Refresh users list
    const teamNames = teams.map(t => t.name);
    const mockUsers = createMockUsersForTeams(teamNames);
    const allUsers = getUsers();
    const adminId = getCurrentUserId();
    
    const combinedUsers = [...mockUsers, ...allUsers].filter(u => u.id !== adminId);
    const uniqueUsers = combinedUsers.filter((user, index, self) =>
      index === self.findIndex(u => u.email?.toLowerCase() === user.email?.toLowerCase())
    );
    
    setAvailableUsers(uniqueUsers);
    
    // If a team ID was specified, automatically add all imported users to that team
    if (importMembersModalTeamId) {
      const updatedTeams = teams.map(team => {
        if (team.id === importMembersModalTeamId) {
          const newMemberIds = [...team.memberIds];
          userIds.forEach(userId => {
            if (!newMemberIds.includes(userId)) {
              newMemberIds.push(userId);
            }
          });
          return { ...team, memberIds: newMemberIds, updatedAt: new Date().toISOString() };
        }
        return team;
      });
      onTeamsUpdate(updatedTeams);
    }
    
    // Close the member popover if it was open
    if (openMemberPopover === importMembersModalTeamId) {
      setOpenMemberPopover(null);
    }
  };

  const handleMemberToggle = (teamId: string, userId: string) => {
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        const memberIndex = team.memberIds.indexOf(userId);
        const newMemberIds = [...team.memberIds];
        
        if (memberIndex === -1) {
          newMemberIds.push(userId);
        } else {
          newMemberIds.splice(memberIndex, 1);
        }
        
        return { ...team, memberIds: newMemberIds, updatedAt: new Date().toISOString() };
      }
      return team;
    });
    
    onTeamsUpdate(updatedTeams);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get teams where a user is already assigned
  const getUserTeams = (userId: string): SimpleTeamConfig[] => {
    return teams.filter(team => team.memberIds.includes(userId));
  };

  // Check if user is not assigned to any team
  const isUserNotAssigned = (userId: string): boolean => {
    return !teams.some(team => team.memberIds.includes(userId));
  };

  const getFilteredMembers = (teamId: string): User[] => {
    const query = memberSearchQuery[teamId] || '';
    const filter = memberFilter[teamId] || 'all';
    const team = teams.find(t => t.id === teamId);
    const selectedMemberIds = team?.memberIds || [];
    
    let filtered = availableUsers.filter(user => {
      const matchesSearch = !query || 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase());
      
      // Apply filter - show all members by default, or filter by assignment status
      if (filter === 'not-assigned') {
        // Show only members not assigned to any team
        return matchesSearch && isUserNotAssigned(user.id);
      }
      
      // Show all members (assigned or not) - don't filter by selection in this team
      return matchesSearch;
    });

    // Sort by first name alphabetically
    return filtered.sort((a, b) => {
      const firstNameA = a.name.split(' ')[0].toLowerCase();
      const firstNameB = b.name.split(' ')[0].toLowerCase();
      return firstNameA.localeCompare(firstNameB);
    });
  };

  const getSelectedMembersInPopover = (teamId: string): Set<string> => {
    return selectedMembersInPopover[teamId] || new Set();
  };

  const handleSelectAllMembers = (teamId: string) => {
    const filteredMembers = getFilteredMembers(teamId);
    // Only add members that are not already in the team
    const team = teams.find(t => t.id === teamId);
    const currentMemberIds = team?.memberIds || [];
    const memberIds = filteredMembers
      .map(m => m.id)
      .filter(id => !currentMemberIds.includes(id));
    
    const currentSelected = getSelectedMembersInPopover(teamId);
    const newSelected = new Set([...currentSelected, ...memberIds]);
    setSelectedMembersInPopover({ ...selectedMembersInPopover, [teamId]: newSelected });
    
    // Add all selected members to the team
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        const newMemberIds = [...team.memberIds];
        memberIds.forEach(memberId => {
          if (!newMemberIds.includes(memberId)) {
            newMemberIds.push(memberId);
          }
        });
        return { ...team, memberIds: newMemberIds, updatedAt: new Date().toISOString() };
      }
      return team;
    });
    onTeamsUpdate(updatedTeams);
  };

  const handleUnselectAllMembers = (teamId: string) => {
    const filteredMembers = getFilteredMembers(teamId);
    const memberIds = filteredMembers.map(m => m.id);
    const currentSelected = getSelectedMembersInPopover(teamId);
    const newSelected = new Set([...currentSelected].filter(id => !memberIds.includes(id)));
    setSelectedMembersInPopover({ ...selectedMembersInPopover, [teamId]: newSelected });
    
    // Remove all filtered members from the team
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        return { 
          ...team, 
          memberIds: team.memberIds.filter(id => !memberIds.includes(id)),
          updatedAt: new Date().toISOString()
        };
      }
      return team;
    });
    onTeamsUpdate(updatedTeams);
  };

  const handleMemberToggleInPopover = (teamId: string, userId: string, checked: boolean) => {
    const currentSelected = getSelectedMembersInPopover(teamId);
    const newSelected = new Set(currentSelected);
    
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    
    setSelectedMembersInPopover({ ...selectedMembersInPopover, [teamId]: newSelected });
    handleMemberToggle(teamId, userId);
  };

  const getTeamMembers = (teamId: string): User[] => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    const members = availableUsers.filter(u => team.memberIds.includes(u.id));
    // Sort by first name alphabetically
    return members.sort((a, b) => {
      const firstNameA = a.name.split(' ')[0].toLowerCase();
      const firstNameB = b.name.split(' ')[0].toLowerCase();
      return firstNameA.localeCompare(firstNameB);
    });
  };

  const canContinue = teams.every(team => team.memberIds.length > 0);

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
                Assign team members to each team. Members can belong to multiple teams.
              </p>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map((team, teamIndex) => {
              const teamMembers = getTeamMembers(team.id);
              const availableMembers = getFilteredMembers(team.id);
              // Determine popover side based on team position: left column = right side, right column = left side
              const isLeftColumn = teamIndex % 2 === 0;
              const popoverSide = isLeftColumn ? 'end' : 'start';
              
              return (
                <div
                  key={team.id}
                  className="rounded-xl border-2 border-border bg-background hover:shadow-lg transition-all overflow-hidden flex flex-col"
                >
                  {/* Team Header */}
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-[#2063F0]/5 to-[#31C7AD]/5 border-b border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg break-words mb-1.5">{team.name}</h3>
                        {team.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">{team.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the team "${team.name}"? This will remove all assigned members and make them available again.`)) {
                            const updatedTeams = teams.filter(t => t.id !== team.id);
                            onTeamsUpdate(updatedTeams);
                          }
                        }}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete team"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Team Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    {/* Members Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#2063F0]" />
                          <span className="text-sm font-medium">
                            Team Members ({teamMembers.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => {
                              setImportMembersModalTeamId(team.id);
                              setImportMembersModalOpen(true);
                            }}
                          >
                            <Upload className="h-3 w-3" />
                            Import member
                          </Button>
                          <Popover 
                          open={openMemberPopover === team.id}
                          onOpenChange={(open) => {
                            setOpenMemberPopover(open ? team.id : null);
                            if (!open) {
                              setMemberSearchQuery({ ...memberSearchQuery, [team.id]: '' });
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                            >
                              <Plus className="h-3 w-3" />
                              Add Member
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-96 p-0 flex flex-col overflow-hidden" 
                            style={{ height: '500px', maxHeight: '500px' }}
                            align={popoverSide}
                            side={isLeftColumn ? 'right' : 'left'}
                            sideOffset={8}
                            collisionPadding={16}
                            avoidCollisions={true}
                          >
                            <div className="p-3 border-b border-border space-y-3 flex-shrink-0">
                              {/* Search */}
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search members..."
                                  value={memberSearchQuery[team.id] || ''}
                                  onChange={(e) => setMemberSearchQuery({ ...memberSearchQuery, [team.id]: e.target.value })}
                                  className="pl-8 h-9 text-sm"
                                />
                              </div>
                              
                              {/* Total Users Count */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {availableMembers.length === availableUsers.length 
                                    ? `${availableUsers.length} ${availableUsers.length === 1 ? 'user' : 'users'} available`
                                    : `${availableMembers.length} of ${availableUsers.length} ${availableUsers.length === 1 ? 'user' : 'users'}`}
                                </span>
                              </div>
                              
                              {/* Filter and Select All */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                  <button
                                    onClick={() => {
                                      const currentFilter = memberFilter[team.id] || 'all';
                                      setMemberFilter({ ...memberFilter, [team.id]: currentFilter === 'all' ? 'not-assigned' : 'all' });
                                    }}
                                    className={cn(
                                      "text-xs px-2 py-1 rounded-md transition-colors",
                                      (memberFilter[team.id] || 'all') === 'not-assigned'
                                        ? "bg-[#2063F0]/10 text-[#2063F0] font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                  >
                                    Not assigned
                                  </button>
                                </div>
                                {availableMembers.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleSelectAllMembers(team.id)}
                                      className="text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                                    >
                                      <CheckSquare className="h-3 w-3" />
                                      Select all
                                    </button>
                                    <span className="text-muted-foreground">•</span>
                                    <button
                                      onClick={() => handleUnselectAllMembers(team.id)}
                                      className="text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                                    >
                                      <Square className="h-3 w-3" />
                                      Unselect all
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-h-0 overflow-hidden">
                              <ScrollArea className="h-full">
                                <div className="p-2">
                                {availableMembers.length === 0 ? (
                                  <div className="text-center py-8 text-sm text-muted-foreground space-y-3">
                                    <p>
                                      {memberSearchQuery[team.id] 
                                        ? 'No members found' 
                                        : (memberFilter[team.id] === 'not-assigned' 
                                          ? 'All members are assigned to teams' 
                                          : 'All members assigned to this team')}
                                    </p>
                                    {memberSearchQuery[team.id] && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setCreateUserModalTeamId(team.id);
                                          setCreateUserModalOpen(true);
                                        }}
                                        className="text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/10"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Create "{memberSearchQuery[team.id]}"
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {availableMembers.map((user) => {
                                      const userTeams = getUserTeams(user.id);
                                      const isChecked = team.memberIds.includes(user.id);
                                      const isNotAssigned = isUserNotAssigned(user.id);
                                      
                                      return (
                                        <div
                                          key={user.id}
                                          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors group"
                                        >
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) => handleMemberToggleInPopover(team.id, user.id, checked as boolean)}
                                            className="mt-1"
                                          />
                                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#2063F0] to-[#31C7AD] flex items-center justify-center text-white text-xs font-semibold">
                                            {getInitials(user.name)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <div className="text-sm font-medium text-foreground group-hover:text-[#2063F0] transition-colors">
                                                {user.name}
                                              </div>
                                              {isNotAssigned && (
                                                <Badge variant="secondary" className="text-xs h-4 px-1.5 bg-green-500/10 text-green-600 border-green-500/30">
                                                  Not assigned
                                                </Badge>
                                              )}
                                              {!isNotAssigned && userTeams.length > 0 && (
                                                <Badge variant="secondary" className="text-xs h-4 px-1.5 bg-orange-500/10 text-orange-600 border-orange-500/30">
                                                  Assigned
                                                </Badge>
                                              )}
                                            </div>
                                            {userTeams.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {userTeams.map((userTeam) => (
                                                  <Badge
                                                    key={userTeam.id}
                                                    variant="secondary"
                                                    className="text-xs h-4 px-1.5 bg-orange-500/10 text-orange-600 border-orange-500/30"
                                                  >
                                                    {userTeam.name}
                                                  </Badge>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                </div>
                              </ScrollArea>
                            </div>
                            {/* Create New User Button */}
                            <div className="border-t border-border p-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setCreateUserModalTeamId(team.id);
                                  setCreateUserModalOpen(true);
                                }}
                                className="w-full justify-start gap-2 text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/10"
                              >
                                <Plus className="h-4 w-4" />
                                Create new user
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        </div>
                      </div>
                      
                      {/* Clear Button */}
                      {teamMembers.length > 0 && (
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedTeams = teams.map(t => {
                                if (t.id === team.id) {
                                  return { ...t, memberIds: [], updatedAt: new Date().toISOString() };
                                }
                                return t;
                              });
                              onTeamsUpdate(updatedTeams);
                            }}
                            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-3 w-3" />
                            Clear
                          </Button>
                        </div>
                      )}

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
                              </div>
                              <button
                                onClick={() => handleMemberToggle(team.id, member.id)}
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

      {/* Create User Modal */}
      <CreateUserModal
        open={createUserModalOpen}
        onOpenChange={setCreateUserModalOpen}
        onUserCreated={handleUserCreated}
        defaultTeamId={createUserModalTeamId}
      />

      {/* Import Members Modal */}
      <ImportMembersModal
        open={importMembersModalOpen}
        onOpenChange={setImportMembersModalOpen}
        onMembersImported={handleMembersImported}
        defaultTeamId={importMembersModalTeamId}
      />
    </div>
  );
};

