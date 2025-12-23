/**
 * Reset data utilities for prototype
 * Allows resetting scopes and routines while keeping users and teams
 */

const SCOPES_STORAGE_KEY = 'pelico-scopes';
const ROUTINES_STORAGE_KEY = 'pelico-routines';
const FOLDERS_STORAGE_KEY = 'pelico-routine-folders';
const ONBOARDING_TASKS_STORAGE_KEY = 'pelico-onboarding-tasks-status';

/**
 * Reset scopes and routines data
 * Keeps users and teams data intact
 */
export function resetScopesAndRoutines(): void {
  try {
    // Remove scopes
    localStorage.removeItem(SCOPES_STORAGE_KEY);
    
    // Remove routines
    localStorage.removeItem(ROUTINES_STORAGE_KEY);
    
    // Remove routine folders
    localStorage.removeItem(FOLDERS_STORAGE_KEY);
    
    // Reset onboarding tasks status (optional, but makes sense for a reset)
    localStorage.removeItem(ONBOARDING_TASKS_STORAGE_KEY);
    
    console.log('Scopes and routines have been reset');
  } catch (error) {
    console.error('Error resetting scopes and routines:', error);
    throw error;
  }
}



