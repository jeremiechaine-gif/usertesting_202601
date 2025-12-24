/**
 * Reset data utilities for prototype
 * Resets all onboarding data
 */

const SCOPES_STORAGE_KEY = 'pelico-scopes';
const ROUTINES_STORAGE_KEY = 'pelico-routines';
const FOLDERS_STORAGE_KEY = 'pelico-routine-folders';
const ONBOARDING_TASKS_STORAGE_KEY = 'pelico-onboarding-tasks-status';
const ONBOARDING_STATE_KEY = 'pelico-onboarding-state';
const TEAM_WIZARD_PERSONAS_KEY = 'pelico-team-wizard-personas';
const TEAMS_STORAGE_KEY = 'pelico-teams';

/**
 * Reset all onboarding data
 * Resets scopes, routines, teams, and all onboarding progress
 * Note: Users are preserved as they may exist outside onboarding
 */
export function resetScopesAndRoutines(): void {
  try {
    // Remove scopes
    localStorage.removeItem(SCOPES_STORAGE_KEY);
    
    // Remove routines
    localStorage.removeItem(ROUTINES_STORAGE_KEY);
    
    // Remove routine folders
    localStorage.removeItem(FOLDERS_STORAGE_KEY);
    
    // Remove teams created during onboarding
    localStorage.removeItem(TEAMS_STORAGE_KEY);
    
    // Reset onboarding tasks status
    localStorage.removeItem(ONBOARDING_TASKS_STORAGE_KEY);
    
    // Reset onboarding wizard state
    localStorage.removeItem(ONBOARDING_STATE_KEY);
    
    // Reset team wizard personas
    localStorage.removeItem(TEAM_WIZARD_PERSONAS_KEY);
    
    // Reset user assignments (scopes and routines assigned during onboarding)
    // Note: We preserve users but reset their assignments
    const users = JSON.parse(localStorage.getItem('pelico-users') || '[]');
    const resetUsers = users.map((user: any) => ({
      ...user,
      assignedScopeIds: [],
      assignedRoutineIds: [],
      defaultScopeId: null,
      teamId: null,
    }));
    localStorage.setItem('pelico-users', JSON.stringify(resetUsers));
    
    console.log('All onboarding data has been reset');
  } catch (error) {
    console.error('Error resetting onboarding data:', error);
    throw error;
  }
}





