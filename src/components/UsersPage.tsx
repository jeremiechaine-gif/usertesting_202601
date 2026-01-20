/**
 * Users & Teams Management Page
 * Allows managers to manage teams and users
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from './Sidebar';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  getCurrentUser,
  getCurrentUserId,
  type User 
} from '@/lib/users';
import { 
  getTeams, 
  createTeam, 
  updateTeam, 
  deleteTeam,
  type Team 
} from '@/lib/teams';
import { getTeamRoutinesCount } from '@/lib/routines';
import { getScopes, type ScopeFilter } from '@/lib/scopes';
import { filterDefinitions } from '@/lib/filterDefinitions';
import { getFilterDisplayValues } from '@/components/sorting-filters/utils';
import { createMockUsersForTeams } from '@/lib/onboarding/teamWizardUtils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Menu,
  Building2,
  Users2,
  Shield,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  Search,
  CheckSquare,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserScopesRoutinesModal } from './UserScopesRoutinesModal';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

export const UsersPage: React.FC<{ onNavigate?: (page: string) => void; onLogout?: () => void }> = ({ onNavigate, onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [userScopesRoutinesModalOpen, setUserScopesRoutinesModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedUserForScopesRoutines, setSelectedUserForScopesRoutines] = useState<User | null>(null);
  const [selectedTeamForNewUser, setSelectedTeamForNewUser] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMemberPopover, setOpenMemberPopover] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState<Record<string, string>>({});
  const [memberFilter, setMemberFilter] = useState<Record<string, 'all' | 'not-assigned'>>({});
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [memberSortOrder, setMemberSortOrder] = useState<Record<string, 'alphabetical' | 'role'>>({});
  const [scopesModalOpen, setScopesModalOpen] = useState(false);
  const [selectedUserForScopes, setSelectedUserForScopes] = useState<User | null>(null);
  const currentUser = getCurrentUser();
  const isManager = currentUser?.role === 'manager';

  useEffect(() => {
    loadUsers();
    loadTeams();
  }, []);

  useEffect(() => {
    if (teams.length > 0) {
      loadAvailableUsers();
    }
  }, [teams]);

  const loadAvailableUsers = () => {
    const teamNames = teams.map(t => t.name);
    const allUsers = createMockUsersForTeams(teamNames);
    const adminId = getCurrentUserId();
    const filteredUsers = allUsers.filter(u => u.id !== adminId);
    
    // Remove duplicates by name (keep first occurrence)
    const uniqueUsers = filteredUsers.filter((user, index, self) =>
      index === self.findIndex(u => u.name.toLowerCase() === user.name.toLowerCase())
    );
    
    setAvailableUsers(uniqueUsers);
  };

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const loadTeams = () => {
    const allTeams = getTeams();
    // Ensure Admin team exists
    let adminTeam = allTeams.find(t => t.name === 'Admin');
    if (!adminTeam) {
      adminTeam = createTeam({
        name: 'Admin',
        description: 'Administrators with full access to the system',
      });
      allTeams.push(adminTeam);
    }
    setTeams(allTeams);
  };

  // Get current user (Lucas)
  const currentUserId = getCurrentUserId();
  const lucasUser = users.find(u => u.id === currentUserId);
  
  // Ensure Lucas is in Admin team
  useEffect(() => {
    if (lucasUser && !lucasUser.teamId && teams.length > 0) {
      const adminTeam = teams.find(t => t.name === 'Admin');
      if (adminTeam) {
        updateUser(lucasUser.id, { teamId: adminTeam.id });
        loadUsers();
      }
    }
  }, [lucasUser, teams]);

  // Get all teams including Admin team, sorted with Admin last
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.name === 'Admin') return 1;
    if (b.name === 'Admin') return -1;
    return 0;
  });

  const handleCreateUser = (teamId?: string) => {
    setEditingUser(null);
    setSelectedTeamForNewUser(teamId || null);
    setUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
      loadUsers();
      loadAvailableUsers();
    }
  };

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setTeamModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamModalOpen(true);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (confirm('Are you sure you want to delete this team? Users in this team will be unassigned.')) {
      deleteTeam(teamId);
      // Unassign users from this team
      users.forEach(user => {
        if (user.teamId === teamId) {
          updateUser(user.id, { teamId: null });
        }
      });
      loadTeams();
      loadUsers();
      loadAvailableUsers();
    }
  };

  const handleAddExistingMember = (teamId: string, userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      updateUser(userId, { teamId });
      loadUsers();
      loadAvailableUsers();
    }
  };

  // const handleRemoveMember = (userId: string) => {
  //   const user = users.find(u => u.id === userId);
  //   if (user) {
  //     updateUser(userId, { teamId: null });
  //     loadUsers();
  //     loadAvailableUsers();
  //   }
  // };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isUserNotAssigned = (userId: string): boolean => {
    return !users.some(u => u.id === userId && u.teamId);
  };

  const getUserTeams = (userId: string): Team[] => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.teamId) return [];
    const team = teams.find(t => t.id === user.teamId);
    return team ? [team] : [];
  };

  const getFilteredMembers = (teamId: string): User[] => {
    const query = memberSearchQuery[teamId] || '';
    const filter = memberFilter[teamId] || 'all';
    const team = teams.find(t => t.id === teamId);
    const teamMemberIds = team ? users.filter(u => u.teamId === team.id).map(u => u.id) : [];
    
    let filtered = availableUsers.filter(user => {
      const matchesSearch = !query || 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase());
      
      if (filter === 'not-assigned') {
        return matchesSearch && isUserNotAssigned(user.id);
      }
      
      return matchesSearch && !teamMemberIds.includes(user.id);
    });

    return filtered.sort((a, b) => {
      const firstNameA = a.name.split(' ')[0].toLowerCase();
      const firstNameB = b.name.split(' ')[0].toLowerCase();
      return firstNameA.localeCompare(firstNameB);
    });
  };

  const handleSelectAllMembers = (teamId: string) => {
    const filteredMembers = getFilteredMembers(teamId);
    filteredMembers.forEach(member => {
      handleAddExistingMember(teamId, member.id);
    });
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {!sidebarCollapsed && (
        <Sidebar 
          activeItem="users" 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(true)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-4 bg-muted/50">
        <div className="flex-1 flex flex-col overflow-hidden bg-background border border-border/60 rounded-2xl shadow-sm">
          {/* Main Header with Gradient */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/5 via-[#2063F0]/5 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="relative px-6 py-5">
            <div className="flex items-center justify-between">
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
                <h1 className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Teams & members</h1>
              </div>
              {isManager && (
                <Button
                  variant="default"
                  onClick={handleCreateTeam}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl">
            {/* Teams Section */}
            <div className="flex flex-col min-w-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  {sortedTeams.length} {sortedTeams.length === 1 ? 'team' : 'teams'} • {users.length} {users.length === 1 ? 'member' : 'members'}
                </h2>
              </div>

              {sortedTeams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-border/60 bg-gradient-to-br from-[#31C7AD]/5 to-transparent">
                  <div className="p-4 rounded-full bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 mb-4">
                    <Building2 className="h-8 w-8 text-[#31C7AD]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-sm text-center">
                    Create your first team to organize users and enable collaboration across your organization
                  </p>
                  {isManager && (
                    <Button
                      variant="default"
                      onClick={handleCreateTeam}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Team
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6">
                  {sortedTeams.map((team) => {
                    const teamUsers = users.filter(u => u.teamId === team.id);
                    const isAdminTeam = team.name === 'Admin';
                    return (
                      <div
                        key={team.id}
                        className={cn(
                          "group rounded-xl overflow-hidden transition-all",
                          isAdminTeam 
                            ? "bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-800" 
                            : "bg-muted hover:border hover:border-[#31C7AD]/30 hover:shadow-lg"
                        )}
                      >
                        {/* Team Header */}
                        <div className={cn(
                          "px-5 py-4 border-b",
                          isAdminTeam ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800" : "bg-muted border-border/60"
                        )}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={cn(
                                "p-2 rounded-lg shrink-0",
                                isAdminTeam 
                                  ? "bg-purple-100 dark:bg-purple-900/30" 
                                  : "bg-[#31C7AD]/10"
                              )}>
                                {isAdminTeam ? (
                                  <Shield className={cn("h-5 w-5", isAdminTeam ? "text-purple-600 dark:text-purple-400" : "text-[#31C7AD]")} />
                                ) : (
                                  <Building2 className="h-5 w-5 text-[#31C7AD]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate mb-1">{team.name}</h3>
                                {team.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {team.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs border-none">
                                    {teamUsers.length} {teamUsers.length === 1 ? 'member' : 'members'}
                                  </Badge>
                                  <Button
                                    variant="accent"
                                    size="sm"
                                    className="h-6 px-2 text-xs gap-1.5"
                                    onClick={() => {
                                      if (onNavigate) {
                                        onNavigate(`team-routines/${team.id}`);
                                      }
                                    }}
                                  >
                                    <Zap className="h-3 w-3" />
                                    {getTeamRoutinesCount(team.id, team.assignedRoutineIds)} {getTeamRoutinesCount(team.id, team.assignedRoutineIds) === 1 ? 'routine' : 'routines'}
                                    <ArrowRight className="h-3 w-3" />
                                  </Button>
                                  {isAdminTeam && (
                                    <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                      System
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isManager && (
                              <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditTeam(team)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTeam(team.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Team Members */}
                        <div className="px-5 py-4">
                          {isManager && (
                            <div className="flex items-center gap-2 mb-3">
                              <Popover 
                                open={openMemberPopover === team.id}
                                onOpenChange={(open: boolean) => {
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
                                    className="gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add Member
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent 
                                  className="w-96 p-0 flex flex-col overflow-hidden" 
                                  style={{ height: '500px', maxHeight: '500px' }}
                                  align="end"
                                  side="bottom"
                                  sideOffset={8}
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
                                        {getFilteredMembers(team.id).length} {getFilteredMembers(team.id).length === 1 ? 'user' : 'users'} available
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
                                      {getFilteredMembers(team.id).length > 0 && (
                                        <button
                                          onClick={() => handleSelectAllMembers(team.id)}
                                          className="text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                                        >
                                          <CheckSquare className="h-3 w-3" />
                                          Select all
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-h-0 overflow-hidden">
                                    <ScrollArea className="h-full">
                                      <div className="p-2">
                                        {getFilteredMembers(team.id).length === 0 ? (
                                          <div className="text-center py-8 text-sm text-muted-foreground">
                                            {memberSearchQuery[team.id] 
                                              ? 'No members found' 
                                              : (memberFilter[team.id] === 'not-assigned' 
                                                ? 'All members are assigned to teams' 
                                                : 'All members assigned to this team')}
                                          </div>
                                        ) : (
                                          <div className="space-y-1">
                                            {getFilteredMembers(team.id).map((user) => {
                                              const userTeams = getUserTeams(user.id);
                                              const isNotAssigned = isUserNotAssigned(user.id);
                                              
                                              return (
                                                <div
                                                  key={user.id}
                                                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors group cursor-pointer"
                                                  onClick={() => handleAddExistingMember(team.id, user.id)}
                                                >
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
                                                    {user.email && (
                                                      <div className="text-xs text-muted-foreground truncate">
                                                        {user.email}
                                                      </div>
                                                    )}
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
                                </PopoverContent>
                              </Popover>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCreateUser(team.id)}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Create User
                              </Button>
                            </div>
                          )}
                          {teamUsers.length > 0 ? (
                            <div className="space-y-3">
                              {/* Sort Controls */}
                              <div className="flex items-center justify-end gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  <Select
                                    value={memberSortOrder[team.id] || 'alphabetical'}
                                    onValueChange={(value: 'alphabetical' | 'role') => {
                                      setMemberSortOrder({ ...memberSortOrder, [team.id]: value });
                                    }}
                                  >
                                    <SelectTrigger className="h-7 w-[140px] text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                                      <SelectItem value="role">By Role</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {(() => {
                                const sortOrder = memberSortOrder[team.id] || 'alphabetical';
                                const sortedUsers = [...teamUsers].sort((a, b) => {
                                  if (sortOrder === 'alphabetical') {
                                    return a.name.localeCompare(b.name);
                                  } else {
                                    // Sort by role: managers first, then users
                                    if (a.role === 'manager' && b.role !== 'manager') return -1;
                                    if (a.role !== 'manager' && b.role === 'manager') return 1;
                                    return a.name.localeCompare(b.name); // Secondary sort by name
                                  }
                                });
                                return sortedUsers.map((user) => {
                                // Get user's team
                                const userTeam = user.teamId ? teams.find(t => t.id === user.teamId) : null;
                                
                                // Get scopes accessible to user (individual + team)
                                const allScopes = getScopes();
                                const individualScopeIds = user.assignedScopeIds || [];
                                const teamScopeIds = userTeam?.assignedScopeIds || [];
                                const accessibleScopeIds = [...new Set([...individualScopeIds, ...teamScopeIds])];
                                const accessibleScopes = allScopes.filter(s => accessibleScopeIds.includes(s.id));
                                
                                // Split name into first and last name
                                const nameParts = user.name.split(' ');
                                const firstName = nameParts[0] || '';
                                const lastName = nameParts.slice(1).join(' ') || '';
                                
                                return (
                                <div
                                  key={user.id}
                                  className={cn(
                                    'group rounded-lg p-4 transition-all bg-muted/40 hover:bg-muted/60 hover:shadow-sm',
                                    user.id === currentUser?.id && 'ring-2 ring-[#31C7AD] ring-offset-1 bg-[#31C7AD]/10 hover:bg-[#31C7AD]/15'
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    {/* Left: User Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {/* Avatar */}
                                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#2063F0] to-[#31C7AD] flex items-center justify-center text-white text-sm font-semibold">
                                        {firstName[0]?.toUpperCase()}{lastName[0]?.toUpperCase() || firstName[1]?.toUpperCase() || ''}
                                      </div>
                                      
                                      {/* User Details */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-semibold text-sm text-foreground truncate">
                                              {firstName}
                                            </span>
                                            {lastName && (
                                              <span className="font-semibold text-sm text-foreground truncate">
                                                {lastName}
                                              </span>
                                            )}
                                          </div>
                                          {user.id === currentUser?.id && (
                                            <Badge variant="secondary" className="text-xs shrink-0 bg-[#31C7AD]/10 border-[#31C7AD] text-[#31C7AD] h-5 px-1.5">
                                              You
                                            </Badge>
                                          )}
                                          {user.role === 'manager' && (
                                            <Badge className="text-xs shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 h-5 px-1.5">
                                              Manager
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Right: Scopes Count & Actions */}
                                    <div className="flex items-center gap-3 shrink-0">
                                      {/* Scopes Count - Clickable */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedUserForScopes(user);
                                          setScopesModalOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors group/scope"
                                      >
                                        <Layers className="h-4 w-4 text-muted-foreground group-hover/scope:text-[#31C7AD]" />
                                        <span className="text-sm font-medium text-foreground">
                                          {accessibleScopes.length}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {accessibleScopes.length === 1 ? 'scope' : 'scopes'}
                                        </span>
                                      </button>
                                      
                                      {/* Action Buttons */}
                                      {isManager && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditUser(user);
                                            }}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteUser(user.id);
                                            }}
                                            disabled={user.id === currentUser?.id}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                );
                              });
                              })()}
                            </div>
                          ) : (
                            <div className="rounded-lg border-2 border-dashed p-8 text-center">
                              <Users2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                No members in this team yet
                              </p>
                            </div>
                          )}
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
      </div>

      {/* User Modal */}
      {userModalOpen && (
        <UserModal
          open={userModalOpen}
          onOpenChange={setUserModalOpen}
          user={editingUser}
          teams={teams}
          defaultTeamId={selectedTeamForNewUser || undefined}
          onSave={() => {
            loadUsers();
            loadAvailableUsers();
            setUserModalOpen(false);
            setEditingUser(null);
            setSelectedTeamForNewUser(null);
          }}
        />
      )}

      {/* Team Modal */}
      {teamModalOpen && (
        <TeamModal
          open={teamModalOpen}
          onOpenChange={setTeamModalOpen}
          team={editingTeam}
          onSave={() => {
            loadTeams();
            setTeamModalOpen(false);
            setEditingTeam(null);
          }}
        />
      )}

      {/* User Scopes & Routines Modal */}
      {userScopesRoutinesModalOpen && selectedUserForScopesRoutines && (
        <UserScopesRoutinesModal
          open={userScopesRoutinesModalOpen}
          onOpenChange={setUserScopesRoutinesModalOpen}
          user={selectedUserForScopesRoutines}
          teams={teams}
          onSave={() => {
            loadUsers();
            loadTeams();
          }}
        />
      )}

      {/* User Scopes Display Modal */}
      {scopesModalOpen && selectedUserForScopes && (
        <Dialog open={scopesModalOpen} onOpenChange={setScopesModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#31C7AD]" />
                Scopes for {selectedUserForScopes.name}
              </DialogTitle>
              <DialogDescription>
                {(() => {
                  const userTeam = selectedUserForScopes.teamId ? teams.find(t => t.id === selectedUserForScopes.teamId) : null;
                  const allScopes = getScopes();
                  const individualScopeIds = selectedUserForScopes.assignedScopeIds || [];
                  const teamScopeIds = userTeam?.assignedScopeIds || [];
                  const accessibleScopeIds = [...new Set([...individualScopeIds, ...teamScopeIds])];
                  const accessibleScopes = allScopes.filter(s => accessibleScopeIds.includes(s.id));
                  return accessibleScopes.length === 0 ? 'No scopes assigned' : `${accessibleScopes.length} ${accessibleScopes.length === 1 ? 'scope' : 'scopes'} assigned`;
                })()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 py-2">
                {(() => {
                  const userTeam = selectedUserForScopes.teamId ? teams.find(t => t.id === selectedUserForScopes.teamId) : null;
                  const allScopes = getScopes();
                  const individualScopeIds = selectedUserForScopes.assignedScopeIds || [];
                  const teamScopeIds = userTeam?.assignedScopeIds || [];
                  const accessibleScopeIds = [...new Set([...individualScopeIds, ...teamScopeIds])];
                  const accessibleScopes = allScopes.filter(s => accessibleScopeIds.includes(s.id));
                  const individualScopes = allScopes.filter(s => individualScopeIds.includes(s.id));
                  const teamScopes = allScopes.filter(s => teamScopeIds.includes(s.id) && !individualScopeIds.includes(s.id));
                  
                  // Helper functions for filter display
                  const getFilterLabel = (filterId: string) => {
                    const def = filterDefinitions.find(f => f.id === filterId);
                    return def?.label || filterId;
                  };
                  
                  const getFilterDisplayText = (filter: ScopeFilter) => {
                    const def = filterDefinitions.find(f => f.id === filter.filterId);
                    const displayValues = getFilterDisplayValues(filter, def);
                    const condition = filter.condition || 'is';
                    
                    // Format condition for display
                    const conditionLabels: Record<string, string> = {
                      'is': 'is',
                      'equals': 'equals',
                      'contains': 'contains',
                      'greaterThan': '>',
                      'lessThan': '<',
                      'greaterThanOrEqual': '≥',
                      'lessThanOrEqual': '≤',
                      'notEquals': '≠',
                      'notContains': 'does not contain',
                    };
                    const conditionLabel = conditionLabels[condition] || condition;
                    
                    const valuesText = displayValues.length > 0 
                      ? displayValues.join(', ')
                      : filter.values.length > 0 
                        ? filter.values.join(', ')
                        : 'No values';
                    return `${conditionLabel} ${valuesText}`;
                  };
                  
                  const renderScopeCard = (scope: typeof allScopes[0], badgeType: 'Individual' | 'Team') => (
                    <div
                      key={scope.id}
                      className="p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm mb-1">{scope.name}</p>
                          {scope.description && (
                            <p className="text-xs text-muted-foreground mb-2">{scope.description}</p>
                          )}
                          {badgeType === 'Team' && userTeam && (
                            <p className="text-xs text-muted-foreground mb-2">From team: {userTeam.name}</p>
                          )}
                          {scope.filters && scope.filters.length > 0 && (
                            <div className="space-y-1.5 mt-2 pt-2 border-t border-border/50">
                              {scope.filters.map((filter) => (
                                <div
                                  key={filter.id}
                                  className="flex items-start gap-2 text-xs"
                                >
                                  <span className="font-medium text-muted-foreground min-w-[120px] shrink-0">
                                    {getFilterLabel(filter.filterId)}:
                                  </span>
                                  <span className="text-foreground break-words">
                                    {getFilterDisplayText(filter)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs shrink-0",
                            badgeType === 'Individual' 
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                              : "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
                          )}
                        >
                          {badgeType}
                        </Badge>
                      </div>
                    </div>
                  );
                  
                  if (accessibleScopes.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No scopes assigned to this user</p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {individualScopes.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Individual Scopes ({individualScopes.length})
                          </h4>
                          {individualScopes.map((scope) => renderScopeCard(scope, 'Individual'))}
                        </div>
                      )}
                      {teamScopes.length > 0 && (
                        <div className="space-y-2">
                          {individualScopes.length > 0 && <div className="h-4" />}
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Team Scopes ({teamScopes.length})
                          </h4>
                          {teamScopes.map((scope) => renderScopeCard(scope, 'Team'))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setScopesModalOpen(false);
                  setSelectedUserForScopes(null);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setScopesModalOpen(false);
                  setSelectedUserForScopes(null);
                  setSelectedUserForScopesRoutines(selectedUserForScopes);
                  setUserScopesRoutinesModalOpen(true);
                }}
                className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white"
              >
                Manage Scopes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// User Modal Component
interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  teams: Team[];
  defaultTeamId?: string;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ open, onOpenChange, user, teams, defaultTeamId, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'user'>('user');
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setTeamId(user.teamId || null);
    } else {
      setName('');
      setEmail('');
      setRole('user');
      setTeamId(defaultTeamId || null);
    }
  }, [user, open, defaultTeamId]);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      alert('Name and email are required');
      return;
    }

    if (user) {
      updateUser(user.id, { name: name.trim(), email: email.trim(), role, teamId });
    } else {
      createUser({ name: name.trim(), email: email.trim(), role, teamId });
    }
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {user ? 'Edit User' : 'Create New User'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {user ? 'Update user details' : 'Add a new user to the system'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="user-name" className="text-sm font-semibold">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter user name..."
              className="h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email" className="text-sm font-semibold">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user email..."
              className="h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-role" className="text-sm font-semibold">Role</Label>
            <Select value={role} onValueChange={(value: 'manager' | 'user') => setRole(value)}>
              <SelectTrigger id="user-role" className="h-10 border-border/60 hover:border-[#2063F0]/30 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-team" className="text-sm font-semibold">
              Team <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select 
              value={teamId || 'none'} 
              onValueChange={(value) => setTeamId(value === 'none' ? null : value)}
            >
              <SelectTrigger id="user-team" className="h-10 border-border/60 hover:border-[#2063F0]/30 transition-colors">
                <SelectValue placeholder="No team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No team</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="border-border/60 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !email.trim()}
            className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {user ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Team Modal Component
interface TeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
  onSave: () => void;
}

const TeamModal: React.FC<TeamModalProps> = ({ open, onOpenChange, team, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [team, open]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Team name is required');
      return;
    }

    if (team) {
      updateTeam(team.id, { name: name.trim(), description: description.trim() || undefined });
    } else {
      createTeam({ name: name.trim(), description: description.trim() || undefined });
    }
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {team ? 'Edit Team' : 'Create New Team'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {team ? 'Update team details' : 'Create a new team'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="team-name" className="text-sm font-semibold">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name..."
              className="h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-description" className="text-sm font-semibold">
              Description <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description..."
              rows={3}
              className="border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="border-border/60 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {team ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

