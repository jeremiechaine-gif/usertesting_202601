/**
 * User management utilities
 * Handles localStorage persistence for users
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'user';
  teamId?: string | null;
  assignedScopeIds?: string[]; // Scopes assignés individuellement à l'utilisateur
  assignedRoutineIds?: string[]; // Routines assignées individuellement à l'utilisateur
  defaultScopeId?: string | null; // Scope par défaut principal pour l'utilisateur
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pelico-users';
const CURRENT_USER_KEY = 'pelico-current-user-id';

// Mock current user ID (in a real app, this would come from auth)
const MOCK_CURRENT_USER_ID = 'user-admin-pelico';

export const getCurrentUserId = (): string => {
  if (typeof window === 'undefined') return MOCK_CURRENT_USER_ID;
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored || MOCK_CURRENT_USER_ID;
  } catch {
    return MOCK_CURRENT_USER_ID;
  }
};

export const setCurrentUserId = (userId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } catch (error) {
    console.error('Failed to save current user ID:', error);
  }
};

export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with default admin user
    const defaultUser: User = {
      id: MOCK_CURRENT_USER_ID,
      name: 'Admin Pelico',
      email: 'admin@pelico.com',
      role: 'manager',
      teamId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveUsers([defaultUser]);
    return [defaultUser];
  } catch {
    return [];
  }
};

export const saveUsers = (users: User[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users:', error);
  }
};

export const getCurrentUser = (): User | null => {
  const userId = getCurrentUserId();
  const users = getUsers();
  return users.find(u => u.id === userId) || null;
};

export const getUser = (id: string): User | null => {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};

export const createUser = (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

export const updateUser = (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null => {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveUsers(users);
  return users[index];
};

export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
};

export const getUsersByTeam = (teamId: string): User[] => {
  const users = getUsers();
  return users.filter(u => u.teamId === teamId);
};

