/**
 * Step 1: Role Selection
 * User selects their primary role, which preselects default routines
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, ChevronRight } from 'lucide-react';
import type { Persona } from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';

const ROLES: Persona[] = [
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

interface RoleSelectionStepProps {
  selectedPersona: Persona | null;
  onSelect: (persona: Persona) => void;
}

export const RoleSelectionStep: React.FC<RoleSelectionStepProps> = ({
  selectedPersona,
  onSelect,
}) => {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="px-6 py-4 space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Select your primary role to get started with recommended routines
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROLES.map((role) => {
            const isSelected = selectedPersona === role;
            return (
              <button
                key={role}
                onClick={() => onSelect(role)}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left',
                  'hover:border-[#2063F0] hover:bg-[#2063F0]/5',
                  isSelected
                    ? 'border-[#2063F0] bg-[#2063F0]/10'
                    : 'border-border bg-background'
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isSelected ? 'bg-[#2063F0]' : 'bg-muted'
                    )}
                  >
                    <User
                      className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-white' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <span className="font-medium text-sm">{role}</span>
                </div>
                {isSelected && (
                  <ChevronRight className="h-5 w-5 text-[#2063F0]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};

