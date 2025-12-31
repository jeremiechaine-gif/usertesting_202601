/**
 * Create Routine Modal Component
 * Create a new routine with name, pelico views, and optional characteristics
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import { createRoutine, getRoutines, type PelicoViewPage } from '@/lib/routines';
import { getCurrentUserId } from '@/lib/users';
import type { 
  Persona, 
  Objective, 
  Horizon, 
  ImpactZone, 
  Frequency, 
  PelicoView 
} from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';

// Constants
const PERSONAS: Persona[] = [
  'Supply Planner',
  'Buyer',
  'Procurement Manager',
  'Assembly Scheduler',
  'Scheduler',
  'Master Planner',
  'Logistics Support',
  'Quality Control',
  'Supply Chain Manager',
  'Supply Chain Director',
  'Scheduling & Logistics Manager',
  'Other / Mixed',
];

const OBJECTIVES: Objective[] = ['Anticipate', 'Monitor', 'Correct', 'Prioritize', 'Report'];

const HORIZONS: Horizon[] = ['Today', 'ThisWeek', 'Projection'];

const IMPACT_ZONES: ImpactZone[] = ['Supplier', 'Production', 'Customer', 'Business'];

const FREQUENCIES: Frequency[] = ['Daily', 'Weekly', 'Monthly'];

const PELICO_VIEWS: PelicoView[] = [
  'Supply',
  'Production Control',
  'Customer Support',
  'Escalation Room',
  'Value Engineering',
  'Event Explorer',
  'Simulation',
];

// Map PelicoView to PelicoViewPage
function mapPelicoViewToPage(view: PelicoView): PelicoViewPage {
  const viewMap: Record<PelicoView, PelicoViewPage> = {
    'Supply': 'supply',
    'Production Control': 'so-book', // Map to Service Order Book as closest match
    'Customer Support': 'customer',
    'Escalation Room': 'escalation',
    'Value Engineering': 'planning', // Map to Planning as closest match
    'Event Explorer': 'events-explorer',
    'Simulation': 'events-explorer', // Map to Events Explorer as closest match (Simulation is not in Pelico Views sidebar)
  };
  return viewMap[view] || 'supply';
}

interface CreateRoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onRoutineCreated: (routineId: string) => void;
}

export const CreateRoutineModal: React.FC<CreateRoutineModalProps> = ({
  open,
  onOpenChange,
  teamId,
  onRoutineCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pelicoViews, setPelicoViews] = useState<PelicoView[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [horizon, setHorizon] = useState<Horizon | 'none'>('none');
  const [impactZones, setImpactZones] = useState<ImpactZone[]>([]);
  const [frequency, setFrequency] = useState<Frequency | 'none'>('none');
  const [nameExists, setNameExists] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setPelicoViews([]);
      setPersonas([]);
      setObjectives([]);
      setHorizon('none');
      setImpactZones([]);
      setFrequency('none');
      setNameExists(false);
    }
  }, [open]);

  // Check if routine name exists
  useEffect(() => {
    if (name.trim()) {
      const routines = getRoutines();
      const currentUserId = getCurrentUserId();
      const exists = routines.some(
        (r) => r.name.toLowerCase() === name.toLowerCase().trim() && r.createdBy === currentUserId
      );
      setNameExists(exists);
    } else {
      setNameExists(false);
    }
  }, [name]);

  const handlePelicoViewToggle = (view: PelicoView) => {
    setPelicoViews((prev) =>
      prev.includes(view) ? prev.filter((v) => v !== view) : [...prev, view]
    );
  };

  const handlePersonaToggle = (persona: Persona) => {
    setPersonas((prev) =>
      prev.includes(persona) ? prev.filter((p) => p !== persona) : [...prev, persona]
    );
  };

  const handleObjectiveToggle = (objective: Objective) => {
    setObjectives((prev) =>
      prev.includes(objective) ? prev.filter((o) => o !== objective) : [...prev, objective]
    );
  };

  const handleImpactZoneToggle = (zone: ImpactZone) => {
    setImpactZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      return;
    }
    if (pelicoViews.length === 0) {
      return;
    }

    // Create routine
    const currentUserId = getCurrentUserId();
    const primaryPelicoView = pelicoViews[0]; // Use first selected as primary
    const routine = createRoutine({
      name: name.trim(),
      description: description.trim() || undefined,
      filters: [],
      sorting: [],
      pelicoView: mapPelicoViewToPage(primaryPelicoView),
      scopeMode: 'scope-aware',
      createdBy: currentUserId,
      teamIds: [teamId], // Add to the current team
    });

    // Call callback to add routine to team
    onRoutineCreated(routine.id);

    // Close modal
    onOpenChange(false);
  };

  const canSave = name.trim().length > 0 && pelicoViews.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Hero Header with Gradient */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
          <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Create Routine
              </DialogTitle>
              <DialogDescription className="sr-only">
                Create a new routine with name, pelico views, and optional characteristics
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 pt-6 pb-6 space-y-6">
              {/* Name (Required) */}
              <div className="space-y-2">
                <Label htmlFor="routine-name" className="text-sm font-semibold">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="routine-name"
                  placeholder="Enter routine name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(nameExists && 'border-amber-500')}
                />
                {nameExists && (
                  <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      A routine with this name already exists. You can still create it, but it may cause confusion.
                    </p>
                  </div>
                )}
              </div>

              {/* Description (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="routine-description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="routine-description"
                  placeholder="Enter routine description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Pelico Views (Required) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Pelico Views <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PELICO_VIEWS.map((view) => (
                    <div
                      key={view}
                      className={cn(
                        'flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all',
                        pelicoViews.includes(view)
                          ? 'border-[#2063F0] bg-[#2063F0]/10'
                          : 'border-border hover:border-[#2063F0]/50 hover:bg-muted/50'
                      )}
                      onClick={() => handlePelicoViewToggle(view)}
                    >
                      <Checkbox
                        checked={pelicoViews.includes(view)}
                        onCheckedChange={() => handlePelicoViewToggle(view)}
                        className="data-[state=checked]:bg-[#2063F0] data-[state=checked]:border-[#2063F0]"
                      />
                      <Label className="text-sm font-medium cursor-pointer flex-1">
                        {view}
                      </Label>
                    </div>
                  ))}
                </div>
                {pelicoViews.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Select at least one Pelico View
                  </p>
                )}
              </div>

              {/* Personas (Optional) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Personas</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {PERSONAS.map((persona) => (
                    <div
                      key={persona}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handlePersonaToggle(persona)}
                    >
                      <Checkbox
                        checked={personas.includes(persona)}
                        onCheckedChange={() => handlePersonaToggle(persona)}
                      />
                      <Label className="text-xs cursor-pointer flex-1">{persona}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objectives (Optional) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Objectives</Label>
                <div className="flex flex-wrap gap-2">
                  {OBJECTIVES.map((objective) => (
                    <div
                      key={objective}
                      className={cn(
                        'flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all',
                        objectives.includes(objective)
                          ? 'border-[#2063F0] bg-[#2063F0]/10'
                          : 'border-border hover:border-[#2063F0]/50'
                      )}
                      onClick={() => handleObjectiveToggle(objective)}
                    >
                      <Checkbox
                        checked={objectives.includes(objective)}
                        onCheckedChange={() => handleObjectiveToggle(objective)}
                        className="data-[state=checked]:bg-[#2063F0] data-[state=checked]:border-[#2063F0]"
                      />
                      <Label className="text-sm cursor-pointer">{objective}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizon (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="routine-horizon" className="text-sm font-semibold">
                  Horizon
                </Label>
                <Select value={horizon} onValueChange={(value) => setHorizon(value as Horizon | 'none')}>
                  <SelectTrigger id="routine-horizon">
                    <SelectValue placeholder="Select horizon (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {HORIZONS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Impact Zones (Optional) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Impact Zones</Label>
                <div className="flex flex-wrap gap-2">
                  {IMPACT_ZONES.map((zone) => (
                    <div
                      key={zone}
                      className={cn(
                        'flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all',
                        impactZones.includes(zone)
                          ? 'border-[#2063F0] bg-[#2063F0]/10'
                          : 'border-border hover:border-[#2063F0]/50'
                      )}
                      onClick={() => handleImpactZoneToggle(zone)}
                    >
                      <Checkbox
                        checked={impactZones.includes(zone)}
                        onCheckedChange={() => handleImpactZoneToggle(zone)}
                        className="data-[state=checked]:bg-[#2063F0] data-[state=checked]:border-[#2063F0]"
                      />
                      <Label className="text-sm cursor-pointer">{zone}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frequency (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="routine-frequency" className="text-sm font-semibold">
                  Frequency
                </Label>
                <Select
                  value={frequency}
                  onValueChange={(value) => setFrequency(value as Frequency | 'none')}
                >
                  <SelectTrigger id="routine-frequency">
                    <SelectValue placeholder="Select frequency (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave}
              className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white disabled:opacity-50"
            >
              Create Routine
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

