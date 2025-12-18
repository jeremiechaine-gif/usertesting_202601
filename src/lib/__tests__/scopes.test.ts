/**
 * Tests for scope management utilities
 * Critical: Scope filters conversion, persistence, current scope management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createScope,
  getScope,
  updateScope,
  deleteScope,
  getDefaultScope,
  setDefaultScope,
  getCurrentScopeId,
  setCurrentScopeId,
} from '../scopes';

describe('Scope Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('CRUD Operations', () => {
    it('should create a scope', () => {
      const scope = createScope({
        name: 'Test Scope',
        description: 'Test description',
        filters: [],
      });

      expect(scope.id).toBeDefined();
      expect(scope.name).toBe('Test Scope');
      expect(scope.createdAt).toBeDefined();
      expect(scope.updatedAt).toBeDefined();
    });

    it('should get a scope by ID', () => {
      const scope = createScope({
        name: 'Test Scope',
        filters: [],
      });

      const retrieved = getScope(scope.id);
      expect(retrieved).toEqual(scope);
    });

    it('should update a scope', () => {
      const scope = createScope({
        name: 'Test Scope',
        filters: [],
      });

      const originalUpdatedAt = scope.updatedAt;
      
      // Small delay to ensure timestamp difference
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const updated = updateScope(scope.id, { name: 'Updated Name' });
          expect(updated?.name).toBe('Updated Name');
          expect(updated?.updatedAt).toBeDefined();
          expect(new Date(updated?.updatedAt || '').getTime()).toBeGreaterThanOrEqual(
            new Date(originalUpdatedAt).getTime()
          );
          resolve();
        }, 10);
      });
    });

    it('should delete a scope', () => {
      const scope = createScope({
        name: 'Test Scope',
        filters: [],
      });

      const deleted = deleteScope(scope.id);
      expect(deleted).toBe(true);
      expect(getScope(scope.id)).toBeNull();
    });
  });

  describe('Default Scope', () => {
    it('should set and get default scope', () => {
      const scope1 = createScope({
        name: 'Scope 1',
        filters: [],
        isDefault: true,
      });

      const scope2 = createScope({
        name: 'Scope 2',
        filters: [],
        isDefault: false,
      });

      const defaultScope = getDefaultScope();
      expect(defaultScope?.id).toBe(scope1.id);

      setDefaultScope(scope2.id);
      const newDefault = getDefaultScope();
      expect(newDefault?.id).toBe(scope2.id);
      expect(getScope(scope1.id)?.isDefault).toBe(false);
    });
  });

  describe('Current Scope', () => {
    it('should set and get current scope ID', () => {
      const scope = createScope({
        name: 'Test Scope',
        filters: [],
      });

      setCurrentScopeId(scope.id);
      expect(getCurrentScopeId()).toBe(scope.id);

      setCurrentScopeId(null);
      expect(getCurrentScopeId()).toBeNull();
    });
  });
});

