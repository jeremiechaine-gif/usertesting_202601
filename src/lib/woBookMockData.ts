/**
 * Mock data generator for Work Order Book
 * Matches REGLES_METIERS.md section 9.4 column structure
 * Generates ~377 rows with realistic production data
 */

export type SimOutcome = 'approved' | 'pending' | 'rejected';
export type MaterialCoverage = 'Covered' | 'Cond.Covered' | 'Blocked';
export type WOStatus = 'Released' | 'Planned';
export type FirmStatus = 'Firm' | 'Not firm';
export type SubcontractInfo = 'yes' | 'no';

export interface WorkOrderRow {
  id: string;
  // Sim. Outcome
  simOutcome: SimOutcome;
  // Work Order
  ticketsOnWO: number;
  workOrderNumber: string;
  subcontractInfo: SubcontractInfo;
  // Status
  materialCoverage: MaterialCoverage;
  woStatus: WOStatus;
  firmStatus: FirmStatus;
  // Part
  ticketsOnPart: number;
  partNumber: string;
  partName: string;
  // General Information
  openQuantity: number;
  simQuantity: number;
  // Timeline
  actualStartDate: string; // YYYY-MM-DD
  plannedStartDate: string; // YYYY-MM-DD
  simStartDate: string; // YYYY-MM-DD
  plannedEndDate: string; // YYYY-MM-DD
  simEndDate: string; // YYYY-MM-DD
  plannedStorageDate: string; // YYYY-MM-DD
}

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

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateWorkOrderNumber(): string {
  return `WO-${randomInt(100000, 999999)}`;
}

function generatePartNumber(): string {
  return `Part_${randomInt(1, 100)}`;
}

export function generateMockData(count: number = 377): WorkOrderRow[] {
  const data: WorkOrderRow[] = [];
  const today = new Date();
  const futureDate = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const plannedStartDate = randomDate(pastDate, futureDate);
    const plannedEndDate = randomDate(new Date(plannedStartDate), futureDate);
    const openQty = randomInt(10, 5000);
    
    const row: WorkOrderRow = {
      id: `row-${i + 1}`,
      simOutcome: randomElement<SimOutcome>(['approved', 'pending', 'rejected']),
      ticketsOnWO: randomInt(0, 5),
      workOrderNumber: generateWorkOrderNumber(),
      subcontractInfo: randomElement<SubcontractInfo>(['yes', 'no']),
      materialCoverage: randomElement<MaterialCoverage>(['Covered', 'Cond.Covered', 'Blocked']),
      woStatus: randomElement<WOStatus>(['Released', 'Planned']),
      firmStatus: randomElement<FirmStatus>(['Firm', 'Not firm']),
      ticketsOnPart: randomInt(0, 3),
      partNumber: generatePartNumber(),
      partName: randomElement(partNames),
      openQuantity: openQty,
      simQuantity: openQty + randomInt(-100, 100),
      actualStartDate: randomDate(pastDate, today),
      plannedStartDate,
      simStartDate: randomDate(pastDate, futureDate),
      plannedEndDate,
      simEndDate: randomDate(new Date(plannedEndDate), futureDate),
      plannedStorageDate: randomDate(new Date(plannedEndDate), futureDate),
    };

    data.push(row);
  }

  return data;
}

// Pre-generate data for the app
export const mockData = generateMockData(377);
