/**
 * Step 3: Routine Review
 * Shows curated list grouped by frequency (Daily, Weekly, Monthly)
 * User can remove routines, add from library, or continue
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import type { ScoredRoutine } from '@/lib/onboarding/scoring';
import { BrowseAllRoutines } from './BrowseAllRoutines';
import { cn } from '@/lib/utils';

interface RoutineReviewStepProps {
  groupedRoutines: {
    Daily: ScoredRoutine[];
    Weekly: ScoredRoutine[];
    Monthly: ScoredRoutine[];
  };
  selectedRoutineIds: string[];
  onRoutineToggle: (routineId: string, selected: boolean) => void;
  onComplete: () => void;
  onBack: () => void;
  onClearAll: () => void;
}

export const RoutineReviewStep: React.FC<RoutineReviewStepProps> = ({
  groupedRoutines,
  selectedRoutineIds,
  onRoutineToggle,
  onComplete,
  onBack,
  onClearAll,
}) => {
  const [showBrowseModal, setShowBrowseModal] = useState(false);

  const handleRemoveRoutine = (routineId: string) => {
    onRoutineToggle(routineId, false);
  };

  const handleAddRoutine = (routineId: string) => {
    onRoutineToggle(routineId, true);
  };

  const renderRoutineGroup = (
    title: string,
    routines: ScoredRoutine[],
    _frequency: 'Daily' | 'Weekly' | 'Monthly'
  ) => {
    if (routines.length === 0) return null;

    const selectedRoutines = routines.filter((r) =>
      selectedRoutineIds.includes(r.routine.id)
    );

    if (selectedRoutines.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {title}
            </span>
            <Badge variant="secondary" className="text-xs h-5 px-2 bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/20">
              {selectedRoutines.length}
            </Badge>
          </div>
        </div>
        <div className="space-y-3">
          {selectedRoutines.map((scored) => {
            const routine = scored.routine;
            return (
              <div
                key={routine.id}
                className={cn(
                  'group relative flex items-start justify-between p-4 rounded-xl transition-all',
                  'border-2 bg-gradient-to-br from-background to-muted/20',
                  'hover:border-[#31C7AD]/50 hover:shadow-md hover:from-[#31C7AD]/5'
                )}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="p-1 rounded-md bg-[#31C7AD]/10 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#31C7AD]" />
                    </div>
                    <h4 className="font-semibold text-sm leading-tight">{routine.label}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {routine.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {routine.pelicoViews.slice(0, 2).map((view) => (
                      <Badge
                        key={view}
                        variant="outline"
                        className="text-xs h-5 px-2 bg-background/50"
                      >
                        {view}
                      </Badge>
                    ))}
                    {routine.pelicoViews.length > 2 && (
                      <Badge variant="outline" className="text-xs h-5 px-2 bg-[#2063F0]/5 text-[#2063F0] border-[#2063F0]/20">
                        +{routine.pelicoViews.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveRoutine(routine.id)}
                  className="shrink-0 p-2 rounded-lg hover:bg-destructive/10 transition-all group/btn"
                  aria-label={`Remove ${routine.label}`}
                >
                  <X className="h-4 w-4 text-muted-foreground group-hover/btn:text-destructive transition-colors" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasSelectedRoutines = selectedRoutineIds.length > 0;

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-8 pt-4 space-y-6">
            {hasSelectedRoutines ? (
              <>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5">
                  <div className="p-2 rounded-lg bg-[#31C7AD]/10">
                    <CheckCircle2 className="h-5 w-5 text-[#31C7AD]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {selectedRoutineIds.length} routine{selectedRoutineIds.length > 1 ? 's' : ''} ready to create
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Review your selection and remove any you don't need
                    </p>
                  </div>
                </div>

                {renderRoutineGroup('Daily', groupedRoutines.Daily, 'Daily')}
                {renderRoutineGroup('Weekly', groupedRoutines.Weekly, 'Weekly')}
                {renderRoutineGroup('Monthly', groupedRoutines.Monthly, 'Monthly')}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 mb-6">
                  <Plus className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No routines selected</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Browse our library to discover and add routines that match your needs
                </p>
                <Button
                  onClick={() => setShowBrowseModal(true)}
                  className="h-11 px-8 bg-gradient-to-r from-[#2063F0] to-[#1a54d8] hover:from-[#1a54d8] hover:to-[#164ab8] shadow-lg shadow-[#2063F0]/30"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Browse All Routines
                </Button>
              </div>
            )}

          </div>
        </ScrollArea>

        <div className="px-8 py-4 border-t border-border/50 bg-background shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-[#2063F0] hover:bg-[#2063F0]/5 gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                Clear All
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground italic">
                You can customize these anytime
              </p>
              <Button
                onClick={onComplete}
                disabled={!hasSelectedRoutines}
                className="gap-2 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete Setup
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showBrowseModal && (
        <BrowseAllRoutines
          open={showBrowseModal}
          onOpenChange={setShowBrowseModal}
          selectedRoutineIds={selectedRoutineIds}
          onRoutineToggle={handleAddRoutine}
        />
      )}
    </>
  );
};

