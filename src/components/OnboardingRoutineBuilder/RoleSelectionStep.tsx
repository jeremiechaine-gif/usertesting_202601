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
      <div className="px-8 py-6 space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20">
          <div className="p-2 rounded-lg bg-[#31C7AD]/10">
            <User className="h-5 w-5 text-[#31C7AD]" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Choose your role</p>
            <p className="text-xs text-muted-foreground">
              We'll recommend the most relevant routines for your daily work
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROLES.map((role) => {
            const isSelected = selectedPersona === role;
            return (
              <button
                key={role}
                onClick={() => onSelect(role)}
                className={cn(
                  'group relative flex items-center justify-between p-4 rounded-xl transition-all text-left',
                  'border-2 hover:shadow-md',
                  isSelected
                    ? 'border-[#2063F0] bg-gradient-to-br from-[#2063F0]/10 to-[#2063F0]/5 shadow-lg shadow-[#2063F0]/10'
                    : 'border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent'
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2.5 rounded-lg transition-all',
                      isSelected 
                        ? 'bg-gradient-to-br from-[#2063F0] to-[#1a54d8] shadow-md' 
                        : 'bg-muted group-hover:bg-[#31C7AD]/10'
                    )}
                  >
                    <User
                      className={cn(
                        'h-5 w-5 transition-colors',
                        isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-[#31C7AD]'
                      )}
                    />
                  </div>
                  <span className={cn(
                    "font-medium text-sm transition-colors",
                    isSelected && "text-[#2063F0]"
                  )}>
                    {role}
                  </span>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-[#2063F0]">Selected</span>
                    <ChevronRight className="h-5 w-5 text-[#2063F0]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};

