/**
 * Team management utilities
 * Handles localStorage persistence for teams
 */

export interface Team {
  id: string;
  name: string;
  description?: string;
  assignedScopeIds?: string[]; // Scopes assignés à l'équipe (hérités par les membres)
  assignedRoutineIds?: string[]; // Routines assignées à l'équipe (héritées par les membres)
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pelico-teams';

export const getTeams = (): Team[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveTeams = (teams: Team[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  } catch (error) {
    console.error('Failed to save teams:', error);
  }
};

export const getTeam = (id: string): Team | null => {
  const teams = getTeams();
  return teams.find(t => t.id === id) || null;
};

export const createTeam = (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Team => {
  const teams = getTeams();
  const newTeam: Team = {
    ...team,
    id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  teams.push(newTeam);
  saveTeams(teams);
  return newTeam;
};

export const updateTeam = (id: string, updates: Partial<Omit<Team, 'id' | 'createdAt'>>): Team | null => {
  const teams = getTeams();
  const index = teams.findIndex((t) => t.id === id);
  if (index === -1) return null;
  
  teams[index] = {
    ...teams[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveTeams(teams);
  return teams[index];
};

export const deleteTeam = (id: string): boolean => {
  const teams = getTeams();
  const filtered = teams.filter((t) => t.id !== id);
  if (filtered.length === teams.length) return false;
  saveTeams(filtered);
  return true;
};

export const getTeamByName = (name: string): Team | null => {
  const teams = getTeams();
  return teams.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
};

