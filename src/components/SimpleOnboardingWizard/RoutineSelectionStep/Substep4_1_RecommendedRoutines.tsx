/**
 * Substep 4.1: Understand Recommended Routines
 * Shows recommended routines for a team with context and explanations
 */

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Eye, Check, Plus, X, FilePlus } from 'lucide-react';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import type { RoutineLibraryEntry } from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';
import { TeamProgressIndicator } from './TeamProgressIndicator';
import type { SimpleTeamConfig } from '../SimpleOnboardingWizard';

interface Substep4_1_RecommendedRoutinesProps {
  teamId: string;
  teamName: string;
  teamPersona?: string;
  suggestedRoutineIds: string[];
  assignedRoutineIds: string[]; // Routines already assigned to the team
  onPreviewRoutine: (routineId: string) => void;
  onToggleRoutine: (routineId: string) => void; // Add or remove routine
  onAddAllSuggested: () => void;
  onCreateRoutine?: () => void; // Create new routine
  // Props for team progress indicator
  teams: SimpleTeamConfig[];
  currentTeamIndex: number;
  teamsWithPersona: SimpleTeamConfig[];
  onTeamClick?: (teamIndex: number) => void;
  getTeamRoutineCount?: (teamId: string) => number;
}

const PERSONA_FR_TO_EN: Record<string, string> = {
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

export const Substep4_1_RecommendedRoutines: React.FC<Substep4_1_RecommendedRoutinesProps> = ({
  teamId,
  teamName,
  teamPersona,
  suggestedRoutineIds,
  assignedRoutineIds,
  onPreviewRoutine,
  onToggleRoutine,
  onAddAllSuggested,
  onCreateRoutine,
  teams,
  currentTeamIndex,
  teamsWithPersona,
  onTeamClick,
  getTeamRoutineCount,
}) => {
  // Get routine details from library
  const suggestedRoutines = ROUTINE_LIBRARY.filter(r => suggestedRoutineIds.includes(r.id));
  
  // Calculate statistics
  const addedCount = useMemo(() => {
    return suggestedRoutines.filter(r => assignedRoutineIds.includes(r.id)).length;
  }, [suggestedRoutines, assignedRoutineIds]);
  
  const remainingCount = suggestedRoutines.length - addedCount;
  
  // Check if routine is already added
  const isRoutineAdded = (routineId: string) => assignedRoutineIds.includes(routineId);

  // Get English persona for explanation
  const englishPersona = teamPersona ? PERSONA_FR_TO_EN[teamPersona] || teamPersona : null;

  // Group routines by objective
  const routinesByObjective = suggestedRoutines.reduce((acc, routine) => {
    const objective = routine.objectives && routine.objectives.length > 0 
      ? routine.objectives[0] 
      : 'Other';
    if (!acc[objective]) {
      acc[objective] = [];
    }
    acc[objective].push(routine);
    return acc;
  }, {} as Record<string, RoutineLibraryEntry[]>);

  const objectiveOrder: Record<string, number> = {
    'Anticipate': 1,
    'Monitor': 2,
    'Correct': 3,
    'Prioritize': 4,
    'Report': 5,
    'Other': 6,
  };

  const sortedObjectives = Object.keys(routinesByObjective).sort((a, b) => {
    const orderA = objectiveOrder[a] || 999;
    const orderB = objectiveOrder[b] || 999;
    return orderA - orderB;
  });

  return (
    <div className="space-y-6">
      {/* Team Progress Indicator */}
      <TeamProgressIndicator
        teams={teams}
        currentTeamIndex={currentTeamIndex}
        teamsWithPersona={teamsWithPersona}
        onTeamClick={onTeamClick}
        getTeamRoutineCount={getTeamRoutineCount}
      />

      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">
          Recommended routines for {teamName}
        </h3>
        {teamPersona && englishPersona && (
          <p className="text-sm text-muted-foreground">
            Based on the <span className="font-medium">{englishPersona}</span> role, these routines will help optimize your daily workflow.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {(suggestedRoutines.length > 0 && remainingCount > 0) || onCreateRoutine ? (
        <div className="flex items-center gap-3">
          {onCreateRoutine && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateRoutine}
              className="gap-2"
            >
              <FilePlus className="h-4 w-4" />
              <span className="font-medium">Create routine</span>
            </Button>
          )}
          {suggestedRoutines.length > 0 && remainingCount > 0 && (
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddAllSuggested}
                className="gap-2 border-[#31C7AD]/40 hover:bg-[#31C7AD]/10 hover:border-[#31C7AD] transition-all"
              >
                <Sparkles className="h-4 w-4 text-[#31C7AD]" />
                <span className="font-medium">Add {remainingCount} remaining</span>
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {/* Routines by Objective */}
      {suggestedRoutines.length > 0 ? (
        <div className="space-y-6">
          {sortedObjectives.map((objective) => {
            const routines = routinesByObjective[objective];
            return (
              <div key={objective} className="space-y-3">
                {/* Objective Header */}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground/90">
                    {objective}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {routines.length} routine{routines.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Routines Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {routines.map((routine) => {
                    const isAdded = isRoutineAdded(routine.id);
                    return (
                      <div
                        key={routine.id}
                        className={cn(
                          "group relative p-4 rounded-lg transition-all border-2",
                          isAdded
                            ? "bg-[#31C7AD]/5 border-[#31C7AD]/20 hover:border-[#31C7AD]/30"
                            : "bg-muted/30 border-dashed border-border/60 hover:border-[#31C7AD]/40 hover:shadow-md"
                        )}
                      >
                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                          <Badge 
                            variant="outline" 
                            className="text-xs h-5 px-2 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30 flex items-center gap-1"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            Suggested
                          </Badge>
                          {isAdded && (
                            <div
                              className="h-5 w-5 rounded-full bg-[#31C7AD] flex items-center justify-center cursor-pointer hover:bg-[#31C7AD]/80 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleRoutine(routine.id);
                              }}
                              title="Click to remove"
                            >
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Routine Info */}
                        <div className="space-y-2 pr-24">
                          <h5 className={cn(
                            "font-semibold text-sm leading-tight",
                            isAdded && "text-muted-foreground"
                          )}>
                            {routine.label}
                          </h5>
                          {routine.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {routine.description}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex flex-wrap gap-1.5 items-center pt-1">
                            {/* Pelico View */}
                            {routine.pelicoViews && routine.pelicoViews.length > 0 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs h-4 px-1.5 bg-pink-500/10 text-pink-600 border-pink-500/30"
                              >
                                {routine.pelicoViews[0]}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 pt-3 border-t border-border flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPreviewRoutine(routine.id)}
                            className="flex-1 gap-2 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                          </Button>
                          {!isAdded ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onToggleRoutine(routine.id)}
                              className="flex-1 gap-2 text-xs bg-[#31C7AD] hover:bg-[#31C7AD]/90"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onToggleRoutine(routine.id)}
                              className="flex-1 gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-3.5 w-3.5" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            No recommended routines for this role.
          </p>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            You can add routines manually or create new ones.
          </p>
        </div>
      )}

    </div>
  );
};
