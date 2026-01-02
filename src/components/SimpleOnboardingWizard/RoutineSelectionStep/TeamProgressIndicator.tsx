/**
 * Team Progress Indicator - Simplified & Factorized
 * Shows which team is currently being processed and allows navigation between teams
 * 
 * UX Improvements:
 * - Removed redundant progress bar (shown in main header)
 * - Removed redundant title (factorized with main header)
 * - Clickable team names for navigation
 * - Cleaner, more focused design
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleTeamConfig } from '../SimpleOnboardingWizard';

interface TeamProgressIndicatorProps {
  teams: SimpleTeamConfig[];
  currentTeamIndex: number;
  teamsWithPersona: SimpleTeamConfig[];
  onTeamClick?: (teamIndex: number) => void;
  // Function to get routine count for a team
  getTeamRoutineCount?: (teamId: string) => number;
}

export const TeamProgressIndicator: React.FC<TeamProgressIndicatorProps> = ({
  teams,
  currentTeamIndex,
  teamsWithPersona,
  onTeamClick,
  getTeamRoutineCount,
}) => {
  const currentTeam = teamsWithPersona[currentTeamIndex];
  const totalTeams = teamsWithPersona.length;
  const completedTeams = currentTeamIndex;
  const remainingTeams = totalTeams - currentTeamIndex - 1;

  if (totalTeams === 0) return null;

  const handleTeamClick = (index: number) => {
    if (onTeamClick && index !== currentTeamIndex) {
      onTeamClick(index);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Teams List - Clickable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            All teams
          </span>
          {remainingTeams > 0 && (
            <span className="text-xs text-muted-foreground">
              {remainingTeams} remaining
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {teamsWithPersona.map((team, index) => {
            const isCompleted = index < currentTeamIndex;
            const isCurrent = index === currentTeamIndex;
            const isPending = index > currentTeamIndex;
            const isClickable = onTeamClick && !isCurrent;
            const routineCount = getTeamRoutineCount ? getTeamRoutineCount(team.id) : (team.assignedRoutineIds?.length || 0);

            return (
              <div
                key={team.id}
                onClick={() => handleTeamClick(index)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 transition-all",
                  isCurrent && "bg-gradient-to-r from-[#2063F0]/10 to-[#31C7AD]/5 border-[#2063F0]/40 shadow-sm",
                  isCompleted && "bg-[#31C7AD]/5 border-[#31C7AD]/30",
                  isPending && "bg-muted/30 border-border/50 opacity-60",
                  isClickable && "cursor-pointer hover:border-[#2063F0]/40 hover:shadow-sm hover:opacity-100"
                )}
              >
                {/* Status Icon */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-[#31C7AD]" />
                  ) : isCurrent ? (
                    <div className="relative">
                      <Circle className="h-4 w-4 text-[#2063F0] fill-[#2063F0]" />
                      <div className="absolute inset-0 bg-[#2063F0] rounded-full animate-pulse opacity-30" />
                    </div>
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/30" />
                  )}
                </div>

                {/* Team Info */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      isCompleted && "text-[#31C7AD]",
                      isCurrent && "text-[#2063F0] font-semibold",
                      isPending && "text-muted-foreground",
                      isClickable && "hover:text-[#2063F0] transition-colors"
                    )}
                  >
                    {team.name}
                  </span>
                  <span className={cn(
                    "text-xs whitespace-nowrap",
                    isCurrent && "text-[#2063F0]",
                    isCompleted && "text-[#31C7AD]",
                    isPending && "text-muted-foreground"
                  )}>
                    Routines: {routineCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
