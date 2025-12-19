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
}

export const RoutineReviewStep: React.FC<RoutineReviewStepProps> = ({
  groupedRoutines,
  selectedRoutineIds,
  onRoutineToggle,
  onComplete,
  onBack,
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
    frequency: 'Daily' | 'Weekly' | 'Monthly'
  ) => {
    if (routines.length === 0) return null;

    const selectedRoutines = routines.filter((r) =>
      selectedRoutineIds.includes(r.routine.id)
    );

    if (selectedRoutines.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {selectedRoutines.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {selectedRoutines.map((scored) => {
            const routine = scored.routine;
            const isSelected = selectedRoutineIds.includes(routine.id);
            return (
              <div
                key={routine.id}
                className={cn(
                  'flex items-start justify-between p-3 rounded-lg border bg-background',
                  'hover:border-[#2063F0] transition-colors'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h4 className="font-medium text-sm">{routine.label}</h4>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {routine.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {routine.pelicoViews.slice(0, 2).map((view) => (
                      <Badge
                        key={view}
                        variant="outline"
                        className="text-xs"
                      >
                        {view}
                      </Badge>
                    ))}
                    {routine.pelicoViews.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{routine.pelicoViews.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveRoutine(routine.id)}
                  className="ml-3 p-1 rounded hover:bg-muted shrink-0"
                  aria-label={`Remove ${routine.label}`}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
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
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {hasSelectedRoutines ? (
              <>
                {renderRoutineGroup('Daily', groupedRoutines.Daily, 'Daily')}
                {renderRoutineGroup('Weekly', groupedRoutines.Weekly, 'Weekly')}
                {renderRoutineGroup('Monthly', groupedRoutines.Monthly, 'Monthly')}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <X className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No routines selected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add routines from the library to get started
                </p>
                <Button
                  onClick={() => setShowBrowseModal(true)}
                  className="bg-[#2063F0] hover:bg-[#1a54d8]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Browse All Routines
                </Button>
              </div>
            )}

            {hasSelectedRoutines && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowBrowseModal(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Browse All Routines
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t flex items-center justify-between shrink-0 bg-muted/20">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              You can change this anytime later
            </p>
            <Button
              onClick={onComplete}
              disabled={!hasSelectedRoutines}
              className="bg-[#2063F0] hover:bg-[#1a54d8]"
            >
              Complete Setup
            </Button>
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

