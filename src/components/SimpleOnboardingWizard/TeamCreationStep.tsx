/**
 * Step 0: Team Creation with Substeps
 * Substep 0.1: Choose mode (Create from personas / Manual setup)
 * Substep 0.2a: Select personas (if personas mode)
 * Substep 0.2b: Manual team creation (if manual mode)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, Settings, ArrowLeft, User, Plus, Sparkles, ChevronDown, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleTeamConfig, TeamCreationMode } from './SimpleOnboardingWizard';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';

// French personas (as shown in the image)
const PERSONAS = [
  'Approvisionneur',
  'Acheteur',
  'Manager Appro',
  'Ordonnanceur Assemblage',
  'Ordonnanceur',
  'Master Planner',
  'Support Logistique',
  'Recette',
  'Responsable Supply Chain',
  'Directeur Supply Chain',
  'Responsable Ordo & Support log',
  'Autre / Mixte',
];

export type TeamCreationSubstep = 'welcome' | 'mode-selection' | 'persona-selection' | 'manual-creation';

interface TeamCreationStepProps {
  teams: SimpleTeamConfig[];
  onTeamsUpdate: (teams: SimpleTeamConfig[]) => void;
  onNext: () => void;
  onBack: () => void;
  onClearAll: () => void;
  currentSubstep?: TeamCreationSubstep;
  onSubstepChange?: (substep: TeamCreationSubstep) => void;
  onValidationChange?: (canProceed: boolean) => void;
  onStep0Continue?: (handler: () => boolean) => void; // Register handler function
  userData?: { email: string; firstName: string; lastName: string } | null;
}

export const TeamCreationStep: React.FC<TeamCreationStepProps> = ({
  teams,
  onTeamsUpdate,
  onNext,
  onBack,
  onClearAll,
  currentSubstep = 'welcome',
  onSubstepChange,
  onValidationChange,
  onStep0Continue,
  userData,
}) => {
  const [creationMode, setCreationMode] = useState<TeamCreationMode | null>(null);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [manualTeamName, setManualTeamName] = useState('');
  const [manualTeamDescription, setManualTeamDescription] = useState('');
  const [manualTeamPersonas, setManualTeamPersonas] = useState<string[]>([]);
  const [personasPopoverOpen, setPersonasPopoverOpen] = useState(false);
  const onStep0ContinueRef = useRef(onStep0Continue);

  // Generate team ID
  const generateTeamId = () => `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Map French persona names to English for ROUTINE_LIBRARY lookup
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

  // Get suggested routines for persona
  const getSuggestedRoutinesForPersona = (persona: string): string[] => {
    const englishPersona = PERSONA_FR_TO_EN[persona] || persona;
    return ROUTINE_LIBRARY
      .filter(r => r.personas.includes(englishPersona as any))
      .map(r => r.id);
  };

  // Handle mode selection
  const handleModeSelect = (mode: TeamCreationMode) => {
    setCreationMode(mode);
    if (mode === 'personas') {
      onSubstepChange?.('persona-selection');
    } else {
      onSubstepChange?.('manual-creation');
    }
  };

  // Get personas that already have teams
  const getPersonasWithTeams = (): string[] => {
    return teams
      .filter(team => team.persona)
      .map(team => team.persona!);
  };

  // Handle persona selection
  const handlePersonaToggle = (persona: string) => {
    const personasWithTeams = getPersonasWithTeams();
    const hasExistingTeam = personasWithTeams.includes(persona);
    const isCurrentlySelected = selectedPersonas.includes(persona);

    if (isCurrentlySelected) {
      // Deselect: remove from selection and delete team if it exists
      setSelectedPersonas(prev => prev.filter(p => p !== persona));
      
      if (hasExistingTeam) {
        // Remove the team for this persona
        const updatedTeams = teams.filter(team => team.persona !== persona);
        onTeamsUpdate(updatedTeams);
      }
    } else {
      // Select: only allow if persona doesn't already have a team
      if (!hasExistingTeam) {
        setSelectedPersonas(prev => [...prev, persona]);
      }
    }
  };

  // Create teams from selected personas
  const handleCreateFromPersonas = () => {
    if (selectedPersonas.length === 0) return;

    const personasWithTeams = getPersonasWithTeams();
    // Only create teams for personas that don't already have teams
    const personasToCreate = selectedPersonas.filter(persona => !personasWithTeams.includes(persona));

    if (personasToCreate.length === 0) return;

    const newTeams: SimpleTeamConfig[] = personasToCreate.map(persona => {
      // Automatically assign suggested routines based on persona
      const suggestedRoutineIds = getSuggestedRoutinesForPersona(persona);
      
      return {
        id: generateTeamId(),
        name: `${persona} Team`,
        description: `Team for ${persona}`,
        persona,
        assignedRoutineIds: suggestedRoutineIds, // Automatically assign suggested routines
        memberIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    onTeamsUpdate([...teams, ...newTeams]);
    // Keep personas with existing teams selected, remove only newly created ones
    setSelectedPersonas(prev => prev.filter(persona => personasWithTeams.includes(persona)));
    setCreationMode(null);
    // Don't return to mode-selection, let the continue handler proceed to next step
  };

  // Create manual team
  const handleCreateManualTeam = () => {
    if (!manualTeamName.trim()) return;

    const newTeam: SimpleTeamConfig = {
      id: generateTeamId(),
      name: manualTeamName.trim(),
      description: manualTeamDescription.trim() || undefined,
      personas: manualTeamPersonas.length > 0 ? manualTeamPersonas : undefined,
      assignedRoutineIds: [],
      memberIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onTeamsUpdate([...teams, newTeam]);
    // Reset form but stay in manual-creation mode to allow creating more teams
    setManualTeamName('');
    setManualTeamDescription('');
    setManualTeamPersonas([]);
    // Don't reset creationMode - allow user to create more teams
  };

  // Handle persona toggle for manual team
  const handleManualPersonaToggle = (persona: string) => {
    setManualTeamPersonas(prev => 
      prev.includes(persona) 
        ? prev.filter(p => p !== persona)
        : [...prev, persona]
    );
  };

  // Pre-select personas that already have teams when entering persona-selection
  useEffect(() => {
    if (currentSubstep === 'persona-selection') {
      const personasWithTeams = teams
        .filter(team => team.persona)
        .map(team => team.persona!);
      if (personasWithTeams.length > 0 && selectedPersonas.length === 0) {
        setSelectedPersonas(personasWithTeams);
      }
    }
  }, [currentSubstep, teams, selectedPersonas.length]);

  // Handle back from substep
  const handleSubstepBack = () => {
    if (currentSubstep === 'persona-selection' || currentSubstep === 'manual-creation') {
      onSubstepChange?.('mode-selection');
      setCreationMode(null);
      // Don't clear selectedPersonas - keep them for when user returns
      setManualTeamName('');
      setManualTeamDescription('');
    } else if (currentSubstep === 'mode-selection') {
      onSubstepChange?.('welcome');
    } else {
      // Welcome screen - no back button needed (first step)
      // But allow it for flexibility
    }
  };

  // Handle continue from substep - exposed to parent
  const handleSubstepContinue = () => {
    // If teams already exist, always allow proceeding (user can have created teams and be on any substep)
    if (teams.length > 0) {
      return true;
    }

    // Otherwise, check substep-specific validation
    if (currentSubstep === 'welcome') {
      // Welcome screen now shows mode selection directly, so check if teams exist
      return false;
    } else if (currentSubstep === 'mode-selection') {
      // If teams already exist, can proceed
      return false;
    } else if (currentSubstep === 'persona-selection') {
      if (selectedPersonas.length === 0) {
        return false;
      }
      handleCreateFromPersonas();
      return true; // Teams created, can proceed
    } else if (currentSubstep === 'manual-creation') {
      if (manualTeamName.trim().length === 0) {
        return false;
      }
      handleCreateManualTeam();
      return true; // Team created, can proceed
    }
    return false;
  };

  // Keep ref updated
  useEffect(() => {
    onStep0ContinueRef.current = onStep0Continue;
  }, [onStep0Continue]);

  // Expose handleSubstepContinue to parent
  useEffect(() => {
    if (onStep0ContinueRef.current) {
      onStep0ContinueRef.current(handleSubstepContinue);
    }
  }, [currentSubstep, selectedPersonas, manualTeamName, teams.length]);

  // Notify parent about validation state
  useEffect(() => {
    // If teams already exist, always allow proceeding
    if (teams.length > 0) {
      onValidationChange?.(true);
      return;
    }

    // Otherwise, check substep-specific validation
    let canProceed = false;
    
    if (currentSubstep === 'welcome') {
      canProceed = false; // Need to create at least one team
    } else if (currentSubstep === 'mode-selection') {
      canProceed = false; // Need to create at least one team
    } else if (currentSubstep === 'persona-selection') {
      canProceed = selectedPersonas.length > 0;
    } else if (currentSubstep === 'manual-creation') {
      canProceed = manualTeamName.trim().length > 0;
    }
    
    onValidationChange?.(canProceed);
  }, [currentSubstep, selectedPersonas, manualTeamName, teams.length, onValidationChange]);

  const canContinue = () => {
    if (currentSubstep === 'welcome') return teams.length > 0; // Can proceed if teams already exist
    if (currentSubstep === 'mode-selection') return teams.length > 0; // Can proceed if teams already exist
    if (currentSubstep === 'persona-selection') return selectedPersonas.length > 0;
    if (currentSubstep === 'manual-creation') return manualTeamName.trim().length > 0;
    return false;
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userData?.firstName || userData?.lastName || 'Jeremie Chaine';
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-8 pt-4 pb-0">
          {/* Welcome Screen with Direct Team Creation Options */}
          {currentSubstep === 'welcome' && (
            <div className="max-w-4xl mx-auto py-6">
              {/* Welcome Message - Subtle and integrated */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#2063F0] to-[#31C7AD] bg-clip-text text-transparent mb-2">
                  Bienvenue, {getUserDisplayName()} !
                </h2>
                <p className="text-sm text-muted-foreground">
                  Créez vos équipes pour commencer la configuration de votre espace de travail
                </p>
              </div>

              {/* Info Banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 mb-6">
                <div className="p-2 rounded-lg bg-[#31C7AD]/10">
                  <Users className="h-5 w-5 text-[#31C7AD]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">
                    Choose how to create teams
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Select how you'd like to create your teams
                  </p>
                </div>
              </div>

              {/* Team Creation Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleModeSelect('personas')}
                  className="group relative flex flex-col items-start p-6 rounded-xl border-2 transition-all text-left h-full hover:shadow-lg border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent"
                >
                  <div className="flex items-start justify-between w-full mb-4">
                    <div className="p-3 rounded-lg transition-all bg-muted group-hover:bg-[#31C7AD]/10">
                      <Users className="h-6 w-6 text-muted-foreground group-hover:text-[#31C7AD]" />
                    </div>
                    <Badge className="bg-gradient-to-r from-[#31C7AD] to-[#2063F0] text-white border-0 shadow-sm">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Create teams from personas</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Select one or more personas to automatically create teams with suggested routines
                  </p>
                </button>

                <button
                  onClick={() => handleModeSelect('manual')}
                  className="group relative flex flex-col items-start p-6 rounded-xl border-2 transition-all text-left h-full hover:shadow-lg border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent"
                >
                  <div className="p-3 rounded-lg mb-4 transition-all bg-muted group-hover:bg-[#31C7AD]/10">
                    <Settings className="h-6 w-6 text-muted-foreground group-hover:text-[#31C7AD]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Manual setup</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create teams manually with custom names and descriptions
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Info Banner - For other substeps */}
          {currentSubstep !== 'welcome' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 mb-6">
              <div className="p-2 rounded-lg bg-[#31C7AD]/10">
                <Users className="h-5 w-5 text-[#31C7AD]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {currentSubstep === 'mode-selection' && 'Choose how to create teams'}
                  {currentSubstep === 'persona-selection' && 'Select personas for your teams'}
                  {currentSubstep === 'manual-creation' && 'Create team manually'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentSubstep === 'mode-selection' && 'Select how you\'d like to create your teams'}
                  {currentSubstep === 'persona-selection' && 'Select one or more personas to automatically create teams'}
                  {currentSubstep === 'manual-creation' && 'Enter team details to create a custom team'}
                </p>
              </div>
            </div>
          )}

          {/* Substep 0.1: Mode Selection */}
          {currentSubstep === 'mode-selection' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleModeSelect('personas')}
                className="group relative flex flex-col items-start p-6 rounded-xl border-2 transition-all text-left h-full hover:shadow-lg border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent"
              >
                <div className="flex items-start justify-between w-full mb-4">
                  <div className="p-3 rounded-lg transition-all bg-muted group-hover:bg-[#31C7AD]/10">
                    <Users className="h-6 w-6 text-muted-foreground group-hover:text-[#31C7AD]" />
                  </div>
                  <Badge className="bg-gradient-to-r from-[#31C7AD] to-[#2063F0] text-white border-0 shadow-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
                <h3 className="text-lg font-bold mb-2">Create teams from personas</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Select one or more personas to automatically create teams with suggested routines
                </p>
              </button>

              <button
                onClick={() => handleModeSelect('manual')}
                className="group relative flex flex-col items-start p-6 rounded-xl border-2 transition-all text-left h-full hover:shadow-lg border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent"
              >
                <div className="p-3 rounded-lg mb-4 transition-all bg-muted group-hover:bg-[#31C7AD]/10">
                  <Settings className="h-6 w-6 text-muted-foreground group-hover:text-[#31C7AD]" />
                </div>
                <h3 className="text-lg font-bold mb-2">Manual setup</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Create teams manually with custom names and descriptions
                </p>
              </button>
            </div>
          )}

          {/* Substep 0.2a: Persona Selection */}
          {currentSubstep === 'persona-selection' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PERSONAS.map((persona) => {
                  const isSelected = selectedPersonas.includes(persona);
                  const hasExistingTeam = getPersonasWithTeams().includes(persona);
                  const isNewSelection = isSelected && !hasExistingTeam;
                  const isExistingSelection = isSelected && hasExistingTeam;
                  
                  return (
                    <button
                      key={persona}
                      onClick={() => handlePersonaToggle(persona)}
                      disabled={!isSelected && hasExistingTeam}
                      className={cn(
                        'group relative flex items-center justify-between p-4 rounded-xl transition-all text-left border-2 hover:shadow-md',
                        isExistingSelection
                          ? 'border-[#31C7AD] bg-gradient-to-br from-[#31C7AD]/10 to-[#31C7AD]/5 shadow-lg shadow-[#31C7AD]/10'
                          : isNewSelection
                          ? 'border-[#2063F0] bg-gradient-to-br from-[#2063F0]/10 to-[#2063F0]/5 shadow-lg shadow-[#2063F0]/10'
                          : hasExistingTeam
                          ? 'border-border/50 bg-muted/30 opacity-60 cursor-not-allowed'
                          : 'border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent'
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={cn(
                            'p-2.5 rounded-lg transition-all shrink-0',
                            isExistingSelection
                              ? 'bg-gradient-to-br from-[#31C7AD] to-[#2ab89a] shadow-md'
                              : isNewSelection
                              ? 'bg-gradient-to-br from-[#2063F0] to-[#1a54d8] shadow-md'
                              : 'bg-muted group-hover:bg-[#31C7AD]/10'
                          )}
                        >
                          <User
                            className={cn(
                              'h-5 w-5 transition-colors',
                              (isSelected || hasExistingTeam) ? 'text-white' : 'text-muted-foreground group-hover:text-[#31C7AD]'
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'text-sm font-medium truncate',
                              isExistingSelection && 'text-[#31C7AD]',
                              isNewSelection && 'text-[#2063F0]'
                            )}>
                              {persona}
                            </span>
                            {hasExistingTeam && (
                              <Badge className="text-xs h-4 px-1.5 bg-[#31C7AD]/20 text-[#31C7AD] border-[#31C7AD]/30 shrink-0">
                                Team exists
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className={cn(
                          "flex items-center justify-center w-5 h-5 rounded-full shrink-0",
                          isExistingSelection ? "bg-[#31C7AD]" : "bg-[#2063F0]"
                        )}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Substep 0.2b: Manual Creation */}
          {currentSubstep === 'manual-creation' && (
            <div className="max-w-4xl space-y-6">
              {/* Created Teams Section - Show if teams exist */}
              {teams.filter(t => !t.persona).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Created Teams ({teams.filter(t => !t.persona).length})
                    </h3>
                    <Badge variant="outline" className="bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {teams.filter(t => !t.persona).length} team{teams.filter(t => !t.persona).length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teams.filter(t => !t.persona).map((team) => (
                      <div
                        key={team.id}
                        className="group relative p-4 rounded-lg border-2 border-[#31C7AD]/30 bg-gradient-to-br from-[#31C7AD]/5 to-transparent hover:border-[#31C7AD]/50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-[#31C7AD]" />
                              <h4 className="font-semibold text-sm truncate">{team.name}</h4>
                            </div>
                            {team.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {team.description}
                              </p>
                            )}
                            {team.personas && team.personas.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {team.personas.map((persona) => (
                                  <Badge key={persona} variant="secondary" className="text-xs">
                                    {persona}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Team Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#2063F0]/10">
                    <Plus className="h-5 w-5 text-[#2063F0]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Add New Team</h3>
                    <p className="text-xs text-muted-foreground">
                      Create additional teams to organize your workspace
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-xl border-2 border-dashed border-border bg-muted/20 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Team name *</label>
                    <Input
                      value={manualTeamName}
                      onChange={(e) => setManualTeamName(e.target.value)}
                      placeholder="Enter team name"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                    <Textarea
                      value={manualTeamDescription}
                      onChange={(e) => setManualTeamDescription(e.target.value)}
                      placeholder="Enter team description"
                      className="w-full min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Personas (optional)
                      <span className="text-xs text-muted-foreground ml-2 font-normal">
                        Help us suggest relevant routines
                      </span>
                    </label>
                    <Popover open={personasPopoverOpen} onOpenChange={setPersonasPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {manualTeamPersonas.length === 0 ? (
                            <span className="text-muted-foreground">Select personas...</span>
                          ) : (
                            <span className="flex items-center gap-2 flex-wrap">
                              {manualTeamPersonas.map((persona) => (
                                <Badge key={persona} variant="secondary" className="text-xs">
                                  {persona}
                                </Badge>
                              ))}
                            </span>
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <ScrollArea className="h-64">
                          <div className="p-2">
                            {PERSONAS.map((persona) => {
                              const isSelected = manualTeamPersonas.includes(persona);
                              return (
                                <div
                                  key={persona}
                                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                  onClick={() => handleManualPersonaToggle(persona)}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleManualPersonaToggle(persona)}
                                  />
                                  <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                                    {persona}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                    {manualTeamPersonas.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {manualTeamPersonas.map((persona) => (
                          <Badge
                            key={persona}
                            variant="secondary"
                            className="text-xs flex items-center gap-1"
                          >
                            {persona}
                            <button
                              onClick={() => handleManualPersonaToggle(persona)}
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={handleCreateManualTeam}
                      disabled={!manualTeamName.trim()}
                      className="gap-2 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Add Team
                    </Button>
                    {manualTeamName.trim() && (
                      <span className="text-xs text-muted-foreground">
                        Team will be added to your list above
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Created Teams Preview (if any) */}
          {teams.length > 0 && currentSubstep === 'mode-selection' && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Created Teams ({teams.length})</h3>
              <div className="space-y-3">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{team.name}</p>
                      {team.description && (
                        <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                      )}
                      {team.persona && (
                        <span className="text-xs text-muted-foreground">From persona: {team.persona}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
