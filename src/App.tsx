import { useState, useEffect } from 'react';
import { PurchaseOrderBookPage } from './components/PurchaseOrderBookPage';
import { ScopeAndRoutinesPage } from './components/ScopeAndRoutinesPage';
import { HomePage } from './components/HomePage';
import { UsersPage } from './components/UsersPage';
import { RoutineLibraryPage } from './components/RoutineLibraryPage';
import { EscalationRoomPage } from './components/EscalationRoomPage';
import { ProductionControlPage } from './components/ProductionControlPage';
import { ServiceOrderBookPage } from './components/ServiceOrderBookPage';
import { WorkOrderBookPage } from './components/WorkOrderBookPage';
import { CustomerSupportPage } from './components/CustomerSupportPage';
import { MissingPartsPage } from './components/MissingPartsPage';
import { LineOfBalancePage } from './components/LineOfBalancePage';
import { PlanningPage } from './components/PlanningPage';
import { EventsExplorerPage } from './components/EventsExplorerPage';
import { SimulationBasketPage } from './components/SimulationBasketPage';
import { TeamRoutinesPage } from './components/TeamRoutinesPage';
import { LoginPage } from './components/LoginPage';
import { SimpleOnboardingWizard } from './components/SimpleOnboardingWizard/SimpleOnboardingWizard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/toast';
import { createTeam, getTeamByName, updateTeam } from './lib/teams';
import { createUser, getUsers, getCurrentUserId } from './lib/users';
import { getRoutines, createRoutine, updateRoutine } from './lib/routines';
import './index.css';

// Initialize teams and users if they don't exist
const initializeTeamsAndUsers = () => {
  // Check if teams already exist
  const procurementTeam = getTeamByName('Procurement manager');
  const supplyPlannerTeam = getTeamByName('Supply planner');

  let procurementTeamId = procurementTeam?.id;
  let supplyPlannerTeamId = supplyPlannerTeam?.id;

  // Create teams if they don't exist
  if (!procurementTeam) {
    const newTeam = createTeam({
      name: 'Procurement manager',
      description: 'Team responsible for procurement management',
    });
    procurementTeamId = newTeam.id;
  }

  if (!supplyPlannerTeam) {
    const newTeam = createTeam({
      name: 'Supply planner',
      description: 'Team responsible for supply planning',
    });
    supplyPlannerTeamId = newTeam.id;
  }

  // Check if users already exist
  const existingUsers = getUsers();
  const lucasExists = existingUsers.find(u => u.name === 'Lucas Belbeoch');
  const reginaExists = existingUsers.find(u => u.name === 'Regina Bulatova');
  const julienExists = existingUsers.find(u => u.name === 'Julien Calviac');
  const jeremieExists = existingUsers.find(u => u.name === 'Jeremie Chaine');

  // Create admin user if doesn't exist
  if (!lucasExists) {
    createUser({
      name: 'Lucas Belbeoch',
      email: 'lucas.belbeoch@pelico.com',
      role: 'manager',
      teamId: null,
    });
  }

  // Create users if they don't exist
  if (!reginaExists && procurementTeamId) {
    createUser({
      name: 'Regina Bulatova',
      email: 'regina.bulatova@pelico.com',
      role: 'user',
      teamId: procurementTeamId,
    });
  }

  if (!julienExists && supplyPlannerTeamId) {
    createUser({
      name: 'Julien Calviac',
      email: 'julien.calviac@pelico.com',
      role: 'user',
      teamId: supplyPlannerTeamId,
    });
  }

  if (!jeremieExists && supplyPlannerTeamId) {
    createUser({
      name: 'Jeremie Chaine',
      email: 'jeremie.chaine@pelico.com',
      role: 'user',
      teamId: supplyPlannerTeamId,
    });
  }

  // Initialize routines and assign them to teams
  const currentUserId = getCurrentUserId();
  const allRoutines = getRoutines();
  
  // Helper function to get or create routine
  const getOrCreateRoutine = (name: string, scopeMode: 'scope-aware' | 'scope-fixed' = 'scope-aware') => {
    let routine = allRoutines.find(r => r.name === name);
    if (!routine) {
      routine = createRoutine({
        name,
        filters: [],
        sorting: [],
        scopeMode,
        createdBy: currentUserId,
        teamIds: [],
      });
    } else if (routine.scopeMode !== scopeMode) {
      updateRoutine(routine.id, { scopeMode });
    }
    return routine;
  };

  // Update routine names if they exist with old names
  const oldRoutine1 = allRoutines.find(r => r.name === 'Missing part' && r.scopeMode === 'scope-fixed');
  const oldRoutine2 = allRoutines.find(r => r.name === 'Missing part' && r.scopeMode === 'scope-aware');
  const oldRoutine3 = allRoutines.find(r => r.name === 'test routine');

  let routine1, routine2, routine3;

  if (oldRoutine1) {
    updateRoutine(oldRoutine1.id, { name: 'POs Missing Acknowledgement Review' });
    routine1 = getRoutines().find(r => r.id === oldRoutine1.id)!;
  } else {
    routine1 = getOrCreateRoutine('POs Missing Acknowledgement Review', 'scope-fixed');
  }

  if (oldRoutine2) {
    updateRoutine(oldRoutine2.id, { name: 'Overdue POs' });
    routine2 = getRoutines().find(r => r.id === oldRoutine2.id)!;
  } else {
    routine2 = getOrCreateRoutine('Overdue POs', 'scope-aware');
  }

  if (oldRoutine3) {
    updateRoutine(oldRoutine3.id, { name: 'Unapproved Purchase Requisitions' });
    routine3 = getRoutines().find(r => r.id === oldRoutine3.id)!;
  } else {
    routine3 = getOrCreateRoutine('Unapproved Purchase Requisitions', 'scope-aware');
  }

  // Assign routines to teams
  if (supplyPlannerTeamId) {
    const supplyTeam = getTeamByName('Supply planner');
    if (supplyTeam) {
      const currentRoutineIds = supplyTeam.assignedRoutineIds || [];
      const newRoutineIds = [
        ...new Set([
          ...currentRoutineIds,
          routine1.id,
          routine2.id,
        ]),
      ];
      if (JSON.stringify(newRoutineIds.sort()) !== JSON.stringify(currentRoutineIds.sort())) {
        updateTeam(supplyTeam.id, { assignedRoutineIds: newRoutineIds });
      }
    }
  }

  if (procurementTeamId) {
    const procurementTeam = getTeamByName('Procurement manager');
    if (procurementTeam) {
      const currentRoutineIds = procurementTeam.assignedRoutineIds || [];
      const newRoutineIds = [
        ...new Set([
          ...currentRoutineIds,
          routine3.id,
        ]),
      ];
      if (JSON.stringify(newRoutineIds.sort()) !== JSON.stringify(currentRoutineIds.sort())) {
        updateTeam(procurementTeam.id, { assignedRoutineIds: newRoutineIds });
      }
    }
  }
};

function App() {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    // Initialize teams and users on app start
    initializeTeamsAndUsers();
  }, []);
  
  // Login state management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'supply' | 'scope-routines' | 'users' | 'my-routines' | 'shared-routines' | 'routines-library' | 'escalation' | 'production' | 'so-book' | 'wo-book' | 'customer' | 'missing-parts' | 'line-of-balance' | 'planning' | 'events-explorer' | 'simulation' | 'team-routines'>('home');
  const [teamRoutinesTeamId, setTeamRoutinesTeamId] = useState<string | null>(null);
  
  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUserData = localStorage.getItem('pelico-user-data');
    if (storedUserData) {
      try {
        const data = JSON.parse(storedUserData);
        setUserData(data);
        setIsLoggedIn(true);
        // Check if onboarding should be shown
        const onboardingCompleted = localStorage.getItem('pelico-onboarding-tasks-status');
        if (!onboardingCompleted || !JSON.parse(onboardingCompleted)['set-up-workspace']) {
          setShowOnboarding(true);
        }
      } catch {
        // Invalid stored data, show login
      }
    }
  }, []);

  const handleLogin = (loginUserData: { email: string; firstName: string; lastName: string }) => {
    setUserData(loginUserData);
    setIsLoggedIn(true);
    setShowOnboarding(true);
    // Store user data in localStorage
    localStorage.setItem('pelico-user-data', JSON.stringify(loginUserData));
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    // Clear user data and onboarding state
    localStorage.removeItem('pelico-user-data');
    localStorage.removeItem('pelico-onboarding-tasks-status');
    localStorage.removeItem('pelico-simple-onboarding-state');
    // Reset state
    setIsLoggedIn(false);
    setUserData(null);
    setShowOnboarding(false);
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <ToastProvider>
        <LoginPage onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  // Show onboarding wizard if logged in and onboarding not completed
  if (showOnboarding) {
    return (
      <ToastProvider>
        <SimpleOnboardingWizard
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setShowOnboarding(false);
            }
          }}
          onComplete={handleOnboardingComplete}
          userData={userData}
        />
      </ToastProvider>
    );
  }

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      setCurrentPage('home');
    } else if (page === 'scope-routines') {
      setCurrentPage('scope-routines');
    } else if (page === 'supply') {
      setCurrentPage('supply');
    } else if (page === 'users') {
      setCurrentPage('users');
    } else if (page === 'my-routines') {
      setCurrentPage('my-routines');
    } else if (page === 'shared-routines') {
      setCurrentPage('shared-routines');
    } else if (page === 'routines-library') {
      setCurrentPage('routines-library');
    } else if (page === 'escalation') {
      setCurrentPage('escalation');
    } else if (page === 'production') {
      setCurrentPage('production');
    } else if (page === 'so-book') {
      setCurrentPage('so-book');
    } else if (page === 'wo-book') {
      setCurrentPage('wo-book');
    } else if (page === 'customer') {
      setCurrentPage('customer');
    } else if (page === 'missing-parts') {
      setCurrentPage('missing-parts');
    } else if (page === 'line-of-balance') {
      setCurrentPage('line-of-balance');
    } else if (page === 'planning') {
      setCurrentPage('planning');
    } else if (page === 'events-explorer') {
      setCurrentPage('events-explorer');
    } else if (page === 'simulation') {
      setCurrentPage('simulation');
    } else if (page.startsWith('team-routines/')) {
      const teamId = page.replace('team-routines/', '');
      setTeamRoutinesTeamId(teamId);
      setCurrentPage('team-routines');
    }
  };

  // Wrap pages in ErrorBoundary for graceful error handling
  const renderPage = () => {
    if (currentPage === 'home') {
      return (
        <ErrorBoundary>
          <HomePage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'scope-routines') {
      return (
        <ErrorBoundary>
          <ScopeAndRoutinesPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'users') {
      return (
        <ErrorBoundary>
          <UsersPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'team-routines' && teamRoutinesTeamId) {
      return (
        <ErrorBoundary>
          <TeamRoutinesPage teamId={teamRoutinesTeamId} onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'my-routines' || currentPage === 'shared-routines') {
      return (
        <ErrorBoundary>
          <ScopeAndRoutinesPage onNavigate={handleNavigate} viewMode={currentPage} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'routines-library') {
      return (
        <ErrorBoundary>
          <RoutineLibraryPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'escalation') {
      return (
        <ErrorBoundary>
          <EscalationRoomPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'production') {
      return (
        <ErrorBoundary>
          <ProductionControlPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'so-book') {
      return (
        <ErrorBoundary>
          <ServiceOrderBookPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'wo-book') {
      return (
        <ErrorBoundary>
          <WorkOrderBookPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'customer') {
      return (
        <ErrorBoundary>
          <CustomerSupportPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'missing-parts') {
      return (
        <ErrorBoundary>
          <MissingPartsPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'line-of-balance') {
      return (
        <ErrorBoundary>
          <LineOfBalancePage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'planning') {
      return (
        <ErrorBoundary>
          <PlanningPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'events-explorer') {
      return (
        <ErrorBoundary>
          <EventsExplorerPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'simulation') {
      return (
        <ErrorBoundary>
          <SimulationBasketPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    if (currentPage === 'supply') {
      return (
        <ErrorBoundary>
          <PurchaseOrderBookPage onNavigate={handleNavigate} onLogout={handleLogout} />
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <HomePage onNavigate={handleNavigate} onLogout={handleLogout} />
      </ErrorBoundary>
    );
  };

  return (
    <ToastProvider>
      {renderPage()}
    </ToastProvider>
  );
}

export default App;
