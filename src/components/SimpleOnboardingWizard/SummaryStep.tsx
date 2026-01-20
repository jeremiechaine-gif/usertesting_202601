/**
 * Summary Step: Review everything created in the onboarding wizard
 * Shows teams, members, scopes, and routines in a clear, comprehensive way
 */

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Target, 
  Zap, 
  CheckCircle2,
  User,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleTeamConfig } from './SimpleOnboardingWizard';
import { getUsers } from '@/lib/users';
import { getScopes, type ScopeFilter } from '@/lib/scopes';
import { getRoutines } from '@/lib/routines';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import { filterDefinitions } from '@/lib/filterDefinitions';

interface SummaryStepProps {
  teams: SimpleTeamConfig[];
  onBack: () => void;
  onComplete: () => void;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  teams,
  onBack,
  onComplete,
}) => {
  // Get all data
  const allUsers = useMemo(() => getUsers(), []);
  const allScopes = useMemo(() => getScopes(), []);
  const allRoutines = useMemo(() => getRoutines(), []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMembers = teams.reduce((sum, team) => sum + team.memberIds.length, 0);
    const totalRoutines = teams.reduce((sum, team) => sum + team.assignedRoutineIds.length, 0);
    const uniqueRoutineIds = new Set(teams.flatMap(team => team.assignedRoutineIds));
    const uniqueMemberIds = new Set(teams.flatMap(team => team.memberIds));
    
    // Count scopes assigned to members
    const memberScopes = allUsers
      .filter(user => uniqueMemberIds.has(user.id))
      .reduce((sum, user) => sum + (user.assignedScopeIds?.length || 0), 0);
    
    return {
      teams: teams.length,
      members: totalMembers,
      uniqueMembers: uniqueMemberIds.size,
      scopes: allScopes.length,
      memberScopes,
      routines: uniqueRoutineIds.size,
      totalRoutineAssignments: totalRoutines,
    };
  }, [teams, allUsers, allScopes]);

  // Helper to get user details
  const getUserDetails = (userId: string) => {
    return allUsers.find(u => u.id === userId);
  };

  // Helper to get scope details
  const getScopeDetails = (scopeId: string) => {
    return allScopes.find(s => s.id === scopeId);
  };

  // Helper to get routine details (from user-created routines or library)
  const getRoutineDetails = (routineId: string) => {
    // First, try to find in user-created routines
    const userRoutine = allRoutines.find(r => r.id === routineId);
    if (userRoutine) {
      return {
        id: userRoutine.id,
        name: userRoutine.name,
        description: userRoutine.description,
      };
    }
    
    // If not found, try to find in library
    const libraryRoutine = ROUTINE_LIBRARY.find(r => r.id === routineId);
    if (libraryRoutine) {
      return {
        id: libraryRoutine.id,
        name: libraryRoutine.label,
        description: libraryRoutine.description,
      };
    }
    
    return null;
  };

  // Format team name (replace "Team" with "Équipe")
  const formatTeamName = (name: string): string => {
    return name
      .replace(/^Team\s+/i, 'Équipe ')
      .replace(/\s+Team$/i, '')
      .replace(/\s+Team\s+/g, ' Équipe ');
  };

  // Get filter label from filterId
  const getFilterLabel = (filterId: string): string => {
    const filterDef = filterDefinitions.find(f => f.id === filterId);
    return filterDef?.label || filterId;
  };

  // Format filter values for display (with human-readable labels from filter definitions)
  const formatFilterValues = (filter: ScopeFilter): string => {
    if (!filter.values || filter.values.length === 0) return '';
    
    const filterDef = filterDefinitions.find(f => f.id === filter.filterId);
    
    // If filter has options, use labels instead of raw values
    const displayValues = filter.values.map((val: string | number) => {
      if (filterDef?.options) {
        const option = filterDef.options.find((opt) => opt.value === val);
        return option?.label || String(val);
      }
      return String(val);
    });
    
    if (displayValues.length === 1) {
      return displayValues[0];
    }
    if (displayValues.length <= 3) {
      return displayValues.join(', ');
    }
    return `${displayValues.slice(0, 2).join(', ')} et ${displayValues.length - 2} autre${displayValues.length - 2 > 1 ? 's' : ''}`;
  };

  // Scope details component with expand/collapse
  const ScopeDetailsCard: React.FC<{ scope: NonNullable<ReturnType<typeof getScopeDetails>> }> = ({ scope }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasFilters = scope.filters && scope.filters.length > 0;

    return (
      <div className="p-2 rounded-md bg-background border border-border/40 hover:border-[#2063F0]/40 transition-all">
        <div className="flex items-start gap-1.5">
          <Target className="h-3 w-3 text-[#2063F0] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground break-words">
                  {scope.name}
                </p>
                {scope.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 break-words">
                    {scope.description}
                  </p>
                )}
              </div>
              {hasFilters && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-muted transition-colors shrink-0 group"
                  aria-label={isExpanded ? 'Masquer les détails' : 'Voir les détails'}
                >
                  <Badge
                    variant="secondary"
                    className="text-xs h-5 px-1.5 bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/20"
                  >
                    <Filter className="h-2.5 w-2.5 mr-1" />
                    {scope.filters.length} filtre{scope.filters.length !== 1 ? 's' : ''}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground group-hover:text-[#2063F0] transition-colors" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-[#2063F0] transition-colors" />
                  )}
                </button>
              )}
            </div>
            
            {/* Expanded filters details */}
            {isExpanded && hasFilters && (
              <div className="mt-2 pt-2 border-t border-border/40 space-y-2 animate-in slide-in-from-top-2 duration-200">
                {scope.filters.map((filter) => {
                  const filterLabel = getFilterLabel(filter.filterId);
                  const filterValues = formatFilterValues(filter);
                  
                  return (
                    <div
                      key={filter.id}
                      className="flex items-start gap-2 text-xs bg-muted/30 rounded-md p-2"
                    >
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#2063F0] mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {filterLabel}:
                          </span>
                          <span className="text-muted-foreground break-words">
                            {filterValues || 'Aucune valeur'}
                          </span>
                        </div>
                        {filter.condition && (
                          <span className="text-xs text-muted-foreground/70 mt-0.5 inline-block">
                            Condition: {filter.condition}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-8 pt-6 pb-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2063F0] to-[#31C7AD] mb-4 shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Récapitulatif de votre configuration
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Vérifiez tous les éléments créés avant de finaliser votre espace de travail
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-[#2063F0]/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#2063F0]/10">
                  <Building2 className="h-5 w-5 text-[#2063F0]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Équipes
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.teams}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-[#31C7AD]/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#31C7AD]/10">
                  <Users className="h-5 w-5 text-[#31C7AD]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Membres
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.uniqueMembers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-[#2063F0]/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#2063F0]/10">
                  <Target className="h-5 w-5 text-[#2063F0]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Périmètres
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.scopes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-background to-muted/20 border-2 border-[#31C7AD]/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#31C7AD]/10">
                  <Zap className="h-5 w-5 text-[#31C7AD]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Routines
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.routines}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Teams Details */}
          <div className="space-y-6">
            {teams.map((team) => {
              const teamMembers = team.memberIds
                .map(id => getUserDetails(id))
                .filter(Boolean);
              
              // Get routines: user-created + library routines
              const teamRoutines = team.assignedRoutineIds
                .map(id => getRoutineDetails(id))
                .filter((r): r is NonNullable<typeof r> => r !== null);

              return (
                <div
                  key={team.id}
                  className="bg-gradient-to-br from-background to-muted/20 border-2 border-[#2063F0]/20 rounded-xl p-6 shadow-sm"
                >
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-[#2063F0] to-[#2063F0]/80 shadow-lg shrink-0">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground mb-1 break-words">
                          {formatTeamName(team.name)}
                        </h3>
                        {team.description && (
                          <p className="text-sm text-muted-foreground break-words">
                            {team.description}
                          </p>
                        )}
                        {team.persona && (
                          <Badge
                            variant="secondary"
                            className="mt-2 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30"
                          >
                            {team.persona}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Members Section with Scopes */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-[#31C7AD]" />
                        <h4 className="text-sm font-semibold text-foreground">
                          Membres ({teamMembers.length})
                        </h4>
                      </div>
                      {teamMembers.length > 0 ? (
                        <div className="space-y-2">
                          {teamMembers.map((member) => {
                            if (!member) return null;
                            const memberScopes = (member.assignedScopeIds || [])
                              .map(id => getScopeDetails(id))
                              .filter(Boolean);
                            
                            return (
                              <div
                                key={member.id}
                                className="p-3 rounded-lg bg-muted/50 border border-border/60"
                              >
                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground break-words">
                                      {member.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground break-words">
                                      {member.email}
                                    </p>
                                    {memberScopes.length > 0 && (
                                      <div className="mt-2 space-y-1.5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                          Périmètres assignés:
                                        </p>
                                        <div className="space-y-1.5">
                                          {memberScopes.map((scope) => {
                                            if (!scope) return null;
                                            return (
                                              <ScopeDetailsCard key={scope.id} scope={scope} />
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Aucun membre assigné
                        </p>
                      )}
                    </div>

                    {/* Routines Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-[#31C7AD]" />
                        <h4 className="text-sm font-semibold text-foreground">
                          Routines ({teamRoutines.length})
                        </h4>
                      </div>
                      {teamRoutines.length > 0 ? (
                        <div className="space-y-2">
                          {teamRoutines.slice(0, 5).map((routine) => {
                            if (!routine) return null;
                            return (
                              <div
                                key={routine.id}
                                className="p-3 rounded-lg bg-muted/50 border border-border/60"
                              >
                                <div className="flex items-start gap-2">
                                  <Zap className="h-4 w-4 text-[#31C7AD] mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground break-words">
                                      {routine.name}
                                    </p>
                                    {routine.description && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                                        {routine.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {teamRoutines.length > 5 && (
                            <p className="text-xs text-muted-foreground italic">
                              +{teamRoutines.length - 5} autre(s) routine(s)
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Aucune routine assignée
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
