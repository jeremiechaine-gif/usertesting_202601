/**
 * Routine Modal Component
 * Create or edit a routine with name, description, configuration, and scope mode
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { createRoutine, updateRoutine, type Routine, type PelicoViewPage } from '@/lib/routines';
import { validateRoutine } from '@/lib/validation/routineValidation';
import { getScopes, type Scope } from '@/lib/scopes';
import { getCurrentUserId, getCurrentUser } from '@/lib/users';
import { getTeams, createTeam, getTeamByName, type Team } from '@/lib/teams';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { Sparkles, Zap, User, X, Eye, Plus, ChevronDown, CheckCircle2 } from 'lucide-react';
import { getAllAvailablePersonas, getCustomPersonas } from '@/lib/personas';
import { CreatePersonaModal } from './SimpleOnboardingWizard/CreatePersonaModal';
import type { Objective } from '@/lib/onboarding/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface RoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: Routine | null;
  onSave: (routineId?: string) => void; // Pass routineId when creating a new routine
  // Current view state to capture
  currentFilters?: ColumnFiltersState;
  currentSorting?: SortingState;
  currentGroupBy?: string | null;
  currentPageSize?: number;
  // Navigation function for viewing routine
  onNavigate?: (page: string) => void;
  // Current Pelico View when creating from a Pelico View page (hides dropdown)
  currentPelicoView?: PelicoViewPage;
}

export const RoutineModal: React.FC<RoutineModalProps> = ({
  open,
  onOpenChange,
  routine,
  onSave,
  currentFilters = [],
  currentSorting = [],
  currentGroupBy = null,
  currentPageSize = 100,
  onNavigate,
  currentPelicoView,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopeMode, setScopeMode] = useState<'scope-aware' | 'scope-fixed'>('scope-aware');
  const [linkedScopeId, setLinkedScopeId] = useState<string | null>(null);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [showNewTeamInput, setShowNewTeamInput] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<Objective[]>([]);
  const [selectedPelicoView, setSelectedPelicoView] = useState<PelicoViewPage | undefined>(undefined);
  const [personasPopoverOpen, setPersonasPopoverOpen] = useState(false);
  const [createPersonaModalOpen, setCreatePersonaModalOpen] = useState(false);
  const [availablePersonas, setAvailablePersonas] = useState<string[]>([]);
  const [personaSearchQuery, setPersonaSearchQuery] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const currentUser = getCurrentUser();
  const isManager = currentUser?.role === 'manager';

  // Available objectives
  const OBJECTIVES: Objective[] = ['Anticipate', 'Monitor', 'Correct', 'Prioritize', 'Report'];

  // Map French Role profile names to English
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

  // Role profile definitions with translations and descriptions
  interface RoleProfileInfo {
    french: string;
    english: string;
    description: string;
  }

  const ROLE_PROFILES: RoleProfileInfo[] = [
    { french: 'Approvisionneur', english: 'Supply Planner', description: 'Manages supplier orders and inventory levels to ensure production continuity' },
    { french: 'Acheteur', english: 'Buyer', description: 'Handles purchasing negotiations and supplier relationships' },
    { french: 'Manager Appro', english: 'Procurement Manager', description: 'Oversees procurement strategy and team performance' },
    { french: 'Ordonnanceur Assemblage', english: 'Assembly Scheduler', description: 'Plans and schedules assembly operations and production sequences' },
    { french: 'Ordonnanceur', english: 'Scheduler', description: 'Coordinates production schedules and resource allocation' },
    { french: 'Master Planner', english: 'Master Planner', description: 'Develops strategic production plans and manages customer commitments' },
    { french: 'Support Logistique', english: 'Logistics Support', description: 'Manages customer deliveries and shipping coordination' },
    { french: 'Recette', english: 'Quality Control', description: 'Ensures product quality and compliance with standards' },
    { french: 'Responsable Supply Chain', english: 'Supply Chain Manager', description: 'Leads supply chain operations and strategic planning' },
    { french: 'Directeur Supply Chain', english: 'Supply Chain Director', description: 'Defines supply chain strategy and executive oversight' },
    { french: 'Responsable Ordo & Support log', english: 'Scheduling & Logistics Manager', description: 'Manages both production scheduling and logistics operations' },
    { french: 'Autre / Mixte', english: 'Other / Mixed', description: 'Combines multiple roles or custom responsibilities' },
  ];

  const getRoleProfileInfo = (frenchName: string): RoleProfileInfo | undefined => {
    return ROLE_PROFILES.find(rp => rp.french === frenchName);
  };

  // Available Pelico Views (matching sidebar items)
  const PELICO_VIEWS: { value: PelicoViewPage; label: string }[] = [
    { value: 'escalation', label: 'Escalation Room' },
    { value: 'supply', label: 'Purchase Order Book' },
    { value: 'so-book', label: 'Service Order Book' },
    { value: 'customer', label: 'Customer Order Book' },
    { value: 'wo-book', label: 'Work Order Book' },
    { value: 'missing-parts', label: 'Missing Parts' },
    { value: 'line-of-balance', label: 'Line of Balance' },
    { value: 'planning', label: 'Planning' },
    { value: 'events-explorer', label: 'Events Explorer' },
  ];

  // Get PelicoView display name
  const getPelicoViewDisplayName = (view?: PelicoViewPage): string => {
    const viewMap: Record<PelicoViewPage, string> = {
      'escalation': 'Escalation Room',
      'supply': 'Purchase Order Book',
      'so-book': 'Service Order Book',
      'customer': 'Customer Order Book',
      'wo-book': 'Work Order Book',
      'missing-parts': 'Missing Parts',
      'line-of-balance': 'Line of Balance',
      'planning': 'Planning',
      'events-explorer': 'Events Explorer',
    };
    return view ? viewMap[view] : 'Not set';
  };

  // Map PelicoViewPage to navigation page (same as value for most)
  const getPelicoViewPage = (view?: PelicoViewPage): string | null => {
    if (!view) return null;
    // Most PelicoViewPage values match navigation page IDs directly
    return view || null;
  };

  useEffect(() => {
    setScopes(getScopes());
    setTeams(getTeams());
    setAvailablePersonas(getAllAvailablePersonas());
  }, []);

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setDescription(routine.description || '');
      setScopeMode(routine.scopeMode);
      setLinkedScopeId(routine.linkedScopeId || null);
      // Support both new teamIds and legacy teamId
      setSelectedTeamIds(routine.teamIds || (routine.teamId ? [routine.teamId] : []));
      // Map Persona[] (English) to French names for display
      if (routine.personas && routine.personas.length > 0) {
        const frenchPersonas = routine.personas.map(engPersona => {
          const entry = Object.entries(PERSONA_FR_TO_EN).find(([_, en]) => en === engPersona);
          return entry ? entry[0] : engPersona; // Fallback to English if not found
        });
        setSelectedPersonas(frenchPersonas);
      } else {
        setSelectedPersonas([]);
      }
      setSelectedObjectives(routine.objectives || []);
      setSelectedPelicoView(routine.pelicoView);
    } else {
      setName('');
      setDescription('');
      setScopeMode('scope-aware');
      setLinkedScopeId(null);
      setSelectedTeamIds([]);
      setNewTeamName('');
      setShowNewTeamInput(false);
      setSelectedPersonas([]);
      setSelectedObjectives([]);
      // Use currentPelicoView if provided (when creating from a Pelico View page)
      setSelectedPelicoView(currentPelicoView);
      // Reset more options visibility
      setShowMoreOptions(false);
    }
  }, [routine, open, currentPelicoView]);

  // Handle persona creation
  const handlePersonaCreated = (personaName: string) => {
    setAvailablePersonas(getAllAvailablePersonas());
    if (!selectedPersonas.includes(personaName)) {
      setSelectedPersonas([...selectedPersonas, personaName]);
    }
  };

  // Filter personas based on search query
  const filteredPersonas = availablePersonas.filter(persona => {
    if (!personaSearchQuery.trim()) return true;
    const roleInfo = getRoleProfileInfo(persona);
    const displayName = roleInfo ? roleInfo.english : persona;
    const searchLower = personaSearchQuery.toLowerCase();
    return persona.toLowerCase().includes(searchLower) || 
           displayName.toLowerCase().includes(searchLower) ||
           (roleInfo && roleInfo.description.toLowerCase().includes(searchLower));
  });

  const handleSave = () => {
    // Validate routine data
    const validation = validateRoutine({
      name,
      description,
      scopeMode,
      linkedScopeId,
    });

    if (!validation.isValid) {
      // Show first error (could be enhanced to show all errors)
      alert(validation.errors[0] || 'Invalid routine data');
      return;
    }

    // Validate Pelico View is selected when creating a new routine
    // If currentPelicoView is provided, it's already set, so no need to check
    if (!routine && !selectedPelicoView && !currentPelicoView) {
      alert('Please select a Pelico View');
      return;
    }
    
    // Use currentPelicoView if provided, otherwise use selectedPelicoView
    const finalPelicoView = currentPelicoView || selectedPelicoView;

    // Handle new team creation if manager
    let finalTeamIds: string[] = [...selectedTeamIds];
    if (showNewTeamInput && newTeamName.trim() && isManager) {
      // Check if team already exists
      const existingTeam = getTeamByName(newTeamName.trim());
      if (existingTeam) {
        // Add existing team if not already selected
        if (!finalTeamIds.includes(existingTeam.id)) {
          finalTeamIds.push(existingTeam.id);
        }
      } else {
        // Create new team
        const newTeam = createTeam({ name: newTeamName.trim() });
        finalTeamIds.push(newTeam.id);
        setTeams(getTeams()); // Refresh teams list
      }
    }

    const currentUserId = getCurrentUserId();
    
    // Convert French persona names to English Persona[] for storage
    const englishPersonas = selectedPersonas.map(frPersona => {
      return PERSONA_FR_TO_EN[frPersona] || frPersona; // Fallback if not in map (custom persona)
    }) as any[];

    const routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      description: description.trim() || undefined,
      filters: currentFilters,
      sorting: currentSorting,
      groupBy: currentGroupBy,
      pageSize: currentPageSize,
      scopeMode,
      linkedScopeId: scopeMode === 'scope-fixed' ? linkedScopeId : null,
      createdBy: routine?.createdBy || currentUserId,
      teamIds: finalTeamIds.length > 0 ? finalTeamIds : [],
      personas: englishPersonas.length > 0 ? englishPersonas : undefined,
      objectives: selectedObjectives.length > 0 ? selectedObjectives : undefined,
      pelicoView: finalPelicoView!,
    };

    if (routine) {
      updateRoutine(routine.id, routineData);
      onSave(routine.id);
    } else {
      const newRoutine = createRoutine(routineData);
      onSave(newRoutine.id); // Pass the ID of the newly created routine
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-2xl page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {routine ? 'Edit Routine' : 'Create New Routine'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {routine 
                ? 'Update routine configuration' 
                : 'Save current view configuration as a reusable routine'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-8 py-6 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="routine-name" className="text-sm font-semibold">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="routine-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter routine name..."
                className="h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="routine-description" className="text-sm font-semibold">
                Description <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="routine-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter routine description..."
                rows={3}
                className="border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20 resize-none"
              />
            </div>

            {/* Pelico View - Always visible and required */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Pelico View <span className="text-destructive">*</span>
              </Label>
              {routine || (currentPelicoView && !routine) ? (
                // Edit mode OR Create mode from Pelico View page: Read-only display
                <div className="rounded-lg border border-border/60 p-4 bg-muted/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-background/50 border-[#31C7AD]/30 text-[#31C7AD]">
                      {getPelicoViewDisplayName(routine?.pelicoView || currentPelicoView)}
                    </Badge>
                  </div>
                  {(routine?.pelicoView || currentPelicoView) && onNavigate && routine && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 gap-2"
                      onClick={() => {
                        const page = getPelicoViewPage(routine.pelicoView);
                        if (page && routine.id) {
                          // Store routine ID in sessionStorage to auto-apply it when page loads
                          sessionStorage.setItem('pendingRoutineId', routine.id);
                          onNavigate(page);
                          onOpenChange(false);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View Routine
                    </Button>
                  )}
                </div>
              ) : (
                // Create mode from Scope & Routines: Dropdown to select Pelico View
                <>
                  <Select
                    value={selectedPelicoView || ''}
                    onValueChange={(value) => setSelectedPelicoView(value as PelicoViewPage)}
                  >
                    <SelectTrigger className="h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20">
                      <SelectValue placeholder="Select a Pelico View..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PELICO_VIEWS.map((view) => (
                        <SelectItem key={view.value} value={view.value}>
                          {view.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedPelicoView && (
                    <p className="text-xs text-destructive">Pelico View is required for new routines.</p>
                  )}
                </>
              )}
            </div>

            {/* More Options Button */}
            <div className="pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="h-9"
              >
                {showMoreOptions ? 'Less options' : 'More options'}
                <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", showMoreOptions && "rotate-180")} />
              </Button>
            </div>

            {/* More Options Sections - Hidden by default */}
            {showMoreOptions && (
              <div className="space-y-5 pt-2 border-t border-border/50">
                {/* Suggestion for Role Profiles */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Suggestion for Role Profiles <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select one or more Role profiles for which this routine is recommended.
                </p>
              </div>
              <Popover open={personasPopoverOpen} onOpenChange={setPersonasPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    className="w-full justify-between h-10 border-border/60"
                  >
                    <span className="text-sm">
                      {selectedPersonas.length > 0 
                        ? `${selectedPersonas.length} Role profile${selectedPersonas.length > 1 ? 's' : ''} selected`
                        : 'Select Role profiles...'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-2 border-b border-border/60">
                    <div className="relative">
                      <Input
                        placeholder="Search Role profiles..."
                        value={personaSearchQuery}
                        onChange={(e) => setPersonaSearchQuery(e.target.value)}
                        className="h-9 pr-8"
                      />
                      {personaSearchQuery && (
                        <button
                          onClick={() => setPersonaSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="p-2 space-y-1">
                      {filteredPersonas.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No Role profiles found</p>
                      ) : (
                        filteredPersonas.map((persona) => {
                          const isSelected = selectedPersonas.includes(persona);
                          const roleInfo = getRoleProfileInfo(persona);
                          let displayName = roleInfo ? roleInfo.english : persona;
                          let description = roleInfo ? roleInfo.description : 'Custom role profile';

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
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedPersonas(selectedPersonas.filter(p => p !== persona));
                                } else {
                                  setSelectedPersonas([...selectedPersonas, persona]);
                                }
                              }}
                              className={cn(
                                'w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors',
                                isSelected && 'bg-muted'
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium">{displayName}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">{description}</div>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-[#31C7AD] shrink-0 mt-0.5" />
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t border-border/60">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full h-9 border-border/60 hover:border-[#31C7AD] hover:bg-[#31C7AD]/5 hover:text-[#31C7AD] transition-all"
                      onClick={() => {
                        setPersonasPopoverOpen(false);
                        setCreatePersonaModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create new Role profile
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {selectedPersonas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPersonas.map((persona) => {
                    const roleInfo = getRoleProfileInfo(persona);
                    const displayName = roleInfo ? roleInfo.english : persona;
                    return (
                      <Badge
                        key={persona}
                        variant="secondary"
                        className="text-xs bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/20 flex items-center gap-1.5"
                      >
                        <User className="h-3 w-3" />
                        {displayName}
                        <button
                          onClick={() => setSelectedPersonas(selectedPersonas.filter(p => p !== persona))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Objectives <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select one or more business objectives this routine helps achieve.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-4 space-y-2 bg-muted/10">
                {OBJECTIVES.map((objective) => {
                  const isSelected = selectedObjectives.includes(objective);
                  return (
                    <div key={objective} className="flex items-center space-x-2">
                      <Checkbox
                        id={`objective-${objective}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedObjectives([...selectedObjectives, objective]);
                          } else {
                            setSelectedObjectives(selectedObjectives.filter(obj => obj !== objective));
                          }
                        }}
                        className="data-[state=checked]:bg-[#2063F0] data-[state=checked]:border-[#2063F0]"
                      />
                      <Label
                        htmlFor={`objective-${objective}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {objective}
                      </Label>
                    </div>
                  );
                })}
              </div>
              {selectedObjectives.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedObjectives.map((objective) => (
                    <Badge
                      key={objective}
                      variant="secondary"
                      className="text-xs bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/20 flex items-center gap-1.5"
                    >
                      {objective}
                      <button
                        onClick={() => setSelectedObjectives(selectedObjectives.filter(obj => obj !== objective))}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>


            {/* Scope Mode - Hidden */}
            {/* Scope Mode section is hidden but scopeMode state is still used internally */}
            
            {/* Linked Scope (only if scope-fixed) - Hidden but still functional */}
            {scopeMode === 'scope-fixed' && (
              <div className="space-y-2 hidden">
                <Label htmlFor="linked-scope">
                  Linked Scope <span className="text-destructive">*</span>
                </Label>
                <Select value={linkedScopeId || ''} onValueChange={setLinkedScopeId}>
                  <SelectTrigger id="linked-scope">
                    <SelectValue placeholder="Select a scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopes.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No scopes available. Create a scope first.
                      </div>
                    ) : (
                      scopes.map((scope) => (
                        <SelectItem key={scope.id} value={scope.id}>
                          {scope.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Share with Teams */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Share with Teams <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select one or more teams to share this routine with. All team members will be able to view it. Only you can edit it.
                </p>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 p-4 space-y-3 max-h-[200px] overflow-y-auto bg-muted/10">
                  {teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No teams available</p>
                  ) : (
                    teams.map((team) => {
                      const isSelected = selectedTeamIds.includes(team.id);
                      return (
                        <div key={team.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTeamIds([...selectedTeamIds, team.id]);
                              } else {
                                setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id));
                              }
                            }}
                            className="data-[state=checked]:bg-[#31C7AD] data-[state=checked]:border-[#31C7AD]"
                          />
                          <Label
                            htmlFor={`team-${team.id}`}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {team.name}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
                {isManager && (
                  <div className="space-y-2">
                    {showNewTeamInput ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter team name..."
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="flex-1 h-9 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newTeamName.trim()) {
                              const existingTeam = getTeamByName(newTeamName.trim());
                              if (existingTeam) {
                                if (!selectedTeamIds.includes(existingTeam.id)) {
                                  setSelectedTeamIds([...selectedTeamIds, existingTeam.id]);
                                }
                              } else {
                                const newTeam = createTeam({ name: newTeamName.trim() });
                                setSelectedTeamIds([...selectedTeamIds, newTeam.id]);
                                setTeams(getTeams());
                              }
                              setShowNewTeamInput(false);
                              setNewTeamName('');
                            } else if (e.key === 'Escape') {
                              setShowNewTeamInput(false);
                              setNewTeamName('');
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setShowNewTeamInput(false);
                            setNewTeamName('');
                          }}
                          className="h-9 border-border/60"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowNewTeamInput(true)}
                        className="h-9 border-border/60 hover:border-[#31C7AD] hover:bg-[#31C7AD]/5 hover:text-[#31C7AD] transition-all"
                      >
                        + Create new team
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {selectedTeamIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTeamIds.map((teamId) => {
                    const team = teams.find(t => t.id === teamId);
                    return team ? (
                      <Badge key={teamId} variant="secondary" className="text-xs bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/20">
                        {team.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

                {/* Current Configuration Summary */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Current Configuration</Label>
                  <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-gradient-to-br from-[#2063F0]/5 to-[#31C7AD]/5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-background/50 border-[#2063F0]/30 text-[#2063F0]">
                        <Zap className="h-3 w-3 mr-1" />
                        {currentFilters.length} filters
                      </Badge>
                      <Badge variant="secondary" className="bg-background/50 border-[#2063F0]/30 text-[#2063F0]">
                        {currentSorting.length} sorts
                      </Badge>
                      {currentGroupBy && (
                        <Badge variant="secondary" className="bg-background/50 border-[#31C7AD]/30 text-[#31C7AD]">
                          Group by: {currentGroupBy}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-background/50 border-border/60">
                        Page size: {currentPageSize}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This routine will save the current view configuration (filters, sorting, grouping, page size).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="h-9 border-border/60 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={!name.trim() || (!routine && !selectedPelicoView && !currentPelicoView)}
            className="h-9"
          >
            {routine ? 'Update' : 'Create'} Routine
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Create Persona Modal */}
      <CreatePersonaModal
        open={createPersonaModalOpen}
        onOpenChange={setCreatePersonaModalOpen}
        onPersonaCreated={handlePersonaCreated}
      />
    </Dialog>
  );
};


