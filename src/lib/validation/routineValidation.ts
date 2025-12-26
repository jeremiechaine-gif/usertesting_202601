/**
 * Routine validation utilities
 * Provides validation functions for routine data
 */

import type { Routine } from '@/lib/routines';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate routine name
 */
export function validateRoutineName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Routine name is required');
    return { isValid: false, errors };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    errors.push('Routine name cannot be empty');
  } else if (trimmed.length > 100) {
    errors.push('Routine name must be 100 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate routine description
 */
export function validateRoutineDescription(description: string | undefined): ValidationResult {
  const errors: string[] = [];

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else if (description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate scope mode and linked scope
 */
export function validateScopeMode(
  scopeMode: 'scope-aware' | 'scope-fixed',
  linkedScopeId: string | null | undefined
): ValidationResult {
  const errors: string[] = [];

  if (scopeMode === 'scope-fixed' && !linkedScopeId) {
    errors.push('A scope must be selected for scope-fixed routines');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete routine data
 */
export function validateRoutine(routine: Partial<Routine>): ValidationResult {
  const errors: string[] = [];

  // Validate name
  if (routine.name !== undefined) {
    const nameValidation = validateRoutineName(routine.name);
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }
  }

  // Validate description
  if (routine.description !== undefined) {
    const descValidation = validateRoutineDescription(routine.description);
    if (!descValidation.isValid) {
      errors.push(...descValidation.errors);
    }
  }

  // Validate scope mode
  if (routine.scopeMode !== undefined) {
    const scopeModeValidation = validateScopeMode(routine.scopeMode, routine.linkedScopeId);
    if (!scopeModeValidation.isValid) {
      errors.push(...scopeModeValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}






