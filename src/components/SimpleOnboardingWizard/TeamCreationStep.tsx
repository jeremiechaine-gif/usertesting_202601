/**
 * Step 0: Team Creation with Substeps
 * Substep 0.1: Choose mode (Create from Role profiles / Manual setup)
 * Substep 0.2a: Select Role profiles (if Role profiles mode)
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
import { Users, Settings, ArrowLeft, User, Plus, Sparkles, ChevronDown, X, CheckCircle2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleTeamConfig, TeamCreationMode } from './SimpleOnboardingWizard';
import { ROUTINE_LIBRARY } from '@/lib/onboarding/routineLibrary';
import { getAllAvailablePersonas, getCustomPersonas } from '@/lib/personas';
import { CreatePersonaModal } from './CreatePersonaModal';
import { getRoutines } from '@/lib/routines';
import { getCurrentUserId } from '@/lib/users';

// Role profile definitions with translations and descriptions
interface RoleProfileInfo {
  french: string;
  english: string;
  description: string;
}

const ROLE_PROFILES: RoleProfileInfo[] = [
  {
    french: 'Approvisionneur',
    english: 'Supply Planner',
    description: 'Manages supplier orders and inventory levels to ensure production continuity'
  },
  {
    french: 'Acheteur',
    english: 'Buyer',
    description: 'Handles purchasing negotiations and supplier relationships'
  },
  {
    french: 'Manager Appro',
    english: 'Procurement Manager',
    description: 'Oversees procurement strategy and team performance'
  },
  {
    french: 'Ordonnanceur Assemblage',
    english: 'Assembly Scheduler',
    description: 'Plans and schedules assembly operations and production sequences'
  },
  {
    french: 'Ordonnanceur',
    english: 'Scheduler',
    description: 'Coordinates production schedules and resource allocation'
  },
  {
    french: 'Master Planner',
    english: 'Master Planner',
    description: 'Develops strategic production plans and manages customer commitments'
  },
  {
    french: 'Support Logistique',
    english: 'Logistics Support',
    description: 'Manages customer deliveries and shipping coordination'
  },
  {
    french: 'Recette',
    english: 'Quality Control',
    description: 'Ensures product quality and compliance with standards'
  },
  {
    french: 'Responsable Supply Chain',
    english: 'Supply Chain Manager',
    description: 'Leads supply chain operations and strategic planning'
  },
  {
    french: 'Directeur Supply Chain',
    english: 'Supply Chain Director',
    description: 'Defines supply chain strategy and executive oversight'
  },
  {
    french: 'Responsable Ordo & Support log',
    english: 'Scheduling & Logistics Manager',
    description: 'Manages both production scheduling and logistics operations'
  },
  {
    french: 'Autre / Mixte',
    english: 'Other / Mixed',
    description: 'Combines multiple roles or custom responsibilities'
  },
];

// Helper function to get role profile info
const getRoleProfileInfo = (frenchName: string): RoleProfileInfo | undefined => {
  return ROLE_PROFILES.find(rp => rp.french === frenchName);
};

// For backward compatibility, keep the list of French names
const PERSONAS = ROLE_PROFILES.map(rp => rp.french);

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
  const [createPersonaModalOpen, setCreatePersonaModalOpen] = useState(false);
  const [availablePersonas, setAvailablePersonas] = useState<string[]>(getAllAvailablePersonas());
  const [personaSearchQuery, setPersonaSearchQuery] = useState('');
  const onStep0ContinueRef = useRef(onStep0Continue);

  // Generate team ID
  const generateTeamId = () => `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Map French Role profile names to English for ROUTINE_LIBRARY lookup
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

  // Get suggested routines for Role profile
  const getSuggestedRoutinesForPersona = (persona: string): string[] => {
    const routineIds: string[] = [];
    
    // 1. Check library routines (for predefined Role profiles)
    const englishPersona = PERSONA_FR_TO_EN[persona];
    if (englishPersona) {
      const libraryRoutineIds = ROUTINE_LIBRARY
        .filter(r => r.personas.includes(englishPersona as any))
        .map(r => r.id);
      routineIds.push(...libraryRoutineIds);
    }
    
    // 2. Check user-created routines (for custom Role profiles or if they contain this Role profile)
    const userRoutines = getRoutines().filter(r => r.createdBy === getCurrentUserId());
    for (const routine of userRoutines) {
      // Check if routine has Role profiles and if this Role profile is in the list
      if (routine.personas && routine.personas.length > 0) {
        // Check if Role profile matches (case-insensitive comparison)
        const matches = routine.personas.some(p => 
          p.toLowerCase() === persona.toLowerCase() || 
          p.toLowerCase() === englishPersona?.toLowerCase()
        );
        if (matches && !routineIds.includes(routine.id)) {
          routineIds.push(routine.id);
        }
      }
    }
    
    return routineIds;
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

  // Get Role profiles that already have teams
  const getPersonasWithTeams = (): string[] => {
    return teams
      .filter(team => team.persona)
      .map(team => team.persona!);
  };

  // Handle Role profile selection
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
      // Select: only allow if Role profile doesn't already have a team
      if (!hasExistingTeam) {
        setSelectedPersonas(prev => [...prev, persona]);
      }
    }
  };

  // Create teams from selected Role profiles
  const handleCreateFromPersonas = () => {
    if (selectedPersonas.length === 0) return;

    const personasWithTeams = getPersonasWithTeams();
    // Only create teams for Role profiles that don't already have teams
    const personasToCreate = selectedPersonas.filter(persona => !personasWithTeams.includes(persona));

    if (personasToCreate.length === 0) return;

    const newTeams: SimpleTeamConfig[] = personasToCreate.map(persona => {
      return {
        id: generateTeamId(),
        name: `${persona} Team`,
        description: `Team for ${persona}`,
        persona,
        assignedRoutineIds: [], // No routines assigned by default - user must click to add
        memberIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    onTeamsUpdate([...teams, ...newTeams]);
    // Keep Role profiles with existing teams selected, remove only newly created ones
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

  // Handle Role profile toggle for manual team
  const handleManualPersonaToggle = (persona: string) => {
    setManualTeamPersonas(prev => 
      prev.includes(persona) 
        ? prev.filter(p => p !== persona)
        : [...prev, persona]
    );
  };

  // Handle Role profile creation
  const handlePersonaCreated = (personaName: string) => {
    // Refresh available Role profiles list
    setAvailablePersonas(getAllAvailablePersonas());
    // Add the newly created persona to the current selection
    if (currentSubstep === 'manual-creation') {
      setManualTeamPersonas(prev => [...prev, personaName]);
    } else if (currentSubstep === 'persona-selection') {
      setSelectedPersonas(prev => [...prev, personaName]);
    }
    setPersonasPopoverOpen(false);
  };

  // Refresh available Role profiles when popover opens
  useEffect(() => {
    if (personasPopoverOpen) {
      setAvailablePersonas(getAllAvailablePersonas());
    } else {
      // Reset search when popover closes
      setPersonaSearchQuery('');
    }
  }, [personasPopoverOpen]);

  // Filter Role profiles based on search query
  const filteredPersonas = availablePersonas.filter((persona) => {
    if (!personaSearchQuery.trim()) return true;
    return persona.toLowerCase().includes(personaSearchQuery.toLowerCase().trim());
  });

  // Pre-select Role profiles that already have teams when entering Role profile-selection
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
                  <h3 className="text-lg font-bold mb-2">Create teams from Role profiles</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Select one or more Role profiles to automatically create teams with suggested routines
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
                  {currentSubstep === 'persona-selection' && 'Select Role profiles for your teams'}
                  {currentSubstep === 'manual-creation' && 'Create team manually'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentSubstep === 'mode-selection' && 'Select how you\'d like to create your teams'}
                  {currentSubstep === 'persona-selection' && 'Select one or more Role profiles to automatically create teams'}
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
              {/* Header with Create button */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {availablePersonas.length} Role profile{availablePersonas.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreatePersonaModalOpen(true)}
                  className="h-7 gap-1.5 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Create new Role profile
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {availablePersonas.map((persona) => {
                  const isSelected = selectedPersonas.includes(persona);
                  const hasExistingTeam = getPersonasWithTeams().includes(persona);
                  const isNewSelection = isSelected && !hasExistingTeam;
                  const isExistingSelection = isSelected && hasExistingTeam;
                  
                  // Get role profile info (for predefined roles) or use custom role name
                  const roleInfo = getRoleProfileInfo(persona);
                  let displayName = roleInfo ? roleInfo.english : persona;
                  let description = roleInfo ? roleInfo.description : 'Custom role profile';
                  
                  // If it's a custom role profile, try to get its description
                  if (!roleInfo) {
                    const customPersonas = getCustomPersonas();
                    const customPersona = customPersonas.find(cp => cp.name === persona);
                    if (customPersona) {
                      displayName = customPersona.name;
                      description = customPersona.description || 'Custom role profile';
                    }
                  }
                  
                  return (
                    <button
                      key={persona}
                      onClick={() => handlePersonaToggle(persona)}
                      disabled={!isSelected && hasExistingTeam}
                      className={cn(
                        'group relative flex flex-col p-4 rounded-xl transition-all text-left border-2 hover:shadow-md',
                        isExistingSelection
                          ? 'border-[#31C7AD] bg-gradient-to-br from-[#31C7AD]/10 to-[#31C7AD]/5 shadow-lg shadow-[#31C7AD]/10'
                          : isNewSelection
                          ? 'border-[#2063F0] bg-gradient-to-br from-[#2063F0]/10 to-[#2063F0]/5 shadow-lg shadow-[#2063F0]/10'
                          : hasExistingTeam
                          ? 'border-border/50 bg-muted/30 opacity-60 cursor-not-allowed'
                          : 'border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent'
                      )}
                    >
                      <div className="flex items-start gap-3 w-full">
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
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              'text-sm font-semibold',
                              isExistingSelection && 'text-[#31C7AD]',
                              isNewSelection && 'text-[#2063F0]'
                            )}>
                              {displayName}
                            </span>
                            {hasExistingTeam && (
                              <Badge className="text-xs h-4 px-1.5 bg-[#31C7AD]/20 text-[#31C7AD] border-[#31C7AD]/30 shrink-0">
                                Team exists
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            'text-xs leading-snug',
                            (isSelected || hasExistingTeam) 
                              ? 'text-muted-foreground' 
                              : 'text-muted-foreground/80 group-hover:text-muted-foreground'
                          )}>
                            {description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className={cn(
                            "flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5",
                            isExistingSelection ? "bg-[#31C7AD]" : "bg-[#2063F0]"
                          )}>
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
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
                      Role profiles (optional)
                      <span className="text-xs text-muted-foreground ml-2 font-normal">
                        Help us suggest relevant routines
                      </span>
                    </label>
                    <Popover open={personasPopoverOpen} onOpenChange={setPersonasPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between min-h-[42px] h-auto py-2"
                        >
                          {manualTeamPersonas.length === 0 ? (
                            <span className="text-muted-foreground">Select Role profiles...</span>
                          ) : (
                            <span className="flex items-center gap-1.5 flex-wrap flex-1 text-left">
                              {manualTeamPersonas.map((persona) => (
                                <Badge
                                  key={persona}
                                  variant="secondary"
                                  className="text-xs flex items-center gap-1 pr-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleManualPersonaToggle(persona);
                                  }}
                                >
                                  <span>{persona}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleManualPersonaToggle(persona);
                                    }}
                                    className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                    aria-label={`Remove ${persona}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </span>
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <div className="p-2 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search Role profiles..."
                              value={personaSearchQuery}
                              onChange={(e) => setPersonaSearchQuery(e.target.value)}
                              className="pl-8 h-9"
                              autoFocus
                            />
                            {personaSearchQuery && (
                              <button
                                onClick={() => setPersonaSearchQuery('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Clear search"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <ScrollArea className="h-64">
                          <div className="p-2">
                            {filteredPersonas.length === 0 ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                <p className="mb-2">No Role profiles found</p>
                                {personaSearchQuery && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPersonasPopoverOpen(false);
                                      setCreatePersonaModalOpen(true);
                                    }}
                                    className="text-[#2063F0] hover:text-[#1a54d8]"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Create "{personaSearchQuery}"
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <>
                                {filteredPersonas.map((persona) => {
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
                                {/* Create New Role Profile Button */}
                                <div className="border-t border-border mt-2 pt-2">
                                  <Button
                                    variant="ghost"
                                    onClick={() => {
                                      setPersonasPopoverOpen(false);
                                      setCreatePersonaModalOpen(true);
                                    }}
                                    className="w-full justify-start gap-2 text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/10"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Create new Role profile
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
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
                        <span className="text-xs text-muted-foreground">From Role profile: {team.persona}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Persona Modal */}
      <CreatePersonaModal
        open={createPersonaModalOpen}
        onOpenChange={setCreatePersonaModalOpen}
        onPersonaCreated={handlePersonaCreated}
      />
    </div>
  );
};
