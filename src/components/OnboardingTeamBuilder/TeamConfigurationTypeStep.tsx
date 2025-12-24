/**
 * Step 0: Configuration Type Selection
 * User chooses how to create teams:
 * - Create teams from personas (uses personas from Create Routine)
 * - Manual setup (create teams manually)
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Settings, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfigurationType = 'personas' | 'manual';

interface TeamConfigurationTypeStepProps {
  selectedType: ConfigurationType | null;
  onSelect: (type: ConfigurationType) => void;
  onNext: () => void;
  onClearAll: () => void;
}

const CONFIGURATION_TYPES: Array<{
  id: ConfigurationType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}> = [
  {
    id: 'personas',
    icon: Users,
    title: 'Create teams from personas',
    description: 'Automatically create teams based on roles selected in routine creation',
    gradient: 'from-[#2063F0]/10 to-[#2063F0]/5',
    iconBg: 'bg-gradient-to-br from-[#2063F0] to-[#1a54d8]',
  },
  {
    id: 'manual',
    icon: Settings,
    title: 'Manual setup',
    description: 'Create and configure teams manually with full control',
    gradient: 'from-[#31C7AD]/10 to-[#31C7AD]/5',
    iconBg: 'bg-gradient-to-br from-[#31C7AD] to-[#2ab89a]',
  },
];

export const TeamConfigurationTypeStep: React.FC<TeamConfigurationTypeStepProps> = ({
  selectedType,
  onSelect,
  onNext,
  onClearAll,
}) => {
  const canContinue = selectedType !== null;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-8 pt-4 pb-0">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 mb-6">
            <div className="p-2 rounded-lg bg-[#31C7AD]/10">
              <Target className="h-5 w-5 text-[#31C7AD]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Choose your team setup method</p>
              <p className="text-xs text-muted-foreground">
                Select how you'd like to create and configure your teams
              </p>
            </div>
          </div>

          {/* Configuration Type Options - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONFIGURATION_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <button
                  key={type.id}
                  onClick={() => onSelect(type.id)}
                  className={cn(
                    'group relative flex flex-col items-start p-6 rounded-xl border-2 transition-all text-left h-full',
                    'hover:shadow-lg',
                    isSelected
                      ? 'border-[#2063F0] bg-gradient-to-br from-[#2063F0]/10 to-[#2063F0]/5 shadow-lg shadow-[#2063F0]/10'
                      : 'border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent'
                  )}
                  aria-pressed={isSelected}
                >
                  <div className={cn(
                    'p-3 rounded-lg mb-4 transition-all',
                    isSelected ? type.iconBg + ' shadow-md' : 'bg-muted group-hover:bg-[#31C7AD]/10'
                  )}>
                    <Icon className={cn(
                      'h-6 w-6 transition-colors',
                      isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-[#31C7AD]'
                    )} />
                  </div>
                  
                  <h3 className={cn(
                    'text-lg font-bold mb-2 transition-colors',
                    isSelected && 'text-[#2063F0]'
                  )}>
                    {type.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                  
                  {isSelected && (
                    <div className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full bg-[#2063F0] shadow-md">
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

      {/* Footer */}
      <div className="px-8 py-4 border-t border-border/50 bg-background shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
          >
            Clear All
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



