/**
 * Step 4: Save the Routine
 * Ask for routine name and optional description
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, Info, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PelicoViewDefinition, Persona } from '@/lib/onboarding/pelicoViews';
import { ScrollArea } from '@/components/ui/scroll-area';

// French personas (as shown in the UI)
const PERSONAS_FR: Record<Persona, string> = {
  'Supply Planner': 'Approvisionneur',
  'Buyer': 'Acheteur',
  'Procurement Manager': 'Manager Appro',
  'Assembly Scheduler': 'Ordonnanceur Assemblage',
  'Scheduler': 'Ordonnanceur',
  'Master Planner': 'Master Planner',
  'Logistics Support': 'Support Logistique',
  'Quality Control': 'Recette',
  'Supply Chain Manager': 'Responsable Supply Chain',
  'Supply Chain Director': 'Directeur Supply Chain',
  'Scheduling & Logistics Manager': 'Responsable Ordo & Support log',
  'Customer Support': 'Support Client',
  'Production Controller': 'Contrôleur de Production',
  'Planner': 'Planificateur',
  'Other / Mixed': 'Autre / Mixte',
};

const ALL_PERSONAS: Persona[] = [
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
  'Customer Support',
  'Production Controller',
  'Planner',
  'Other / Mixed',
];

interface Step4SaveRoutineProps {
  view: PelicoViewDefinition;
  routineName: string;
  routineDescription: string;
  selectedPersonas: Persona[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onPersonasChange: (personas: Persona[]) => void;
  onBack: () => void;
}

export const Step4SaveRoutine: React.FC<Step4SaveRoutineProps> = ({
  view,
  routineName,
  routineDescription,
  selectedPersonas,
  onNameChange,
  onDescriptionChange,
  onPersonasChange,
  onBack,
}) => {
  const handlePersonaToggle = (persona: Persona) => {
    if (selectedPersonas.includes(persona)) {
      onPersonasChange(selectedPersonas.filter(p => p !== persona));
    } else {
      onPersonasChange([...selectedPersonas, persona]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Enregistrer votre routine</h3>
        <p className="text-sm text-muted-foreground">
          Donnez un nom à votre routine et décrivez optionnellement quand vous l'utiliserez.
        </p>
      </div>

      {/* View Summary */}
      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-[#2063F0]" />
          <span className="text-sm font-medium">Basé sur : {view.name}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {view.shortDescription}
        </p>
      </div>

      {/* Routine Name */}
      <div className="space-y-2">
        <Label htmlFor="routine-name" className="text-sm font-semibold">
          Nom de la routine <span className="text-destructive">*</span>
        </Label>
        <Input
          id="routine-name"
          placeholder="Ex: Suivi critique des fournisseurs"
          value={routineName}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Choisissez un nom qui décrit clairement ce que cette routine vous aide à faire.
        </p>
      </div>

      {/* Routine Description */}
      <div className="space-y-2">
        <Label htmlFor="routine-description" className="text-sm font-semibold">
          Description <span className="text-muted-foreground text-xs">(Optionnel)</span>
        </Label>
        <Textarea
          id="routine-description"
          placeholder="Ex: Utilisez cette routine lors des points quotidiens pour prioriser les actions fournisseurs"
          value={routineDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Décrivez quand et comment vous utiliserez cette routine. Cela aide vous et votre équipe à comprendre son objectif.
        </p>
      </div>

      {/* Personas Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Recommandé pour les personas <span className="text-muted-foreground text-xs font-normal">(Optionnel)</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Sélectionnez les personas pour lesquelles cette routine devrait être suggérée. Cela aide les autres à découvrir votre routine.
        </p>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-4">
              {ALL_PERSONAS.map((persona) => {
                const isSelected = selectedPersonas.includes(persona);
                const isRecommended = view.recommendedPersonas.includes(persona);
                return (
                  <div
                    key={persona}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-md transition-colors',
                      isSelected && 'bg-[#2063F0]/10',
                      !isSelected && 'hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      id={`persona-${persona}`}
                      checked={isSelected}
                      onCheckedChange={() => handlePersonaToggle(persona)}
                      className="data-[state=checked]:bg-[#2063F0] data-[state=checked]:border-[#2063F0]"
                    />
                    <Label
                      htmlFor={`persona-${persona}`}
                      className="flex-1 cursor-pointer text-sm font-normal"
                    >
                      {PERSONAS_FR[persona] || persona}
                    </Label>
                    {isRecommended && (
                      <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30">
                        Recommandé
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        {selectedPersonas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedPersonas.map((persona) => (
              <Badge
                key={persona}
                variant="secondary"
                className="bg-[#2063F0]/10 text-[#2063F0] border-[#2063F0]/30"
              >
                {PERSONAS_FR[persona] || persona}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Reassurance */}
      <div className="p-4 rounded-lg border border-[#31C7AD]/20 bg-gradient-to-br from-[#31C7AD]/5 to-transparent">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-[#31C7AD] mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Vous pouvez modifier cela à tout moment</p>
            <p className="text-xs text-muted-foreground">
              Les routines peuvent être modifiées après leur création. Vous pouvez changer les filtres, le tri, le nom et la description quand vous en avez besoin.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Plusieurs routines peuvent exister par vue, vous pouvez donc créer différentes configurations pour différents scénarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

