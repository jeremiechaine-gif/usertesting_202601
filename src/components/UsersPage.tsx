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

export const UsersPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
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
            <div className="flex items-center justify-between mb-4">
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
                <img 
                  src="/images/Pelico-small-logo.svg" 
                  alt="Pelico" 
                  className="w-6 h-6 shrink-0"
                />
                <h1 className="text-2xl font-bold tracking-tight">Teams & members</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl">
            {/* Teams Section */}
            <div className="flex flex-col min-w-0">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Teams</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Organize users into teams to share routines and collaborate.
                </p>
                {isManager && sortedTeams.length > 0 && (
                  <Button variant="outline" onClick={handleCreateTeam} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Team
                  </Button>
                )}
              </div>

              {sortedTeams.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first team to organize users
                  </p>
                  {isManager && (
                    <Button variant="outline" onClick={handleCreateTeam} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Team
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {sortedTeams.map((team) => {
                    const teamUsers = users.filter(u => u.teamId === team.id);
                    return (
                      <div
                        key={team.id}
                        className="group border rounded-lg p-4 hover:shadow-md transition-shadow bg-background"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{team.name}</h3>
                            {team.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {team.description}
                              </p>
                            )}
                          </div>
                          {isManager && (
                            <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditTeam(team)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteTeam(team.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Team Members */}
                        {isManager && (
                          <div className="mt-3 mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateUser(team.id)}
                              className="gap-2 h-8 text-xs"
                            >
                              <Plus className="h-3 w-3" />
                              Add User
                            </Button>
                          </div>
                        )}
                        {teamUsers.length > 0 ? (
                          <div className="mt-3 space-y-2">
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
                              const accessibleRoutines = allRoutines.filter(r => 
                                accessibleRoutineIds.includes(r.id) || r.teamId === userTeam?.id
                              );
                              
                              return (
                              <div
                                key={user.id}
                                className={cn(
                                  'rounded-lg p-3 hover:shadow-sm transition-shadow bg-muted/50 cursor-pointer',
                                  user.id === currentUser?.id && 'ring-1 ring-[#2063F0]'
                                )}
                                onClick={() => {
                                  setSelectedUserForScopesRoutines(user);
                                  setUserScopesRoutinesModalOpen(true);
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-sm truncate">{user.name}</h4>
                                      {user.id === currentUser?.id && (
                                        <Badge variant="outline" className="text-xs shrink-0">
                                          You
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    {user.role === 'manager' && (
                                      <Badge 
                                        variant="default" 
                                        className="text-xs mt-1"
                                      >
                                        Manager
                                      </Badge>
                                    )}
                                    
                                    {/* Scopes and Routines Sections - Horizontal Layout */}
                                    <div className="flex items-start gap-4 mt-2">
                                      {/* Scopes Section */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Scopes</p>
                                        {accessibleScopes.length > 0 ? (
                                          <div className="flex flex-wrap items-center gap-1">
                                            {accessibleScopes.slice(0, 2).map((scope) => (
                                              <Badge 
                                                key={scope.id}
                                                variant="secondary" 
                                                className="text-xs"
                                                title={scope.name}
                                              >
                                                {scope.name.length > 12 ? `${scope.name.substring(0, 12)}...` : scope.name}
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
                                            className="h-6 px-2 text-xs"
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
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Routines</p>
                                        {accessibleRoutines.length > 0 ? (
                                          <div className="flex flex-wrap items-center gap-1">
                                            {accessibleRoutines.slice(0, 2).map((routine) => (
                                              <Badge 
                                                key={routine.id}
                                                variant="secondary" 
                                                className="text-xs"
                                                title={routine.name}
                                              >
                                                {routine.name.length > 12 ? `${routine.name.substring(0, 12)}...` : routine.name}
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
                                            className="h-6 px-2 text-xs"
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
                                    <div className="flex items-center gap-1 ml-2 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditUser(user);
                                        }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteUser(user.id);
                                        }}
                                        disabled={user.id === currentUser?.id}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-muted-foreground text-center py-2">
                            No members in this team
                          </div>
                        )}
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update user details' : 'Add a new user to the system'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter user name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-role">Role</Label>
            <Select value={role} onValueChange={(value: 'manager' | 'user') => setRole(value)}>
              <SelectTrigger id="user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-team">Team (optional)</Label>
            <Select 
              value={teamId || ''} 
              onValueChange={(value) => setTeamId(value || null)}
            >
              <SelectTrigger id="user-team">
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{team ? 'Edit Team' : 'Create New Team'}</DialogTitle>
          <DialogDescription>
            {team ? 'Update team details' : 'Create a new team'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-description">Description (optional)</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {team ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

