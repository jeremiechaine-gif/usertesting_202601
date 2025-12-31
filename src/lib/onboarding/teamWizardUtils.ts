/**
 * Utilities for Team Wizard
 * Helper functions for managing teams, members, routines, and scopes
 */

import { getRoutines } from '../routines';
import { getCurrentUserId } from '../users';
import { ROUTINE_LIBRARY } from './routineLibrary';
import type { Persona } from './types';
import { getTeamByName, getTeam, type Team } from '../teams';
import { createUser, getUsers, type User } from '../users';
import { getScopes, type Scope } from '../scopes';

/**
 * Mapping from French Role profile names (used in UI) to English Role profile names (used in types)
 */
const PERSONA_FR_TO_EN: Record<string, Persona> = {
  'Approvisionneur': 'Supply Planner',
  'Acheteur': 'Buyer',
  'Manager Appro': 'Procurement Manager',
  'Ordonnanceur Assemblage': 'Assembly Scheduler',
  'Ordonnanceur': 'Scheduler',
  'Master Planner': 'Master Planner',
  'Support Logistique': 'Logistics Support',
  'Recette': 'Quality Control',
  'Responsable Supply Chain': 'Supply Chain Manager',
  'Directeur Supply Chain': 'Supply Chain Director',
  'Responsable Ordo & Support log': 'Scheduling & Logistics Manager',
  'Autre / Mixte': 'Other / Mixed',
};

/**
 * Get Role profiles selected in the "Create Routine" wizard
 * Returns Role profiles from localStorage if available, otherwise empty array
 * Converts French Role profile names to English Role profile names
 * 
 * Checks two locations:
 * 1. Current onboarding state (if wizard is still open)
 * 2. Saved Role profiles for Team Wizard (if wizard was completed)
 */
export const getPersonasFromRoutineWizard = (): Persona[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    // First, try to get from current onboarding state (if wizard is still open)
    const stored = localStorage.getItem('pelico-onboarding-state');
    if (stored) {
      const state = JSON.parse(stored);
      // Return Role profiles if they were selected (not from "Complete List")
      if (state.selectedPersonas && Array.isArray(state.selectedPersonas) && state.selectedPersonas.length > 0) {
        // Convert French Role profile names to English Role profile names
        const englishPersonas = state.selectedPersonas
          .map((persona: string) => {
            // Check if it's already in English (valid Role profile)
            if (Object.values(PERSONA_FR_TO_EN).includes(persona as Persona)) {
              return persona as Persona;
            }
            // Convert from French to English
            return PERSONA_FR_TO_EN[persona];
          })
          .filter((persona: Persona | undefined): persona is Persona => {
            // Filter out undefined values and keep only valid Role profiles
            return persona !== undefined && Object.values(PERSONA_FR_TO_EN).includes(persona);
          });
        
        console.log('[getPersonasFromRoutineWizard] From current state - French Role profiles:', state.selectedPersonas);
        console.log('[getPersonasFromRoutineWizard] From current state - English Role profiles:', englishPersonas);
        
        if (englishPersonas.length > 0) {
          return englishPersonas;
        }
      }
    }
    
    // If not found in current state, try to get from saved Role profiles for Team Wizard
    const savedPersonas = localStorage.getItem('pelico-team-wizard-personas');
    if (savedPersonas) {
      const teamWizardState = JSON.parse(savedPersonas);
      if (teamWizardState.selectedPersonas && Array.isArray(teamWizardState.selectedPersonas) && teamWizardState.selectedPersonas.length > 0) {
        // Convert French Role profile names to English Role profile names
        const englishPersonas = teamWizardState.selectedPersonas
          .map((persona: string) => {
            // Check if it's already in English (valid Role profile)
            if (Object.values(PERSONA_FR_TO_EN).includes(persona as Persona)) {
              return persona as Persona;
            }
            // Convert from French to English
            return PERSONA_FR_TO_EN[persona];
          })
          .filter((persona: Persona | undefined): persona is Persona => {
            // Filter out undefined values and keep only valid Role profiles
            return persona !== undefined && Object.values(PERSONA_FR_TO_EN).includes(persona);
          });
        
        console.log('[getPersonasFromRoutineWizard] From saved state - French Role profiles:', teamWizardState.selectedPersonas);
        console.log('[getPersonasFromRoutineWizard] From saved state - English Role profiles:', englishPersonas);
        
        if (englishPersonas.length > 0) {
          return englishPersonas;
        }
      }
    }
  } catch (error) {
    // Invalid stored state, return empty
    console.error('[getPersonasFromRoutineWizard] Error:', error);
  }
  
  return [];
};

/**
 * Check if user selected "Complete List" in the "Create Routine" wizard
 * Checks both current state and saved state
 */
export const wasCompleteListSelected = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // First check current onboarding state
    const stored = localStorage.getItem('pelico-onboarding-state');
    if (stored) {
      const state = JSON.parse(stored);
      if (state.searchType === 'complete') {
        return true;
      }
    }
    
    // If not found, check saved state for Team Wizard
    const savedPersonas = localStorage.getItem('pelico-team-wizard-personas');
    if (savedPersonas) {
      const teamWizardState = JSON.parse(savedPersonas);
      if (teamWizardState.searchType === 'complete') {
        return true;
      }
    }
  } catch {
    // Invalid stored state
  }
  
  return false;
};

/**
 * Get unique Role profiles from routines created by current user
 * Fallback method if Role profiles weren't stored directly
 */
export const getPersonasFromCreatedRoutines = (): Persona[] => {
  const routines = getRoutines();
  const currentUserId = getCurrentUserId();
  
  // Filter routines created by current user (recently created, likely from onboarding)
  const userRoutines = routines.filter(r => r.createdBy === currentUserId);
  
  const personasSet = new Set<Persona>();
  
  for (const routine of userRoutines) {
    // Try to find the routine in the library to get its Role profiles
    // We need to match by name since routine IDs are different
    const libraryRoutine = ROUTINE_LIBRARY.find(
      (lr: any) => lr.label === routine.name
    );
    
    if (libraryRoutine && libraryRoutine.personas) {
      libraryRoutine.personas.forEach((persona: Persona) => personasSet.add(persona));
    }
  }
  
  return Array.from(personasSet);
};

/**
 * Get routines created by current user (likely from onboarding)
 */
export const getCreatedRoutines = () => {
  const routines = getRoutines();
  const currentUserId = getCurrentUserId();
  return routines.filter(r => r.createdBy === currentUserId);
};

/**
 * Get suggested routines for a Role profile
 */
export const getSuggestedRoutinesForPersona = (persona: Persona): string[] => {
  const routines = getCreatedRoutines();
  const routineIds: string[] = [];
  
  for (const routine of routines) {
    const libraryRoutine = ROUTINE_LIBRARY.find(
      (lr: any) => lr.label === routine.name
    );
    
    if (libraryRoutine && libraryRoutine.personas && libraryRoutine.personas.includes(persona)) {
      routineIds.push(routine.id);
    }
  }
  
  return routineIds;
};

/**
 * Check if team name already exists
 */
export const checkTeamNameExists = (name: string, excludeId?: string): boolean => {
  const existingTeam = getTeamByName(name);
  if (!existingTeam) return false;
  if (excludeId && existingTeam.id === excludeId) return false;
  return true;
};

/**
 * Create mock users for teams
 * Creates 5 mock users per team if they don't exist
 * Returns all available users (existing + newly created)
 */
export const createMockUsersForTeams = (teamNames: string[]): User[] => {
  const existingUsers = getUsers();
  const allUsers = [...existingUsers];
  const createdUsers: User[] = [];
  
  const mockNames = [
    { name: 'John', surname: 'Doe' },
    { name: 'Jane', surname: 'Smith' },
    { name: 'Michael', surname: 'Johnson' },
    { name: 'Emily', surname: 'Williams' },
    { name: 'David', surname: 'Brown' },
  ];
  
  for (const teamName of teamNames) {
    for (let i = 0; i < mockNames.length; i++) {
      const { name, surname } = mockNames[i];
      const teamSlug = teamName.toLowerCase().replace(/\s+/g, '').replace(/team$/i, '');
      const email = `${name.toLowerCase()}.${surname.toLowerCase()}@${teamSlug}.com`;
      const fullName = `${name} ${surname}`;
      
      // Check if user already exists by email
      const existingUser = allUsers.find(u => u.email === email);
      if (!existingUser) {
        const newUser = createUser({
          name: fullName,
          email: email,
          role: 'user',
          teamId: null,
          assignedScopeIds: [],
          assignedRoutineIds: [],
        });
        createdUsers.push(newUser);
        allUsers.push(newUser);
      }
    }
  }
  
  // Return all users (existing + newly created), excluding admin
  const adminId = getCurrentUserId();
  return allUsers.filter(u => u.id !== adminId);
};

/**
 * Get available scopes for assignment
 * Returns global scopes + scopes of current user
 */
export const getAvailableScopes = (): Scope[] => {
  const scopes = getScopes();
  const currentUserId = getCurrentUserId();
  
  // In the wizard context, show templates only (not instances)
  // Templates are global scopes (isGlobal === true) without templateId
  // For backward compatibility, include scopes without isGlobal/userId/templateId set
  return scopes.filter(
    scope => !scope.templateId && ( // Only templates, not instances
      scope.isGlobal === true || 
      scope.userId === currentUserId ||
      (scope.isGlobal === undefined && scope.userId === undefined && scope.templateId === undefined) // Backward compatibility
    )
  );
};

/**
 * Get member scopes (union of team scopes and individual scopes)
 */
export const getMemberScopes = (userId: string, teamId: string | null): Scope[] => {
  const user = getUsers().find(u => u.id === userId);
  const scopes = getScopes();
  
  const teamScopes: Scope[] = [];
  if (teamId) {
    const team = getTeam(teamId);
    if (team && team.assignedScopeIds) {
      team.assignedScopeIds.forEach(scopeId => {
        const scope = scopes.find(s => s.id === scopeId);
        if (scope) teamScopes.push(scope);
      });
    }
  }
  
  const userScopes: Scope[] = [];
  if (user && user.assignedScopeIds) {
    user.assignedScopeIds.forEach(scopeId => {
      const scope = scopes.find(s => s.id === scopeId);
      if (scope) userScopes.push(scope);
    });
  }
  
  // Union: combine team and user scopes, remove duplicates
  const allScopes = [...teamScopes, ...userScopes];
  const uniqueScopes = allScopes.filter((scope, index, self) =>
    index === self.findIndex(s => s.id === scope.id)
  );
  
  return uniqueScopes;
};

