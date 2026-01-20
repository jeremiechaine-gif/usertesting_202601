/**
 * Integration tests for multiple filters on different columns
 * Verifies that AND logic works correctly when multiple filters are applied
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
    buyerCode: 'ABC123',
    mrpCode: 'MRP-1234',
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
  
  return {
    id: rowData.id,
    original: rowData,
    getValue: (columnId: string) => {
      return (rowData as any)[columnId];
    },
  } as Row<PurchaseOrderRow>;
};

describe('Multiple filters integration (AND logic)', () => {
  it('should match row when ALL filters match (AND logic between columns)', () => {
    // Row that matches both filters
    const row = createMockRow({ 
      type: 'PO', 
      deliveryStatus: 'Pending' 
    });
    
    // First filter: Type = PO
    const typeMatch = customFilterFn(row, 'type', ['PO'], () => {});
    expect(typeMatch).toBe(true);
    
    // Second filter: Delivery Status = Pending
    const statusMatch = customFilterFn(row, 'deliveryStatus', ['Pending'], () => {});
    expect(statusMatch).toBe(true);
    
    // Both filters match, so row should be included (AND logic)
    expect(typeMatch && statusMatch).toBe(true);
  });

  it('should NOT match row when ONE filter does not match (AND logic)', () => {
    // Row that matches first filter but not second
    const row = createMockRow({ 
      type: 'PO', 
      deliveryStatus: 'Delivered' // Different from filter
    });
    
    // First filter: Type = PO
    const typeMatch = customFilterFn(row, 'type', ['PO'], () => {});
    expect(typeMatch).toBe(true);
    
    // Second filter: Delivery Status = Pending
    const statusMatch = customFilterFn(row, 'deliveryStatus', ['Pending'], () => {});
    expect(statusMatch).toBe(false);
    
    // One filter doesn't match, so row should be excluded (AND logic)
    expect(typeMatch && statusMatch).toBe(false);
  });

  it('should match row when filter has multiple values (OR logic within filter)', () => {
    // Row with Type = PO
    const row = createMockRow({ type: 'PO' });
    
    // Filter: Type = PO OR PR
    const match1 = customFilterFn(row, 'type', ['PO', 'PR'], () => {});
    expect(match1).toBe(true);
    
    // Row with Type = PR
    const row2 = createMockRow({ type: 'PR' });
    const match2 = customFilterFn(row2, 'type', ['PO', 'PR'], () => {});
    expect(match2).toBe(true);
    
    // Row with Type = STO (not in filter)
    const row3 = createMockRow({ type: 'STO' });
    const match3 = customFilterFn(row3, 'type', ['PO', 'PR'], () => {});
    expect(match3).toBe(false);
  });

  it('should match row when multiple filters with multiple values all match', () => {
    // Row that matches both filters with multiple values
    const row = createMockRow({ 
      type: 'PO', // Matches ['PO', 'PR']
      deliveryStatus: 'Pending' // Matches ['Pending', 'Shipped']
    });
    
    // Filter 1: Type = PO OR PR
    const typeMatch = customFilterFn(row, 'type', ['PO', 'PR'], () => {});
    expect(typeMatch).toBe(true);
    
    // Filter 2: Delivery Status = Pending OR Shipped
    const statusMatch = customFilterFn(row, 'deliveryStatus', ['Pending', 'Shipped'], () => {});
    expect(statusMatch).toBe(true);
    
    // Both filters match, so row should be included
    expect(typeMatch && statusMatch).toBe(true);
  });

  it('should handle three filters correctly (AND logic)', () => {
    // Row that matches all three filters
    const row = createMockRow({ 
      type: 'PO',
      deliveryStatus: 'Pending',
      otdStatus: 'on-time'
    });
    
    const typeMatch = customFilterFn(row, 'type', ['PO'], () => {});
    const statusMatch = customFilterFn(row, 'deliveryStatus', ['Pending'], () => {});
    const otdMatch = customFilterFn(row, 'otdStatus', ['on-time'], () => {});
    
    // All three filters must match (AND logic)
    expect(typeMatch && statusMatch && otdMatch).toBe(true);
  });

  it('should exclude row when one of three filters does not match', () => {
    // Row that matches 2 out of 3 filters
    const row = createMockRow({ 
      type: 'PO', // Matches
      deliveryStatus: 'Pending', // Matches
      otdStatus: 'late' // Does NOT match filter ['on-time']
    });
    
    const typeMatch = customFilterFn(row, 'type', ['PO'], () => {});
    const statusMatch = customFilterFn(row, 'deliveryStatus', ['Pending'], () => {});
    const otdMatch = customFilterFn(row, 'otdStatus', ['on-time'], () => {});
    
    // One filter doesn't match, so row should be excluded
    expect(typeMatch && statusMatch && otdMatch).toBe(false);
  });
});
