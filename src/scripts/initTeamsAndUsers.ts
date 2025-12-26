/**
 * Script to initialize teams and users
 * Run this in the browser console or import it in the app initialization
 */

import { createTeam } from '@/lib/teams';
import { createUser } from '@/lib/users';

export const initializeTeamsAndUsers = () => {
  // Create teams
  const procurementTeam = createTeam({
    name: 'Procurement manager',
    description: 'Team responsible for procurement management',
  });

  const supplyPlannerTeam = createTeam({
    name: 'Supply planner',
    description: 'Team responsible for supply planning',
  });

  // Create users and assign to teams
  const regina = createUser({
    name: 'Regina Bulatova',
    email: 'regina.bulatova@pelico.com',
    role: 'user',
    teamId: procurementTeam.id,
  });

  const julien = createUser({
    name: 'Julien Calviac',
    email: 'julien.calviac@pelico.com',
    role: 'user',
    teamId: supplyPlannerTeam.id,
  });

  const jeremie = createUser({
    name: 'Jeremie Chaine',
    email: 'jeremie.chaine@pelico.com',
    role: 'user',
    teamId: supplyPlannerTeam.id,
  });

  console.log('Teams and users initialized:', {
    teams: [procurementTeam, supplyPlannerTeam],
    users: [regina, julien, jeremie],
  });

  return {
    teams: [procurementTeam, supplyPlannerTeam],
    users: [regina, julien, jeremie],
  };
};






