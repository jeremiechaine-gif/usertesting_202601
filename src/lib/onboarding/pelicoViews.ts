/**
 * Pelico Views Definitions
 * Complete metadata for each Pelico product view
 * Used for routine creation and persona-based recommendations
 */

export type ViewStructure = 
  | 'table' 
  | 'timeline' 
  | 'time-phased-grid' 
  | 'hybrid' 
  | 'relational-table';

export type ViewIntent = 
  | 'resolve-blockers'
  | 'execute-operations'
  | 'anticipate-risks'
  | 'manage-customer-commitments'
  | 'investigate-causes-impacts';

export type Persona = 
  | 'Supply Planner'
  | 'Buyer'
  | 'Procurement Manager'
  | 'Assembly Scheduler'
  | 'Scheduler'
  | 'Master Planner'
  | 'Logistics Support'
  | 'Quality Control'
  | 'Supply Chain Manager'
  | 'Supply Chain Director'
  | 'Scheduling & Logistics Manager'
  | 'Customer Support'
  | 'Production Controller'
  | 'Planner'
  | 'Other / Mixed';

export interface PelicoViewDefinition {
  id: string;
  name: string;
  shortDescription: string; // 1-2 sentences, problem-solving focused
  recommendedPersonas: Persona[];
  structure: ViewStructure;
  intent: ViewIntent;
  typicalDecisions: string[]; // What kind of decisions are made from this view
  notMeantFor: string[]; // What this view is NOT meant to do
  pelicoViewPage: 'supply' | 'production' | 'customer' | 'escalation' | 'value-engineering' | 'event-explorer' | 'simulation';
}

export const PELICO_VIEWS: PelicoViewDefinition[] = [
  {
    id: 'escalation-room',
    name: 'Escalation Room',
    shortDescription: 'The central workspace where all operational blockers and disruptions are tracked, prioritized, and resolved collaboratively. Manage escalated issues across supply, production, planning, quality, and customer operations.',
    recommendedPersonas: [
      'Supply Chain Manager',
      'Supply Chain Director',
      'Procurement Manager',
      'Production Controller',
      'Scheduling & Logistics Manager',
    ],
    structure: 'table',
    intent: 'resolve-blockers',
    typicalDecisions: [
      'Which issues need immediate attention',
      'Who should handle each escalation',
      'What actions are required to resolve blockers',
      'Priority of operational disruptions',
    ],
    notMeantFor: [
      'Detailed supplier performance analysis',
      'Long-term strategic planning',
      'Financial value projections',
    ],
    pelicoViewPage: 'escalation',
  },
  {
    id: 'po-book',
    name: 'PO Book',
    shortDescription: 'A live, event-based view of supplier delivery commitments at the purchase order line schedule level. Monitor delivery performance, assess supplier reliability, and take proactive actions on late or at-risk supply events.',
    recommendedPersonas: [
      'Supply Planner',
      'Buyer',
      'Procurement Manager',
    ],
    structure: 'table',
    intent: 'execute-operations',
    typicalDecisions: [
      'Which suppliers need follow-up',
      'What delivery events are at risk',
      'When to pull-in or push-out deliveries',
      'Which commitments to negotiate',
    ],
    notMeantFor: [
      'Customer order management',
      'Production work order execution',
      'Root cause investigation',
    ],
    pelicoViewPage: 'supply',
  },
  {
    id: 'so-book',
    name: 'SO Book',
    shortDescription: 'A real-time execution view for MRO service orders. Track progress, material and capacity coverage, and commercial alignment to ensure service orders can be completed and delivered on time.',
    recommendedPersonas: [
      'Logistics Support',
      'Scheduler',
      'Assembly Scheduler',
    ],
    structure: 'table',
    intent: 'execute-operations',
    typicalDecisions: [
      'Which service orders can be completed',
      'What material shortages are blocking delivery',
      'When to schedule service work',
      'Capacity vs material arbitration',
    ],
    notMeantFor: [
      'Purchase order management',
      'Customer order tracking',
      'Strategic planning',
    ],
    pelicoViewPage: 'production',
  },
  {
    id: 'co-book',
    name: 'CO Book',
    shortDescription: 'The primary view to manage customer delivery commitments. Assess order coverage, detect administrative or material blockers, and decide when and how customer orders can be shipped.',
    recommendedPersonas: [
      'Customer Support',
      'Supply Chain Manager',
      'Scheduler',
    ],
    structure: 'table',
    intent: 'manage-customer-commitments',
    typicalDecisions: [
      'When customer orders can be shipped',
      'What delivery promises to make',
      'Which orders are at risk',
      'How to adjust delivery dates',
    ],
    notMeantFor: [
      'Supplier management',
      'Production planning',
      'Root cause analysis',
    ],
    pelicoViewPage: 'customer',
  },
  {
    id: 'wo-book',
    name: 'WO Book',
    shortDescription: 'Provides line-by-line visibility into production work orders, with a strong focus on material availability and execution risk. Helps production and planning teams decide what can be launched and what will be blocked.',
    recommendedPersonas: [
      'Production Controller',
      'Scheduler',
      'Assembly Scheduler',
      'Master Planner',
    ],
    structure: 'table',
    intent: 'execute-operations',
    typicalDecisions: [
      'Which work orders can be launched',
      'What material shortages are blocking production',
      'When to start production',
      'Priority of work orders',
    ],
    notMeantFor: [
      'Supplier follow-up',
      'Customer order management',
      'Long-term planning',
    ],
    pelicoViewPage: 'production',
  },
  {
    id: 'missing-parts',
    name: 'Missing Parts',
    shortDescription: 'Highlights material shortages and the orders they block, organized chronologically. Quickly identify critical missing components and prioritize actions based on how long the issue has been unresolved.',
    recommendedPersonas: [
      'Supply Planner',
      'Production Controller',
      'Buyer',
      'Scheduler',
    ],
    structure: 'timeline',
    intent: 'resolve-blockers',
    typicalDecisions: [
      'Which parts are most critical',
      'What orders are blocked by shortages',
      'How long issues have been unresolved',
      'Where to investigate first',
    ],
    notMeantFor: [
      'Supplier performance analysis',
      'Customer order tracking',
      'Time-phased planning',
    ],
    pelicoViewPage: 'supply',
  },
  {
    id: 'line-of-balance',
    name: 'Line of Balance',
    shortDescription: 'A time-phased view of material availability by part, showing when components will become blocking in the future. A forward-looking view used to anticipate shortages before they impact execution.',
    recommendedPersonas: [
      'Master Planner',
      'Supply Planner',
      'Scheduler',
      'Production Controller',
    ],
    structure: 'hybrid',
    intent: 'anticipate-risks',
    typicalDecisions: [
      'When parts will become blocking',
      'What shortages to anticipate',
      'How to prioritize supply actions',
      'Risk levels by time horizon',
    ],
    notMeantFor: [
      'Current execution decisions',
      'Customer order management',
      'Financial analysis',
    ],
    pelicoViewPage: 'supply',
  },
  {
    id: 'planning',
    name: 'Planning',
    shortDescription: 'Projects inventory value over time by part, allowing teams to understand the financial impact of supply and demand decisions. Primarily used for strategic arbitration and scenario analysis.',
    recommendedPersonas: [
      'Supply Chain Director',
      'Supply Chain Manager',
      'Master Planner',
      'Procurement Manager',
    ],
    structure: 'time-phased-grid',
    intent: 'anticipate-risks',
    typicalDecisions: [
      'Financial impact of decisions',
      'Strategic supply scenarios',
      'Value optimization opportunities',
      'Risk assessment at management level',
    ],
    notMeantFor: [
      'Daily operational execution',
      'Supplier follow-up',
      'Root cause investigation',
    ],
    pelicoViewPage: 'value-engineering',
  },
  {
    id: 'events-explorer',
    name: 'Events Explorer',
    shortDescription: 'An investigation tool that allows users to analyze how events are linked through pegging relationships. Helps identify root causes upstream and understand downstream impacts.',
    recommendedPersonas: [
      'Supply Planner',
      'Production Controller',
      'Master Planner',
      'Scheduler',
    ],
    structure: 'relational-table',
    intent: 'investigate-causes-impacts',
    typicalDecisions: [
      'Why delays occurred',
      'What caused a shortage',
      'Impact of supplier delays',
      'Root cause of issues',
    ],
    notMeantFor: [
      'Daily operational execution',
      'Customer order management',
      'Strategic planning',
    ],
    pelicoViewPage: 'event-explorer',
  },
];

/**
 * Get views recommended for a specific persona
 */
export function getRecommendedViewsForPersona(persona: Persona | string): PelicoViewDefinition[] {
  return PELICO_VIEWS.filter(view => 
    view.recommendedPersonas.includes(persona as Persona)
  ).slice(0, 4); // Limit to 3-4 views maximum
}

/**
 * Get all views grouped by intent
 */
export function getViewsByIntent(): Record<ViewIntent, PelicoViewDefinition[]> {
  const grouped: Record<ViewIntent, PelicoViewDefinition[]> = {
    'resolve-blockers': [],
    'execute-operations': [],
    'anticipate-risks': [],
    'manage-customer-commitments': [],
    'investigate-causes-impacts': [],
  };

  PELICO_VIEWS.forEach(view => {
    grouped[view.intent].push(view);
  });

  return grouped;
}

/**
 * Get view by ID
 */
export function getViewById(id: string): PelicoViewDefinition | undefined {
  return PELICO_VIEWS.find(view => view.id === id);
}

/**
 * Map French persona names to English
 */
export function mapPersonaToEnglish(frenchPersona: string): Persona {
  const mapping: Record<string, Persona> = {
    'Approvisionneur': 'Supply Planner',
    'Acheteur': 'Buyer',
    'Manager Appro': 'Procurement Manager',
    'Ordonnanceur Assemblage': 'Assembly Scheduler',
    'Ordonnanceur': 'Scheduler',
    'Master Planner': 'Master Planner',
    'Support Logistique': 'Logistics Support',
    'Recette': 'Quality Control',
    'Responsable Supply Chain': 'Supply Chain Manager',
    'Directeur Supply Chain': 'Supply Chain Director',
    'Responsable Ordo & Support log': 'Scheduling & Logistics Manager',
    'Autre / Mixte': 'Other / Mixed',
  };

  return mapping[frenchPersona] || frenchPersona as Persona;
}

