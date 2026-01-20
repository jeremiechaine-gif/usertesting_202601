/**
 * Step 4: Create and Apply Scopes
 * Assign scopes to each team member individually
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Target, CheckCircle2, X, Search, Plus, Star, Edit2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleTeamConfig } from './SimpleOnboardingWizard';
import { getAvailableScopes } from '@/lib/onboarding/teamWizardUtils';
import { getUsers, updateUser, type User } from '@/lib/users';
import { getScopes, type Scope, createInstanceFromTemplate, isInstance } from '@/lib/scopes';
import { ScopeModal } from '../ScopeModal';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export type ScopeAssignmentSubstep = 'template-scope' | 'assign-scopes';

interface ScopeAssignmentStepProps {
  teams: SimpleTeamConfig[];
  onTeamsUpdate: (teams: SimpleTeamConfig[]) => void;
  onNext: () => void;
  onBack: () => void;
  onClearAll: () => void;
  currentSubstep?: ScopeAssignmentSubstep;
  onSubstepChange?: (substep: ScopeAssignmentSubstep) => void;
}

export const ScopeAssignmentStep: React.FC<ScopeAssignmentStepProps> = ({
  teams,
  onTeamsUpdate,
  onBack,
  onNext,
  onClearAll,
  currentSubstep = 'template-scope',
  onSubstepChange,
}) => {
  const [availableScopes, setAvailableScopes] = useState<Scope[]>([]);
  const [userDefaultScopes, setUserDefaultScopes] = useState<Record<string, string>>({});
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [scopeToDuplicate, setScopeToDuplicate] = useState<Scope | null>(null);
  const [scopeSearchQuery, setScopeSearchQuery] = useState<Record<string, string>>({});
  const [openScopePopover, setOpenScopePopover] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render after user updates

  useEffect(() => {
    const scopes = getAvailableScopes();
    setAvailableScopes(scopes);
    
    // Initialize userDefaultScopes from users' defaultScopeId
    const defaultScopes: Record<string, string> = {};
    teams.forEach(team => {
      const teamMembers = getTeamMembers(team.id);
      teamMembers.forEach(member => {
        if (member.defaultScopeId) {
          defaultScopes[member.id] = member.defaultScopeId;
        }
      });
    });
    setUserDefaultScopes(defaultScopes);
  }, [scopeModalOpen, refreshKey, teams]); // Reload when modal closes, refreshKey changes, or teams change

  const handleUserScopeToggle = (userId: string, scopeId: string) => {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return;
    
    if (!user.assignedScopeIds) {
      user.assignedScopeIds = [];
    }
    
    const scopeIndex = user.assignedScopeIds.indexOf(scopeId);
    if (scopeIndex === -1) {
      user.assignedScopeIds.push(scopeId);
      // If it's the first scope, set it as default
      if (user.assignedScopeIds.length === 1) {
        setUserDefaultScopes({ ...userDefaultScopes, [userId]: scopeId });
        updateUser(userId, { defaultScopeId: scopeId });
      }
    } else {
      user.assignedScopeIds.splice(scopeIndex, 1);
      // Remove from default if it was the default
      if (userDefaultScopes[userId] === scopeId) {
        const newDefaultScopes = { ...userDefaultScopes };
        delete newDefaultScopes[userId];
        setUserDefaultScopes(newDefaultScopes);
        updateUser(userId, { defaultScopeId: undefined });
      }
    }
    
    // Update user in localStorage
    updateUser(userId, { assignedScopeIds: user.assignedScopeIds });
    
    // Force re-render to show updated scopes
    setRefreshKey(prev => prev + 1);
  };

  const handleSetDefaultScope = (userId: string, scopeId: string) => {
    setUserDefaultScopes({ ...userDefaultScopes, [userId]: scopeId });
    updateUser(userId, { defaultScopeId: scopeId });
    // Force re-render
    setRefreshKey(prev => prev + 1);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserScopes = (userId: string): Scope[] => {
    const user = getUsers().find(u => u.id === userId);
    if (!user || !user.assignedScopeIds) {
      return [];
    }
    // Use getScopes() to get ALL scopes (templates + instances), not just availableScopes
    // This ensures we display all scopes assigned to the user, including customized instances
    const allScopes = getScopes();
    const scopes = allScopes.filter(s => user.assignedScopeIds!.includes(s.id));
    return scopes;
  };

  // Handle template selection - create instance and open edit modal directly
  const handleTemplateClick = (template: Scope, memberId: string) => {
    // Create instance from template immediately
    const instance = createInstanceFromTemplate(template.id, memberId);
    if (instance) {
      // Assign instance to user
      const user = getUsers().find(u => u.id === memberId);
      if (user) {
        if (!user.assignedScopeIds) {
          user.assignedScopeIds = [];
        }
        if (!user.assignedScopeIds.includes(instance.id)) {
          user.assignedScopeIds.push(instance.id);
          // If it's the first scope, set it as default
          if (user.assignedScopeIds.length === 1) {
            setUserDefaultScopes({ ...userDefaultScopes, [memberId]: instance.id });
            updateUser(memberId, { 
              assignedScopeIds: user.assignedScopeIds,
              defaultScopeId: instance.id 
            });
          } else {
            updateUser(memberId, { assignedScopeIds: user.assignedScopeIds });
          }
        }
      }
      
      // Open modal to customize the instance directly
      setCurrentMemberId(memberId);
      setEditingScope(instance);
      setScopeToDuplicate(null);
      setOpenScopePopover(null);
      setScopeModalOpen(true);
    }
  };

  const getFilteredScopes = (userId: string): Scope[] => {
    const query = scopeSearchQuery[userId] || '';
    const user = getUsers().find(u => u.id === userId);
    const selectedScopeIds = user?.assignedScopeIds || [];
    
    return availableScopes.filter(scope => {
      const matchesSearch = !query || 
        scope.name.toLowerCase().includes(query.toLowerCase()) ||
        scope.description?.toLowerCase().includes(query.toLowerCase());
      const isNotSelected = !selectedScopeIds.includes(scope.id);
      return matchesSearch && isNotSelected;
    });
  };

  // Check if a scope is shared (used by other members)
  const isScopeShared = (scopeId: string, excludeUserId: string): boolean => {
    const users = getUsers();
    return users.some(user => 
      user.id !== excludeUserId && 
      user.assignedScopeIds && 
      user.assignedScopeIds.includes(scopeId)
    );
  };

  const getTeamMembers = (teamId: string): User[] => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    return getUsers().filter(u => team.memberIds.includes(u.id));
  };

  // Helper function to replace "Team" with "Équipe" in team names
  const formatTeamName = (name: string): string => {
    // Handle "Approvisionneur Team" -> "Équipe Approvisionneur"
    // First, try to match pattern "[Word] Team" and swap to "Équipe [Word]"
    const match = name.match(/^(.+?)\s+Team$/i);
    if (match) {
      return `Équipe ${match[1]}`;
    }
    // Replace "Team" at the beginning
    if (/^Team\s+/i.test(name)) {
      return name.replace(/^Team\s+/i, 'Équipe ');
    }
    // Replace "Team" anywhere else
    return name
      .replace(/\s+Team\s+/g, ' Équipe ')
      .replace(/Team\s+/g, 'Équipe ')
      .replace(/\s+Team$/i, '')
      .replace(/\s+Team/g, '');
  };

  // Helper function to replace "Team for" with "Équipe pour" in descriptions
  const formatTeamDescription = (description: string): string => {
    return description
      .replace(/Team for/gi, 'Équipe pour')
      .replace(/Team\s+/g, 'Équipe ');
  };

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-8 pt-4 space-y-6 pb-0">
            {/* Substep 3.1: Template scope - Show only "What is a Scope?" section */}
            {currentSubstep === 'template-scope' && (
              <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2063F0] to-[#31C7AD] mb-4 shadow-lg">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    Comprendre les périmètres et les routines
                  </h2>
                  <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                    Définir d'abord votre périmètre permet de créer les fondations sur lesquelles vos routines pourront ensuite s'appuyer pour accomplir efficacement vos missions.
                  </p>
                </div>

                {/* Definition Card - Scope */}
                <div className="bg-gradient-to-br from-[#2063F0]/5 via-[#31C7AD]/5 to-[#2063F0]/5 rounded-2xl p-6 mb-6 border-2 border-[#2063F0]/20 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#2063F0] to-[#2063F0]/80 flex items-center justify-center shadow-md">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        Qu'est-ce qu'un périmètre ?
                      </h3>
                      <p className="text-base text-foreground leading-relaxed mb-3">
                        Un <strong className="text-[#2063F0]">périmètre</strong> est l'ensemble précis des données dont vous êtes responsable dans votre travail quotidien. Il définit votre territoire d'action en filtrant uniquement les informations pertinentes pour votre rôle.
                      </p>
                      <div className="bg-background/60 rounded-lg p-4 border border-[#2063F0]/10">
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong className="text-foreground">Exemples concrets :</strong>
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1.5 ml-4 list-disc">
                          <li>Des usines ou lignes de production spécifiques</li>
                          <li>Certains codes produits, fournisseurs ou segments clients</li>
                          <li>Des périodes temporelles ou phases de projet particulières</li>
                          <li>Toute combinaison de filtres correspondant à vos responsabilités</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Message */}
                <div className="bg-gradient-to-r from-[#2063F0]/10 via-[#31C7AD]/10 to-[#2063F0]/10 rounded-xl p-5 mb-6 border-2 border-[#2063F0]/20 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-foreground mb-1">
                        Le message clé
                      </p>
                      <p className="text-base text-foreground">
                        Le <strong className="text-[#2063F0]">Scope</strong> est ce que je gère, la <strong className="text-[#31C7AD]">Routine</strong> est comment je le traite.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="flex justify-center">
                  <Button 
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      setEditingScope(null);
                      setScopeToDuplicate(null);
                      setScopeModalOpen(true);
                    }}
                    className="px-8 py-6 text-base font-semibold"
                  >
                    Créer un modèle de périmètre
                  </Button>
                </div>
              </div>
            )}

            {/* Substep 3.2: Assign scopes - Show teams grid with members */}
            {currentSubstep === 'assign-scopes' && (
              <>
                {/* Teams Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teams.map((team) => {
                const teamMembers = getTeamMembers(team.id);
                
                return (
                  <div
                    key={team.id}
                    className="rounded-xl border-2 border-border bg-background hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Team Header */}
                    <div className="p-5 bg-gradient-to-br from-[#2063F0]/5 to-[#31C7AD]/5 border-b border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">
                            {formatTeamName(team.name)}
                          </h3>
                          {team.description && (
                            <p className="text-sm text-muted-foreground">
                              {formatTeamDescription(team.description)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />
                          {teamMembers.length} membre{teamMembers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Team Content */}
                    <div className="p-5 space-y-4">
                      {teamMembers.length > 0 ? (
                        teamMembers.map((member) => {
                          const memberScopes = getUserScopes(member.id);
                          const defaultScopeId = userDefaultScopes[member.id] || member.defaultScopeId;
                          const availableScopesForMember = getFilteredScopes(member.id);
                          const popoverKey = `${team.id}-${member.id}`;
                          
                          return (
                            <div
                              key={member.id}
                              className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
                            >
                              {/* Member Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#2063F0] to-[#31C7AD] flex items-center justify-center text-white text-sm font-semibold">
                                    {getInitials(member.name)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-foreground">
                                      {member.name}
                                    </div>
                                  </div>
                                </div>
                                {memberScopes.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {memberScopes.length} périmètre{memberScopes.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>

                              {/* Scopes Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">Périmètres</span>
                                  <Popover 
                                    open={openScopePopover === popoverKey}
                                    onOpenChange={(open: boolean) => {
                                      setOpenScopePopover(open ? popoverKey : null);
                                      if (!open) {
                                        setScopeSearchQuery({ ...scopeSearchQuery, [member.id]: '' });
                                      }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-6 gap-1 text-xs"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Ajouter un périmètre
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-96 p-0" align="end">
                                      <div className="p-3 border-b border-border space-y-2">
                                        <div className="relative">
                                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            placeholder="Rechercher des périmètres..."
                                            value={scopeSearchQuery[member.id] || ''}
                                            onChange={(e) => setScopeSearchQuery({ ...scopeSearchQuery, [member.id]: e.target.value })}
                                            className="pl-8 h-9 text-sm"
                                          />
                                        </div>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => {
                                            setCurrentMemberId(member.id);
                                            setEditingScope(null);
                                            setScopeToDuplicate(null);
                                            setOpenScopePopover(null);
                                            setScopeModalOpen(true);
                                          }}
                                          className="w-full h-8 gap-1.5 text-xs"
                                        >
                                          <Plus className="h-3 w-3" />
                                          Créer un périmètre
                                        </Button>
                                      </div>
                                      <ScrollArea className="max-h-[400px]">
                                        <div className="p-2">
                                          {availableScopesForMember.length === 0 && availableScopes.length > 0 ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                              {scopeSearchQuery[member.id] ? 'Aucun périmètre trouvé' : 'Tous les périmètres sont assignés'}
                                            </div>
                                          ) : availableScopesForMember.length > 0 ? (
                                            <div className="space-y-1">
                                              {availableScopesForMember.map((scope) => (
                                                <div
                                                  key={scope.id}
                                                  className="group"
                                                >
                                                  <div className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-muted transition-colors">
                                                    <button
                                                      onClick={() => handleTemplateClick(scope, member.id)}
                                                      className="flex-1 flex items-start gap-3 text-left min-w-0"
                                                    >
                                                      <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-foreground group-hover:text-[#31C7AD] transition-colors mb-1">
                                                          {scope.name}
                                                        </div>
                                                        {scope.description && (
                                                          <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                                            {scope.description}
                                                          </div>
                                                        )}
                                                        {scope.filters && scope.filters.length > 0 && (
                                                          <div className="text-xs text-muted-foreground">
                                                            {scope.filters.length} filtre{scope.filters.length !== 1 ? 's' : ''}
                                                          </div>
                                                        )}
                                                      </div>
                                                      <Plus className="h-4 w-4 text-muted-foreground group-hover:text-[#31C7AD] transition-colors flex-shrink-0 mt-1" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                      </ScrollArea>
                                    </PopoverContent>
                                  </Popover>
                                </div>

                                {/* Selected Scopes */}
                                {memberScopes.length > 0 ? (
                                  <div className="space-y-2">
                                    {memberScopes.map((scope) => {
                                      const isDefault = defaultScopeId === scope.id;
                                      const isCustomized = isInstance(scope);
                                      return (
                                        <div
                                          key={scope.id}
                                          className="group relative flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20 hover:border-[#31C7AD]/40 transition-all"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                              <span className="text-sm font-medium text-foreground">
                                                {scope.name}
                                              </span>
                                              {isCustomized && (
                                                <Badge variant="secondary" className="text-xs h-4 px-1.5 bg-orange-500/10 text-orange-600 border-orange-500/30">
                                                  Personnalisé
                                                </Badge>
                                              )}
                                              {isDefault && (
                                                <Badge variant="secondary" className="text-xs h-4 px-1.5 bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/30 flex items-center gap-1">
                                                  <Star className="h-2.5 w-2.5 fill-[#2063F0]" />
                                                  Par défaut
                                                </Badge>
                                              )}
                                              {scope.filters && scope.filters.length > 0 && (
                                                <Badge variant="secondary" className="text-xs h-4 px-1.5 bg-muted text-muted-foreground border-border">
                                                  {scope.filters.length} filtre{scope.filters.length !== 1 ? 's' : ''}
                                                </Badge>
                                              )}
                                            </div>
                                            {scope.description && (
                                              <p className="text-xs text-muted-foreground line-clamp-1">
                                                {scope.description}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              onClick={() => {
                                                setCurrentMemberId(member.id);
                                                // If it's an instance, edit it directly
                                                // If it's a template, create an instance first
                                                if (isCustomized) {
                                                  setEditingScope(scope);
                                                  setScopeToDuplicate(null);
                                                } else {
                                                  // Template: create instance and edit
                                                  const instance = createInstanceFromTemplate(scope.id, member.id);
                                                  if (instance) {
                                                    // Replace template with instance in user's assigned scopes
                                                    const user = getUsers().find(u => u.id === member.id);
                                                    if (user && user.assignedScopeIds) {
                                                      const index = user.assignedScopeIds.indexOf(scope.id);
                                                      if (index !== -1) {
                                                        user.assignedScopeIds[index] = instance.id;
                                                        updateUser(member.id, { assignedScopeIds: user.assignedScopeIds });
                                                      }
                                                    }
                                                    setEditingScope(instance);
                                                    setScopeToDuplicate(null);
                                                  }
                                                }
                                                setScopeModalOpen(true);
                                              }}
                                              className="p-1 rounded-md hover:bg-[#31C7AD]/10 text-muted-foreground hover:text-[#31C7AD] transition-colors opacity-0 group-hover:opacity-100"
                                              title={isCustomized ? "Modifier le périmètre personnalisé" : "Personnaliser le modèle"}
                                            >
                                              <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            {!isDefault && (
                                              <button
                                                onClick={() => handleSetDefaultScope(member.id, scope.id)}
                                                className="p-1 rounded-md hover:bg-[#2063F0]/10 text-muted-foreground hover:text-[#2063F0] transition-colors opacity-0 group-hover:opacity-100"
                                                title="Set as default"
                                              >
                                                <Star className="h-3.5 w-3.5" />
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleUserScopeToggle(member.id, scope.id)}
                                              className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                              title="Remove scope"
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center py-4 px-4 rounded-lg border-2 border-dashed border-border bg-muted/20">
                                    <p className="text-xs text-muted-foreground">No scopes assigned</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
                          <div className="text-center">
                            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              Tous les membres sont assignés à cette équipe.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Scope Creation/Edit Modal */}
      {scopeModalOpen && (
        <ScopeModal
          open={scopeModalOpen}
          onOpenChange={(open) => {
            setScopeModalOpen(open);
            if (!open) {
              setEditingScope(null);
              setScopeToDuplicate(null);
              setCurrentMemberId(null);
            }
          }}
          scope={scopeToDuplicate ? {
            ...scopeToDuplicate,
            id: `temp-${Date.now()}`,
            name: scopeToDuplicate.name, // Keep original name, user can modify it
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } : editingScope || undefined}
          title={scopeToDuplicate ? "Modifier le périmètre" : editingScope ? (isInstance(editingScope) ? "Personnaliser le périmètre" : "Modifier le périmètre") : (currentMemberId ? `Périmètre de ${getUsers().find(u => u.id === currentMemberId)?.name || ''}` : "Créer un modèle de périmètre")}
          saveButtonText={scopeToDuplicate ? "Ajouter le périmètre" : editingScope ? (isInstance(editingScope) ? "Mettre à jour le périmètre" : "Mettre à jour le périmètre") : "Créer le modèle"}
          isTemplateScope={currentSubstep === 'template-scope' && !editingScope && !scopeToDuplicate}
          memberName={currentMemberId && !editingScope && !scopeToDuplicate ? getUsers().find(u => u.id === currentMemberId)?.name : undefined}
          onSave={(createdScopeId) => {
            // Reload scopes after creation/update
            const newScopes = getAvailableScopes();
            setAvailableScopes(newScopes);
            
            // If creating a new scope template (not editing) and we have a current member, assign it automatically
            if (currentMemberId && !editingScope && !scopeToDuplicate) {
              // Use the created scope ID if provided, otherwise find it
              let scopeToAssign: Scope | undefined;
              
              if (createdScopeId) {
                // Use the ID directly from the callback
                scopeToAssign = getScopes().find(s => s.id === createdScopeId);
              } else {
                // Fallback: find the newly created scope by comparing before/after
                const oldScopes = getAvailableScopes();
                const oldScopeIds = new Set(oldScopes.map(s => s.id));
                scopeToAssign = newScopes.find(s => !oldScopeIds.has(s.id));
              }
              
              if (scopeToAssign) {
                const user = getUsers().find(u => u.id === currentMemberId);
                
                if (user) {
                  const assignedScopeIds = user.assignedScopeIds || [];
                  if (!assignedScopeIds.includes(scopeToAssign.id)) {
                    assignedScopeIds.push(scopeToAssign.id);
                    // If it's the first scope, set it as default
                    if (assignedScopeIds.length === 1) {
                      setUserDefaultScopes({ ...userDefaultScopes, [currentMemberId]: scopeToAssign.id });
                      updateUser(currentMemberId, { 
                        assignedScopeIds: assignedScopeIds,
                        defaultScopeId: scopeToAssign.id 
                      });
                    } else {
                      updateUser(currentMemberId, { assignedScopeIds: assignedScopeIds });
                    }
                    // Force re-render
                    setRefreshKey(prev => prev + 1);
                  }
                }
              }
            }
            
            // If duplicating a scope, assign the new copy to the current member
            if (currentMemberId && scopeToDuplicate) {
              let scopeToAssign: Scope | undefined;
              
              if (createdScopeId) {
                scopeToAssign = getScopes().find(s => s.id === createdScopeId);
              } else {
                // Fallback: find the newly created scope
                const oldScopes = getAvailableScopes();
                const oldScopeIds = new Set(oldScopes.map(s => s.id));
                scopeToAssign = newScopes.find(s => !oldScopeIds.has(s.id));
              }
              
              if (scopeToAssign) {
                const user = getUsers().find(u => u.id === currentMemberId);
                if (user) {
                  const assignedScopeIds = user.assignedScopeIds || [];
                  if (!assignedScopeIds.includes(scopeToAssign.id)) {
                    assignedScopeIds.push(scopeToAssign.id);
                    // If it's the first scope, set it as default
                    if (assignedScopeIds.length === 1) {
                      setUserDefaultScopes({ ...userDefaultScopes, [currentMemberId]: scopeToAssign.id });
                      updateUser(currentMemberId, { 
                        assignedScopeIds: assignedScopeIds,
                        defaultScopeId: scopeToAssign.id 
                      });
                    } else {
                      updateUser(currentMemberId, { assignedScopeIds: assignedScopeIds });
                    }
                    // Force re-render
                    setRefreshKey(prev => prev + 1);
                  }
                }
              }
            }
            
            setScopeModalOpen(false);
            setEditingScope(null);
            setScopeToDuplicate(null);
            setCurrentMemberId(null);
          }}
        />
      )}
    </>
  );
};


