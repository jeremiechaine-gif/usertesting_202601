/**
 * Mock data generator for Purchase Order Book
 * Generates ~377 rows with realistic supply chain data
 */

export type SupplyEventType = 'PO' | 'PR' | 'STO';
export type DeliveryStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
export type OTDStatus = 'on-time' | 'at-risk' | 'late';

export interface PurchaseOrderRow {
  id: string;
  // Supply Event
  escalationLevel: number;
  type: SupplyEventType;
  event: string;
  otdStatus: OTDStatus;
  deliveryStatus: DeliveryStatus;
  subcontract: boolean;
  // Produced Part
  partEscalationLevel: number;
  partNumber: string;
  partName: string;
  plant: string;
  // General Information
  openQuantity: number;
  price: number;
  inventoryValue: number;
  supplier: string;
  // Timeline
  suggestedAction: number; // days delta
  inventory: number; // value in euros
  otdDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  // Simulation
  simQty: number;
  simDate: string; // YYYY-MM-DD
}

const suppliers = [
  'PedalPower Industries',
  "Cyclist's Choice Components",
  'ProPedal Solutions',
  'GearShift Distribution',
  'Cyclone Components',
  'Velocity Cycle Parts',
  'PedalCraft Components',
  'SpinTech Bikes',
  'EliteCycle Parts',
  'RideReady Products',
  'BikeMaster International',
  'ChainLink Suppliers',
  'WheelWorks Manufacturing',
  'FrameForge Industries',
];

const partNames = [
  'Headset bearings',
  'Brake cables',
  'Brake booster',
  'Bottom bracket',
  'Valve stems',
  'Pedals',
  'Chain ring',
  'Derailleur hanger',
  'Seat post clamp',
  'Handlebar grips',
  'Stem cap',
  'Wheel spokes',
  'Rim tape',
  'Tire valve',
  'Cable housing',
  'Brake pads',
  'Shift lever',
  'Cassette',
  'Chain',
  'Crankset',
];

const plants = ['plant_1', 'plant_100000', 'plant_100001', 'plant_100002', 'plant_100003'];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateEventId(type: SupplyEventType): string {
  const prefix = type === 'PO' ? 'PO' : type === 'PR' ? 'PR' : 'STO';
  const num = randomInt(100000, 999999);
  return `${prefix}-${num}`;
}

function generatePartNumber(): string {
  return `Part_${randomInt(1, 100)}`;
}

function determineOTDStatus(deliveryDate: string, otdDate: string): OTDStatus {
  const delivery = new Date(deliveryDate);
  const otd = new Date(otdDate);
  const diffDays = Math.floor((delivery.getTime() - otd.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'on-time';
  if (diffDays <= 7) return 'at-risk';
  return 'late';
}

export function generateMockData(count: number = 377): PurchaseOrderRow[] {
  const data: PurchaseOrderRow[] = [];
  const today = new Date();
  const futureDate = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days ahead
  const pastDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

  for (let i = 0; i < count; i++) {
    const type = randomElement<SupplyEventType>(['PO', 'PR', 'STO']);
    const deliveryDate = randomDate(pastDate, futureDate);
    const otdDate = randomDate(pastDate, futureDate);
    const openQty = randomInt(10, 5000);
    const unitPrice = randomFloat(5, 500);
    const price = openQty * unitPrice;
    const inventory = randomFloat(1000, 100000);
    const suggestedAction = randomInt(-150, 150);
    
    const row: PurchaseOrderRow = {
      id: `row-${i + 1}`,
      escalationLevel: randomInt(0, 3),
      type,
      event: generateEventId(type),
      otdStatus: determineOTDStatus(deliveryDate, otdDate),
      deliveryStatus: randomElement<DeliveryStatus>(['Pending', 'Pending', 'Pending', 'Shipped', 'Delivered']),
      subcontract: Math.random() > 0.7,
      partEscalationLevel: randomInt(0, 3),
      partNumber: generatePartNumber(),
      partName: randomElement(partNames),
      plant: randomElement(plants),
      openQuantity: openQty,
      price,
      inventoryValue: inventory,
      supplier: randomElement(suppliers),
      suggestedAction,
      inventory,
      otdDate,
      deliveryDate,
      simQty: openQty + randomInt(-100, 100),
      simDate: randomDate(pastDate, futureDate),
    };

    data.push(row);
  }

  return data;
}

// Pre-generate data for the app
export const mockData = generateMockData(377);


