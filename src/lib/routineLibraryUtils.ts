/**
 * Routine Library Utilities
 * Functions to apply generic routines from the library
 */

import type { RoutineLibraryEntry, RoutineFilter } from './onboarding/types';
import type { ColumnFiltersState } from '@tanstack/react-table';
import { createRoutine, type PelicoViewPage } from './routines';
import { getCurrentUserId } from './users';

/**
 * Convert date expression to actual date
 * Supports: "1 week ago", "today", "1 month ago", etc.
 */
function parseDateExpression(expression: string): Date | null {
  const today = new Date();
  const lowerExpr = expression.toLowerCase().trim();
  
  if (lowerExpr === 'today') {
    return today;
  }
  
  const match = lowerExpr.match(/(\d+)\s*(week|month|day|year)s?\s*ago/);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const date = new Date(today);
    
    switch (unit) {
      case 'day':
        date.setDate(date.getDate() - amount);
        break;
      case 'week':
        date.setDate(date.getDate() - (amount * 7));
        break;
      case 'month':
        date.setMonth(date.getMonth() - amount);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - amount);
        break;
    }
    
    return date;
  }
  
  return null;
}

/**
 * Convert RoutineFilter to ColumnFiltersState format
 */
function convertRoutineFilterToColumnFilter(filter: RoutineFilter): { id: string; value: any } | null {
  const { columnId, condition, values, dateExpression } = filter;
  
  // Handle date expressions
  if (dateExpression) {
    const dateValue = parseDateExpression(dateExpression);
    if (!dateValue) return null;
    
    // For date comparisons, use condition with date value
    return {
      id: columnId,
      value: {
        condition: condition || 'lessThan',
        date: dateValue.toISOString().split('T')[0], // YYYY-MM-DD format
      },
    };
  }
  
  // Handle regular filters
  if (condition && condition !== 'is') {
    return {
      id: columnId,
      value: {
        condition,
        values,
      },
    };
  }
  
  // Default: simple array of values
  return {
    id: columnId,
    value: values.length === 1 ? values[0] : values,
  };
}

/**
 * Apply a generic routine from the library
 * Creates a user routine from the library entry and applies it
 */
export function applyGenericRoutine(
  libraryEntry: RoutineLibraryEntry,
  onNavigate?: (page: string) => void
): string | null {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    console.error('No current user found');
    return null;
  }
  
  // Convert library filters to ColumnFiltersState
  const filters: ColumnFiltersState = [];
  if (libraryEntry.filters) {
    libraryEntry.filters.forEach(filter => {
      const columnFilter = convertRoutineFilterToColumnFilter(filter);
      if (columnFilter) {
        filters.push(columnFilter);
      }
    });
  }
  
  // Create a routine from the library entry
  const routine = createRoutine({
    name: libraryEntry.label,
    description: libraryEntry.description,
    filters,
    sorting: [],
    columnVisibility: libraryEntry.requiredColumns?.reduce((acc, colId) => {
      acc[colId] = true;
      return acc;
    }, {} as Record<string, boolean>),
    scopeMode: 'scope-aware',
    pelicoView: mapPelicoViewToPage(libraryEntry.primaryPelicoView),
    createdBy: currentUserId,
    teamIds: [],
  });
  
  // Navigate to the Pelico view
  if (onNavigate) {
    const viewMap: Record<string, string> = {
      'Supply': 'supply',
      'Production Control': 'production',
      'Customer Support': 'customer',
      'Escalation Room': 'escalation',
      'Value Engineering': 'value-engineering',
      'Event Explorer': 'event-explorer',
      'Simulation': 'simulation',
    };
    
    const page = viewMap[libraryEntry.primaryPelicoView] || 'supply';
    onNavigate(page);
  }
  
  return routine.id;
}

/**
 * Map PelicoView to PelicoViewPage
 */
function mapPelicoViewToPage(view: string): PelicoViewPage {
  const viewMap: Record<string, PelicoViewPage> = {
    'Supply': 'supply',
    'Production Control': 'so-book', // Map to Service Order Book as closest match
    'Customer Support': 'customer',
    'Escalation Room': 'escalation',
    'Value Engineering': 'planning', // Map to Planning as closest match
    'Event Explorer': 'events-explorer',
    'Simulation': 'events-explorer', // Map to Events Explorer as closest match (Simulation is not in Pelico Views sidebar)
  };
  
  return viewMap[view] || 'supply';
}

/**
 * Check if a column exists in the columns definition
 */
export function columnExists(columnId: string, columns: any[]): boolean {
  const findColumn = (cols: any[]): boolean => {
    for (const col of cols) {
      if (col.id === columnId) {
        return true;
      }
      if ('columns' in col && Array.isArray(col.columns)) {
        if (findColumn(col.columns)) {
          return true;
        }
      }
    }
    return false;
  };
  
  return findColumn(columns);
}

