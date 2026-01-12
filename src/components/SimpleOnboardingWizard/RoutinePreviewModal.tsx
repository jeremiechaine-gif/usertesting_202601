/**
 * Routine Preview Modal
 * Displays a Pelico View page in a modal for previewing a routine
 */

import React, { Suspense, lazy } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { PelicoViewPage } from '@/lib/routines';
import { ScopeProvider, useScope } from '@/contexts/ScopeContext';

// Lazy load Pelico View pages to reduce initial bundle size
const PurchaseOrderBookPage = lazy(() => import('../PurchaseOrderBookPage').then(m => ({ default: m.PurchaseOrderBookPage })));
const ServiceOrderBookPage = lazy(() => import('../ServiceOrderBookPage').then(m => ({ default: m.ServiceOrderBookPage })));
const CustomerSupportPage = lazy(() => import('../CustomerSupportPage').then(m => ({ default: m.CustomerSupportPage })));
const EscalationRoomPage = lazy(() => import('../EscalationRoomPage').then(m => ({ default: m.EscalationRoomPage })));
const WorkOrderBookPage = lazy(() => import('../WorkOrderBookPage').then(m => ({ default: m.WorkOrderBookPage })));
const MissingPartsPage = lazy(() => import('../MissingPartsPage').then(m => ({ default: m.MissingPartsPage })));
const LineOfBalancePage = lazy(() => import('../LineOfBalancePage').then(m => ({ default: m.LineOfBalancePage })));
const PlanningPage = lazy(() => import('../PlanningPage').then(m => ({ default: m.PlanningPage })));
const EventsExplorerPage = lazy(() => import('../EventsExplorerPage').then(m => ({ default: m.EventsExplorerPage })));

interface RoutinePreviewModalProps {
  open: boolean;
  onClose: () => void;
  routineId: string;
  routineName: string;
  pelicoViewPage: PelicoViewPage;
  scopeId?: string | null; // Optional scope ID from wizard
}

// Map PelicoView string to PelicoViewPage
export function mapPelicoViewToPage(view: string): PelicoViewPage | null {
  const viewMap: Record<string, PelicoViewPage> = {
    'Supply': 'supply',
    'Production Control': 'so-book',
    'Customer Support': 'customer',
    'Escalation Room': 'escalation',
    'Value Engineering': 'planning',
    'Event Explorer': 'events-explorer',
    'Simulation': 'events-explorer',
  };
  return viewMap[view] || null;
}

// Inner component that uses ScopeContext
const RoutinePreviewContent: React.FC<{
  routineId: string;
  routineName: string;
  pelicoViewPage: PelicoViewPage;
  scopeId?: string | null;
  onClose: () => void;
}> = ({ routineId, routineName, pelicoViewPage, scopeId, onClose }) => {
  const { setCurrentScopeId } = useScope();

  // Set scope if provided
  React.useEffect(() => {
    if (scopeId) {
      setCurrentScopeId(scopeId);
    }
    // Cleanup: restore previous scope on unmount
    return () => {
      // Note: We don't restore the previous scope here to avoid side effects
      // The ScopeContext will handle scope persistence
    };
  }, [scopeId, setCurrentScopeId]);

  // Set routine ID in sessionStorage so the page can load it
  React.useEffect(() => {
    if (routineId) {
      sessionStorage.setItem('pendingRoutineId', routineId);
    }
    return () => {
      sessionStorage.removeItem('pendingRoutineId');
    };
  }, [routineId]);

  // Render the appropriate Pelico View page
  const renderPelicoViewPage = () => {
    const pageProps = {
      onNavigate: () => {}, // Prevent navigation in modal
      onLogout: () => {}, // Prevent logout in modal
    };

    switch (pelicoViewPage) {
      case 'supply':
        return <PurchaseOrderBookPage {...pageProps} />;
      case 'so-book':
        return <ServiceOrderBookPage {...pageProps} />;
      case 'customer':
        return <CustomerSupportPage {...pageProps} />;
      case 'escalation':
        return <EscalationRoomPage {...pageProps} />;
      case 'wo-book':
        return <WorkOrderBookPage {...pageProps} />;
      case 'missing-parts':
        return <MissingPartsPage {...pageProps} />;
      case 'line-of-balance':
        return <LineOfBalancePage {...pageProps} />;
      case 'planning':
        return <PlanningPage {...pageProps} />;
      case 'events-explorer':
        return <EventsExplorerPage {...pageProps} />;
      // Note: 'mro', 'production-control', and 'simulation' are not standard PelicoViewPage types
      // They may be mapped from other views
      default:
        return <div className="p-8 text-center text-muted-foreground">Page not found</div>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back button */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-background shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to routine
        </Button>
        <div className="flex-1" />
        <h2 className="text-lg font-semibold">{routineName}</h2>
      </div>

      {/* Pelico View Page Content */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        }>
          {renderPelicoViewPage()}
        </Suspense>
      </div>
    </div>
  );
};

export const RoutinePreviewModal: React.FC<RoutinePreviewModalProps> = ({
  open,
  onClose,
  routineId,
  routineName,
  pelicoViewPage,
  scopeId,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent
        className="max-w-[95vw] w-full h-[95vh] p-0 flex flex-col"
        style={{
          maxHeight: '95vh',
        }}
      >
        <ScopeProvider>
          <RoutinePreviewContent
            routineId={routineId}
            routineName={routineName}
            pelicoViewPage={pelicoViewPage}
            scopeId={scopeId}
            onClose={onClose}
          />
        </ScopeProvider>
      </DialogContent>
    </Dialog>
  );
};
