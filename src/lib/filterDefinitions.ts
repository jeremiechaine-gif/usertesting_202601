/**
 * Filter Definitions for Purchase Order Book
 * Defines available filters grouped by category
 */

import type { FilterDefinition } from '@/components/SortingAndFiltersPopover';

export const filterDefinitions: FilterDefinition[] = [
  // Favorites
  {
    id: 'quantity-comparison',
    label: 'Quantity Comparison',
    category: 'favorites',
    type: 'number',
    isFavorite: true,
  },
  {
    id: 'consumed-part-buyer-codes',
    label: 'Consumed part Buyer Codes',
    category: 'favorites',
    type: 'multi-select',
    options: [
      { label: 'ABC123', value: 'ABC123' },
      { label: 'BCD567', value: 'BCD567' },
      { label: 'CDE890', value: 'CDE890' },
    ],
    isFavorite: true,
  },
  {
    id: 'produced-part-buyer-codes',
    label: 'Produced part Buyer Codes',
    category: 'favorites',
    type: 'multi-select',
    options: [
      { label: 'XYZ789', value: 'XYZ789' },
      { label: 'YZA012', value: 'YZA012' },
    ],
    isFavorite: true,
  },

  // General
  {
    id: 'date-comparison',
    label: 'Date Comparison',
    category: 'general',
    type: 'date',
  },
  {
    id: 'quantity-range',
    label: 'Quantity Range',
    category: 'general',
    type: 'number',
  },

  // Consumed Parts
  {
    id: 'buyer-codes',
    label: 'Buyer Codes',
    category: 'consumed-parts',
    type: 'multi-select',
    options: [
      { label: 'ABC123', value: 'ABC123' },
      { label: 'BCD567', value: 'BCD567' },
      { label: 'CDE890', value: 'CDE890' },
      { label: 'DEF123', value: 'DEF123' },
    ],
  },
  {
    id: 'escalation-level',
    label: 'Escalation Level',
    category: 'consumed-parts',
    type: 'multi-select',
    options: [
      { label: '0', value: 0 },
      { label: '1', value: 1 },
      { label: '2', value: 2 },
      { label: '3', value: 3 },
    ],
  },

  // Produced Parts
  {
    id: 'part-name',
    label: 'Part Name',
    category: 'produced-parts',
    type: 'multi-select',
    options: [
      { label: 'Headset bearings', value: 'Headset bearings' },
      { label: 'Brake cables', value: 'Brake cables' },
      { label: 'Brake booster', value: 'Brake booster' },
      { label: 'Bottom bracket', value: 'Bottom bracket' },
      { label: 'Valve stems', value: 'Valve stems' },
      { label: 'Pedals', value: 'Pedals' },
      { label: 'Crankset', value: 'Crankset' },
    ],
  },
  {
    id: 'part-number',
    label: 'Part Number',
    category: 'produced-parts',
    type: 'multi-select',
    options: [
      { label: 'Part_54', value: 'Part_54' },
      { label: 'Part_8', value: 'Part_8' },
      { label: 'Part_50', value: 'Part_50' },
      { label: 'Part_99', value: 'Part_99' },
      { label: 'Part_101', value: 'Part_101' },
    ],
  },
  {
    id: 'type',
    label: 'Type',
    category: 'produced-parts',
    type: 'select',
    options: [
      { label: 'PO', value: 'PO' },
      { label: 'PR', value: 'PR' },
      { label: 'STO', value: 'STO' },
    ],
  },
  {
    id: 'delivery-status',
    label: 'Delivery Status',
    category: 'produced-parts',
    type: 'select',
    options: [
      { label: 'Pending', value: 'Pending' },
      { label: 'Shipped', value: 'Shipped' },
      { label: 'Delivered', value: 'Delivered' },
      { label: 'Cancelled', value: 'Cancelled' },
    ],
  },
  {
    id: 'plant',
    label: 'Plant',
    category: 'produced-parts',
    type: 'multi-select',
    options: [
      { label: 'plant_1', value: 'plant_1' },
      { label: 'plant_100000', value: 'plant_100000' },
      { label: 'plant_100001', value: 'plant_100001' },
      { label: 'plant_100002', value: 'plant_100002' },
      { label: 'plant_100003', value: 'plant_100003' },
    ],
  },
  {
    id: 'supplier',
    label: 'Supplier',
    category: 'produced-parts',
    type: 'multi-select',
    options: [
      { label: 'PedalPower Industries', value: 'PedalPower Industries' },
      { label: "Cyclist's Choice Components", value: "Cyclist's Choice Components" },
      { label: 'ProPedal Solutions', value: 'ProPedal Solutions' },
      { label: 'GearShift Distribution', value: 'GearShift Distribution' },
      { label: 'Velocity Cycle Parts', value: 'Velocity Cycle Parts' },
      { label: 'ProPedal Solutions', value: 'ProPedal Solutions' },
    ],
  },
];







