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
import { getRoutines } from '@/lib/routines';
import { getScopes } from '@/lib/scopes';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Menu,
  Building2,
  Users2,
  Shield,
  Layers,
  FolderKanban,
  Sparkles,
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
  const currentUser = getCurrentUser();
  const isManager = currentUser?.role === 'manager';

  useEffect(() => {
    loadUsers();
    loadTeams();
  }, []);

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
    }
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
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Main Header with Gradient */}
        <div className="relative border-b bg-background">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/5 via-[#2063F0]/5 to-transparent pointer-events-none" />
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
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-sm">
                  <img 
                    src="/images/Pelico-small-logo.svg" 
                    alt="Pelico" 
                    className="w-5 h-5 shrink-0 brightness-0 invert"
                  />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Teams & members</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl">
            {/* Teams Section */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 border border-[#31C7AD]/20">
                    <Building2 className="h-5 w-5 text-[#31C7AD]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Teams</h2>
                    <p className="text-sm text-muted-foreground">
                      {sortedTeams.length} {sortedTeams.length === 1 ? 'team' : 'teams'} • {users.length} {users.length === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>
                {isManager && sortedTeams.length > 0 && (
                  <Button
                    onClick={handleCreateTeam}
                    className="gap-2 h-9 bg-gradient-to-r from-[#31C7AD] to-[#2063F0] hover:from-[#2ab89a] hover:to-[#1a54d8] text-white shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Create Team
                  </Button>
                )}
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
                      onClick={handleCreateTeam}
                      className="gap-2 h-9 bg-gradient-to-r from-[#31C7AD] to-[#2063F0] hover:from-[#2ab89a] hover:to-[#1a54d8] text-white shadow-md"
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
                          "group border rounded-xl overflow-hidden transition-all",
                          isAdminTeam 
                            ? "bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-800" 
                            : "bg-background hover:shadow-lg hover:border-[#31C7AD]/30"
                        )}
                      >
                        {/* Team Header */}
                        <div className={cn(
                          "px-5 py-4 border-b",
                          isAdminTeam ? "bg-purple-50/50 dark:bg-purple-950/20" : "bg-muted/30"
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
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {teamUsers.length} {teamUsers.length === 1 ? 'member' : 'members'}
                                  </Badge>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateUser(team.id)}
                              className="gap-2 mb-3"
                            >
                              <Plus className="h-4 w-4" />
                              Add Member
                            </Button>
                          )}
                          {teamUsers.length > 0 ? (
                            <div className="space-y-3">
                              {teamUsers.map((user) => {
                                // Get user's team
                                const userTeam = user.teamId ? teams.find(t => t.id === user.teamId) : null;
                                
                                // Get scopes accessible to user (individual + team)
                                const allScopes = getScopes();
                                const individualScopeIds = user.assignedScopeIds || [];
                                const teamScopeIds = userTeam?.assignedScopeIds || [];
                                const accessibleScopeIds = [...new Set([...individualScopeIds, ...teamScopeIds])];
                                const accessibleScopes = allScopes.filter(s => accessibleScopeIds.includes(s.id));
                                
                                // Get routines accessible to user (individual + team)
                                const allRoutines = getRoutines();
                                const individualRoutineIds = user.assignedRoutineIds || [];
                                const teamRoutineIds = userTeam?.assignedRoutineIds || [];
                                const accessibleRoutineIds = [...new Set([...individualRoutineIds, ...teamRoutineIds])];
                                const accessibleRoutines = allRoutines.filter(r => {
                                  const routineTeamIds = r.teamIds || (r.teamId ? [r.teamId] : []);
                                  return accessibleRoutineIds.includes(r.id) || 
                                         (userTeam && routineTeamIds.includes(userTeam.id));
                                });
                                
                                return (
                                <div
                                  key={user.id}
                                  className={cn(
                                    'rounded-lg p-4 transition-all bg-muted/30 hover:bg-muted/50 cursor-pointer border border-transparent hover:border-[#31C7AD]/20',
                                    user.id === currentUser?.id && 'ring-2 ring-[#31C7AD] ring-offset-2'
                                  )}
                                  onClick={() => {
                                    setSelectedUserForScopesRoutines(user);
                                    setUserScopesRoutinesModalOpen(true);
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-sm truncate">{user.name}</h4>
                                        {user.id === currentUser?.id && (
                                          <Badge variant="outline" className="text-xs shrink-0 bg-[#31C7AD]/10 border-[#31C7AD] text-[#31C7AD]">
                                            You
                                          </Badge>
                                        )}
                                        {user.role === 'manager' && (
                                          <Badge className="text-xs shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                            Manager
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate mb-3">{user.email}</p>
                                      
                                      {/* Scopes and Routines Sections - Horizontal Layout */}
                                      <div className="grid grid-cols-2 gap-4">
                                        {/* Scopes Section */}
                                        <div className="flex flex-col gap-2">
                                          <div className="flex items-center gap-1.5">
                                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                            <p className="text-xs font-medium text-muted-foreground">Scopes</p>
                                          </div>
                                          {accessibleScopes.length > 0 ? (
                                            <div className="flex flex-wrap items-center gap-1">
                                              {accessibleScopes.slice(0, 2).map((scope) => (
                                                <Badge 
                                                  key={scope.id}
                                                  variant="secondary" 
                                                  className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                                                  title={scope.name}
                                                >
                                                  {scope.name.length > 10 ? `${scope.name.substring(0, 10)}...` : scope.name}
                                                </Badge>
                                              ))}
                                              {accessibleScopes.length > 2 && (
                                                <Badge variant="outline" className="text-xs">
                                                  +{accessibleScopes.length - 2}
                                                </Badge>
                                              )}
                                            </div>
                                          ) : (
                                            <Button
                                              variant="default"
                                              size="sm"
                                              className="h-7 px-2 text-xs w-fit"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedUserForScopesRoutines(user);
                                                setUserScopesRoutinesModalOpen(true);
                                              }}
                                            >
                                              <Plus className="h-3 w-3 mr-1" />
                                              Add
                                            </Button>
                                          )}
                                        </div>
                                        
                                        {/* Routines Section */}
                                        <div className="flex flex-col gap-2">
                                          <div className="flex items-center gap-1.5">
                                            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                                            <p className="text-xs font-medium text-muted-foreground">Routines</p>
                                          </div>
                                          {accessibleRoutines.length > 0 ? (
                                            <div className="flex flex-wrap items-center gap-1">
                                              {accessibleRoutines.slice(0, 2).map((routine) => (
                                                <Badge 
                                                  key={routine.id}
                                                  variant="secondary" 
                                                  className="text-xs bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300"
                                                  title={routine.name}
                                                >
                                                  {routine.name.length > 10 ? `${routine.name.substring(0, 10)}...` : routine.name}
                                                </Badge>
                                              ))}
                                              {accessibleRoutines.length > 2 && (
                                                <Badge variant="outline" className="text-xs">
                                                  +{accessibleRoutines.length - 2}
                                                </Badge>
                                              )}
                                            </div>
                                          ) : (
                                            <Button
                                              variant="default"
                                              size="sm"
                                              className="h-7 px-2 text-xs w-fit"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedUserForScopesRoutines(user);
                                                setUserScopesRoutinesModalOpen(true);
                                              }}
                                            >
                                              <Plus className="h-3 w-3 mr-1" />
                                              Add
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {isManager && (
                                      <div className="flex items-center gap-1 ml-3 shrink-0">
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
                                );
                              })}
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
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
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
              value={teamId || ''} 
              onValueChange={(value) => setTeamId(value || null)}
            >
              <SelectTrigger id="user-team" className="h-10 border-border/60 hover:border-[#2063F0]/30 transition-colors">
                <SelectValue placeholder="No team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No team</SelectItem>
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
            variant="outline"
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
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
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
            variant="outline"
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

