/**
 * Step 1: Role Selection
 * User selects their primary role, which preselects default routines
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, ArrowLeft } from 'lucide-react';
import type { Persona } from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';

const ROLES: Persona[] = [
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

interface RoleSelectionStepProps {
  selectedPersonas: Persona[];
  onToggle: (persona: Persona) => void;
  isUnsure?: boolean;
  onUnsureChange?: (unsure: boolean) => void;
  onSkipToAll?: () => void;
  onSeeAllRoutines?: () => void;
  onBack: () => void;
  onNext: () => void;
}

export const RoleSelectionStep: React.FC<RoleSelectionStepProps> = ({
  selectedPersonas,
  onToggle,
  onBack,
  onNext,
}) => {
  const canContinue = selectedPersonas.length > 0;
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-8 pt-4 space-y-6 pb-0">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5">
            <div className="p-2 rounded-lg bg-[#31C7AD]/10">
              <User className="h-5 w-5 text-[#31C7AD]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Choose your role(s)</p>
              <p className="text-xs text-muted-foreground">
                Select one or more roles. We'll recommend the most relevant routines for your daily work
              </p>
            </div>
            {selectedPersonas.length > 0 && (
              <div className="shrink-0">
                <div className="px-2.5 py-1 rounded-full bg-[#2063F0]/10 border border-[#2063F0]/20">
                  <span className="text-xs font-semibold text-[#2063F0]">
                    {selectedPersonas.length} selected
                  </span>
                </div>
              </div>
            )}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ROLES.map((role) => {
            const isSelected = selectedPersonas.includes(role);
            return (
              <button
                key={role}
                onClick={() => {
                  onToggle(role);
                }}
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
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2063F0] shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        </div>
      </ScrollArea>

      {/* Footer with Back and Next buttons */}
      <div className="px-8 py-4 border-t border-border/50 bg-background shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-[#2063F0] hover:bg-[#2063F0]/5 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <Button
            onClick={onNext}
            disabled={!canContinue}
            className="gap-2 bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

