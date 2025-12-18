/**
 * Tests for custom filter function
 * Ensures correct filtering behavior with single values, arrays, and conditions
 */

import { describe, it, expect } from 'vitest';
import type { Row } from '@tanstack/react-table';
import type { PurchaseOrderRow } from '../mockData';
import { customFilterFn } from '../columns';

// Mock row object that implements Row interface
const createMockRow = (data: Partial<PurchaseOrderRow>): Row<PurchaseOrderRow> => {
  const rowData: PurchaseOrderRow = {
    id: '1',
    escalationLevel: 0,
    type: 'PO',
    event: 'EVENT-001',
    otdStatus: 'on-time',
    deliveryStatus: 'Pending',
    subcontract: false,
    partEscalationLevel: 0,
    partNumber: 'PART-001',
    partName: 'Test Part',
    plant: 'Plant A',
    openQuantity: 100,
    price: 10.5,
    inventoryValue: 1050,
    supplier: 'Supplier A',
    suggestedAction: 5,
    inventory: 1000,
    otdDate: '2024-01-01',
    deliveryDate: '2024-01-15',
    simQty: 50,
    simDate: '2024-01-10',
    ...data,
  };
  
  // Create a minimal mock Row object
  return {
    id: rowData.id,
    original: rowData,
    getValue: (columnId: string) => {
      return (rowData as any)[columnId];
    },
  } as Row<PurchaseOrderRow>;
};

describe('customFilterFn', () => {
  describe('single value filtering', () => {
    it('should match exact single value', () => {
      const row = createMockRow({ type: 'PO' });
      const result = customFilterFn(row, 'type', 'PO', () => {});
      expect(result).toBe(true);
    });

    it('should not match different single value', () => {
      const row = createMockRow({ type: 'PO' });
      const result = customFilterFn(row, 'type', 'PR', () => {});
      expect(result).toBe(false);
    });
  });

  describe('array value filtering (OR logic)', () => {
    it('should match when value is in array', () => {
      const row = createMockRow({ type: 'PO' });
      const result = customFilterFn(row, 'type', ['PO', 'PR'], () => {});
      expect(result).toBe(true);
    });

    it('should match when value is second item in array', () => {
      const row = createMockRow({ type: 'PR' });
      const result = customFilterFn(row, 'type', ['PO', 'PR'], () => {});
      expect(result).toBe(true);
    });

    it('should not match when value is not in array', () => {
      const row = createMockRow({ type: 'STO' });
      const result = customFilterFn(row, 'type', ['PO', 'PR'], () => {});
      expect(result).toBe(false);
    });

    it('should show all rows when array is empty', () => {
      const row = createMockRow({ type: 'PO' });
      const result = customFilterFn(row, 'type', [], () => {});
      expect(result).toBe(true);
    });
  });

  describe('condition object filtering', () => {
    it('should match with "is" condition', () => {
      const row = createMockRow({ type: 'PO' });
      const result = customFilterFn(row, 'type', { condition: 'is', values: ['PO', 'PR'] }, () => {});
      expect(result).toBe(true);
    });

    it('should not match with "isNot" condition when value is in array', () => {
      const row = createMockRow({ type: 'PO' });
      const result = customFilterFn(row, 'type', { condition: 'isNot', values: ['PO', 'PR'] }, () => {});
      expect(result).toBe(false);
    });

    it('should match with "isNot" condition when value is not in array', () => {
      const row = createMockRow({ type: 'STO' });
      const result = customFilterFn(row, 'type', { condition: 'isNot', values: ['PO', 'PR'] }, () => {});
      expect(result).toBe(true);
    });

    it('should show all rows when condition object has empty values array', () => {
      const row = createMockRow({ type: 'PO' });
      const result = customFilterFn(row, 'type', { condition: 'is', values: [] }, () => {});
      expect(result).toBe(true);
    });
  });

  describe('null/undefined handling', () => {
    it('should show all rows when filter value is null', () => {
      const row = createMockRow({ type: 'PO' });
      const result = customFilterFn(row, 'type', null, () => {});
      expect(result).toBe(true);
    });

    it('should show all rows when filter value is undefined', () => {
      const row = createMockRow({ type: 'PO' });
      const result = customFilterFn(row, 'type', undefined, () => {});
      expect(result).toBe(true);
    });
  });

  describe('multiple filters (AND logic)', () => {
    it('should match when both filters match', () => {
      const row = createMockRow({ type: 'PO', deliveryStatus: 'Pending' });
      const typeMatch = customFilterFn(row, 'type', ['PO'], () => {});
      const statusMatch = customFilterFn(row, 'deliveryStatus', ['Pending'], () => {});
      expect(typeMatch && statusMatch).toBe(true);
    });

    it('should not match when one filter does not match', () => {
      const row = createMockRow({ type: 'PO', deliveryStatus: 'Pending' });
      const typeMatch = customFilterFn(row, 'type', ['PO'], () => {});
      const statusMatch = customFilterFn(row, 'deliveryStatus', ['Delivered'], () => {});
      expect(typeMatch && statusMatch).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle number values correctly', () => {
      const row = createMockRow({ escalationLevel: 2 });
      const result = customFilterFn(row, 'escalationLevel', [1, 2, 3], () => {});
      expect(result).toBe(true);
    });

    it('should handle boolean values correctly', () => {
      const row = createMockRow({ subcontract: true });
      const result = customFilterFn(row, 'subcontract', true, () => {});
      expect(result).toBe(true);
    });

    it('should handle string values with special characters', () => {
      const row = createMockRow({ partNumber: 'PART-001' });
      const result = customFilterFn(row, 'partNumber', ['PART-001', 'PART-002'], () => {});
      expect(result).toBe(true);
    });
  });
});
