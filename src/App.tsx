import { useState, useEffect, Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/toast';
import { createTeam, getTeamByName, updateTeam } from './lib/teams';
import { getCurrentUserId, clearAllUsersExceptAdmin } from './lib/users';
import { getRoutines, createRoutine, updateRoutine } from './lib/routines';
import { clearAllScopes } from './lib/scopes';
import { safeGetItem, safeSetItem, safeRemoveItem } from './lib/utils/storage';
import './index.css';

// Lazy load pages to reduce initial bundle size
const PurchaseOrderBookPage = lazy(() => import('./components/PurchaseOrderBookPage').then(m => ({ default: m.PurchaseOrderBookPage })));
const ScopeAndRoutinesPage = lazy(() => import('./components/ScopeAndRoutinesPage').then(m => ({ default: m.ScopeAndRoutinesPage })));
const HomePage = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const UsersPage = lazy(() => import('./components/UsersPage').then(m => ({ default: m.UsersPage })));
const RoutineLibraryPage = lazy(() => import('./components/RoutineLibraryPage').then(m => ({ default: m.RoutineLibraryPage })));
const EscalationRoomPage = lazy(() => import('./components/EscalationRoomPage').then(m => ({ default: m.EscalationRoomPage })));
const ProductionControlPage = lazy(() => import('./components/ProductionControlPage').then(m => ({ default: m.ProductionControlPage })));
const ServiceOrderBookPage = lazy(() => import('./components/ServiceOrderBookPage').then(m => ({ default: m.ServiceOrderBookPage })));
const WorkOrderBookPage = lazy(() => import('./components/WorkOrderBookPage').then(m => ({ default: m.WorkOrderBookPage })));
const CustomerSupportPage = lazy(() => import('./components/CustomerSupportPage').then(m => ({ default: m.CustomerSupportPage })));
const MissingPartsPage = lazy(() => import('./components/MissingPartsPage').then(m => ({ default: m.MissingPartsPage })));
const LineOfBalancePage = lazy(() => import('./components/LineOfBalancePage').then(m => ({ default: m.LineOfBalancePage })));
const PlanningPage = lazy(() => import('./components/PlanningPage').then(m => ({ default: m.PlanningPage })));
const EventsExplorerPage = lazy(() => import('./components/EventsExplorerPage').then(m => ({ default: m.EventsExplorerPage })));
const SimulationBasketPage = lazy(() => import('./components/SimulationBasketPage').then(m => ({ default: m.SimulationBasketPage })));
const TeamRoutinesPage = lazy(() => import('./components/TeamRoutinesPage').then(m => ({ default: m.TeamRoutinesPage })));
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const SimpleOnboardingWizard = lazy(() => import('./components/SimpleOnboardingWizard/SimpleOnboardingWizard').then(m => ({ default: m.SimpleOnboardingWizard })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-muted-foreground">Chargement...</div>
  </div>
);

// Initialize teams and users if they don't exist
const initializeTeamsAndUsers = () => {
  // Clear all users except admin - list starts empty by default
  clearAllUsersExceptAdmin();
  
  // Clear all scopes - list starts empty by default
  clearAllScopes();
  
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

  // Users are not created by default - list starts empty
  // Users will be created manually through the UI

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
    const storedUserData = safeGetItem<{ email: string; firstName: string; lastName: string }>('pelico-user-data');
    if (storedUserData) {
      setUserData(storedUserData);
      setIsLoggedIn(true);
      // Check if onboarding should be shown
      const onboardingCompleted = safeGetItem<Record<string, boolean>>('pelico-onboarding-tasks-status');
      if (!onboardingCompleted || !onboardingCompleted['set-up-workspace']) {
        setShowOnboarding(true);
      }
    }
  }, []);

  const handleLogin = (loginUserData: { email: string; firstName: string; lastName: string }) => {
    setUserData(loginUserData);
    setIsLoggedIn(true);
    setShowOnboarding(true);
    // Store user data in localStorage using safe utility
    safeSetItem('pelico-user-data', loginUserData);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    // Clear user data and onboarding state using safe utilities
    safeRemoveItem('pelico-user-data');
    safeRemoveItem('pelico-onboarding-tasks-status');
    safeRemoveItem('pelico-simple-onboarding-state');
    // Reset state
    setIsLoggedIn(false);
    setUserData(null);
    setShowOnboarding(false);
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <LoginPage onLogin={handleLogin} />
        </Suspense>
      </ToastProvider>
    );
  }

  // Show onboarding wizard if logged in and onboarding not completed
  if (showOnboarding) {
    return (
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <SimpleOnboardingWizard
            open={true}
            onOpenChange={(open: boolean) => {
              if (!open) {
                setShowOnboarding(false);
              }
            }}
            onComplete={handleOnboardingComplete}
            userData={userData}
          />
        </Suspense>
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

  // Wrap pages in ErrorBoundary and Suspense for graceful error handling and lazy loading
  const renderPage = () => {
    if (currentPage === 'home') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <HomePage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'scope-routines') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <ScopeAndRoutinesPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'users') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <UsersPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'team-routines' && teamRoutinesTeamId) {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <TeamRoutinesPage teamId={teamRoutinesTeamId} onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'my-routines' || currentPage === 'shared-routines') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <ScopeAndRoutinesPage onNavigate={handleNavigate} viewMode={currentPage} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'routines-library') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <RoutineLibraryPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'escalation') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <EscalationRoomPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'production') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <ProductionControlPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'so-book') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <ServiceOrderBookPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'wo-book') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <WorkOrderBookPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'customer') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <CustomerSupportPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'missing-parts') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <MissingPartsPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'line-of-balance') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <LineOfBalancePage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'planning') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <PlanningPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'events-explorer') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <EventsExplorerPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'simulation') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <SimulationBasketPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    if (currentPage === 'supply') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <PurchaseOrderBookPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <HomePage onNavigate={handleNavigate} onLogout={handleLogout} />
        </Suspense>
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
