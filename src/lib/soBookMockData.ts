/**
 * Mock data generator for Service Order Book
 * Matches REGLES_METIERS.md section 9.7 column structure
 * Generates ~377 rows with realistic service order data
 */

export type SimOutcome = 'approved' | 'pending' | 'rejected';
export type SOStatus = 'completed' | 'in-progress' | 'blocked';
export type EngineeringStatus = 'ready' | 'pending' | 'blocked';
export type SubcontractInfo = 'yes' | 'no';

export interface ServiceOrderRow {
  id: string;
  // Sim. Outcome
  simOutcome: SimOutcome;
  // Service Order
  ticketsOnSO: number;
  serviceOrderNumber: string;
  subcontractInfo: SubcontractInfo;
  // Status
  soStatus: SOStatus;
  materialCoverage: number; // percentage
  engineeringStatus: EngineeringStatus;
  // Part
  ticketsOnPart: number;
  partNumber: string;
  partName: string;
  // Quantities
  requiredQuantity: number;
  openQuantity: number;
  simQuantity: number;
  // Timeline – Start
  plannedStartDate: string; // YYYY-MM-DD
  simStartDate: string; // YYYY-MM-DD
  // Timeline – End
  plannedEndDate: string; // YYYY-MM-DD
  simEndDate: string; // YYYY-MM-DD
  // Execution
  actualStartDate: string; // YYYY-MM-DD
  actualEndDate: string; // YYYY-MM-DD
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

function generateServiceOrderNumber(): string {
  return `SO-${randomInt(100000, 999999)}`;
}

function generatePartNumber(): string {
  return `Part_${randomInt(1, 100)}`;
}

export function generateMockData(count: number = 377): ServiceOrderRow[] {
  const data: ServiceOrderRow[] = [];
  const today = new Date();
  const futureDate = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const plannedStartDate = randomDate(pastDate, futureDate);
    const plannedEndDate = randomDate(new Date(plannedStartDate), futureDate);
    const requiredQty = randomInt(10, 5000);
    const openQty = randomInt(0, requiredQty);
    
    const row: ServiceOrderRow = {
      id: `row-${i + 1}`,
      simOutcome: randomElement<SimOutcome>(['approved', 'pending', 'rejected']),
      ticketsOnSO: randomInt(0, 5),
      serviceOrderNumber: generateServiceOrderNumber(),
      subcontractInfo: randomElement<SubcontractInfo>(['yes', 'no']),
      soStatus: randomElement<SOStatus>(['completed', 'in-progress', 'blocked']),
      materialCoverage: randomInt(0, 100),
      engineeringStatus: randomElement<EngineeringStatus>(['ready', 'pending', 'blocked']),
      ticketsOnPart: randomInt(0, 3),
      partNumber: generatePartNumber(),
      partName: randomElement(partNames),
      requiredQuantity: requiredQty,
      openQuantity: openQty,
      simQuantity: openQty + randomInt(-100, 100),
      plannedStartDate,
      simStartDate: randomDate(pastDate, futureDate),
      plannedEndDate,
      simEndDate: randomDate(new Date(plannedEndDate), futureDate),
      actualStartDate: randomDate(pastDate, today),
      actualEndDate: randomDate(new Date(plannedEndDate), today),
    };

    data.push(row);
  }

  return data;
}

// Pre-generate data for the app
export const mockData = generateMockData(377);
