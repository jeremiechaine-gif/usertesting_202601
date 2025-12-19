/**
 * Scope validation utilities
 * Provides validation functions for scope data
 */

import type { Scope, ScopeFilter } from '@/lib/scopes';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate scope name
 */
export function validateScopeName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Scope name is required');
    return { isValid: false, errors };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    errors.push('Scope name cannot be empty');
  } else if (trimmed.length > 100) {
    errors.push('Scope name must be 100 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate scope description
 */
export function validateScopeDescription(description: string | undefined): ValidationResult {
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
 * Validate scope filter
 */
export function validateScopeFilter(filter: ScopeFilter): ValidationResult {
  const errors: string[] = [];

  if (!filter.filterId || typeof filter.filterId !== 'string') {
    errors.push('Filter ID is required');
  }

  if (!Array.isArray(filter.values)) {
    errors.push('Filter values must be an array');
  } else if (filter.values.length === 0) {
    errors.push('Filter must have at least one value');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete scope data
 */
export function validateScope(scope: Partial<Scope>): ValidationResult {
  const errors: string[] = [];

  // Validate name
  if (scope.name !== undefined) {
    const nameValidation = validateScopeName(scope.name);
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }
  }

  // Validate description
  if (scope.description !== undefined) {
    const descValidation = validateScopeDescription(scope.description);
    if (!descValidation.isValid) {
      errors.push(...descValidation.errors);
    }
  }

  // Validate filters
  if (scope.filters !== undefined) {
    if (!Array.isArray(scope.filters)) {
      errors.push('Filters must be an array');
    } else {
      scope.filters.forEach((filter, index) => {
        const filterValidation = validateScopeFilter(filter);
        if (!filterValidation.isValid) {
          errors.push(`Filter ${index + 1}: ${filterValidation.errors.join(', ')}`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

