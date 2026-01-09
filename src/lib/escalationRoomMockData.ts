/**
 * Mock data generator for Escalation Room
 * Matches REGLES_METIERS.md section 9.6 column structure
 * Generates ~377 rows with realistic escalation ticket data
 */

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface EscalationRoomRow {
  id: string;
  // Ungrouped utilities (left)
  notification: boolean;
  favorite: boolean;
  // Level
  escalationLevel: number;
  // Ticket Number
  ticketNumber: string;
  // Status
  ticketStatus: TicketStatus;
  // Parts
  suppliersImplicated: string | string[]; // string (list)
  suppliersParts: string | string[]; // string (list)
  // Objects
  objects: string | { label: string; count: number } | string[]; // string / link + count
  // Team
  team: string;
  // Assignee
  assignee: string;
  // Line stop date
  lineStopDate: string; // YYYY-MM-DD
  // New Delivery Date
  newDeliveryDate: string; // YYYY-MM-DD
  // Last Update time
  lastUpdateTime: string; // ISO datetime string
  // Last comment
  lastComment: string; // string (user mention + preview)
}

const suppliers = [
  'PedalPower Industries',
  "Cyclist's Choice Components",
  'ProPedal Solutions',
  'GearShift Distribution',
  'Cyclone Components',
  'Velocity Cycle Parts',
];

const teams = [
  'Supply Chain',
  'Production',
  'Quality',
  'Engineering',
  'Logistics',
];

const assignees = [
  'John Smith',
  'Jane Doe',
  'Mike Johnson',
  'Sarah Williams',
  'David Brown',
  'Emily Davis',
];

const objectTypes = [
  'Work Order',
  'Purchase Order',
  'Service Order',
  'Part',
  'Assembly',
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

function randomDateTime(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

function generateTicketNumber(): string {
  return `TKT-${randomInt(100000, 999999)}`;
}

function generateSuppliersList(): string[] {
  const count = randomInt(1, 3);
  const selected: string[] = [];
  const available = [...suppliers];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const index = randomInt(0, available.length - 1);
    selected.push(available.splice(index, 1)[0]);
  }
  
  return selected;
}

function generateObjects(): { label: string; count: number } {
  const type = randomElement(objectTypes);
  const count = randomInt(1, 10);
  return {
    label: `${type} ${randomInt(1000, 9999)}`,
    count,
  };
}

function generateComment(assignee: string): string {
  const comments = [
    `@${assignee.split(' ')[0].toLowerCase()} Please review this escalation`,
    `Status update: Waiting for supplier response`,
    `@${assignee.split(' ')[0].toLowerCase()} Can you prioritize this?`,
    `Follow-up needed on delivery date`,
    `@${assignee.split(' ')[0].toLowerCase()} This requires immediate attention`,
  ];
  return randomElement(comments);
}

export function generateMockData(count: number = 377): EscalationRoomRow[] {
  const data: EscalationRoomRow[] = [];
  const today = new Date();
  const futureDate = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const assignee = randomElement(assignees);
    const lineStopDate = randomDate(pastDate, futureDate);
    const newDeliveryDate = randomDate(new Date(lineStopDate), futureDate);
    const lastUpdateTime = randomDateTime(pastDate, today);
    
    const row: EscalationRoomRow = {
      id: `row-${i + 1}`,
      notification: Math.random() > 0.7,
      favorite: Math.random() > 0.8,
      escalationLevel: randomInt(1, 4),
      ticketNumber: generateTicketNumber(),
      ticketStatus: randomElement<TicketStatus>(['open', 'in-progress', 'resolved', 'closed']),
      suppliersImplicated: generateSuppliersList(),
      suppliersParts: generateSuppliersList(),
      objects: generateObjects(),
      team: randomElement(teams),
      assignee,
      lineStopDate,
      newDeliveryDate,
      lastUpdateTime,
      lastComment: generateComment(assignee),
    };

    data.push(row);
  }

  return data;
}

// Pre-generate data for the app
export const mockData = generateMockData(377);
