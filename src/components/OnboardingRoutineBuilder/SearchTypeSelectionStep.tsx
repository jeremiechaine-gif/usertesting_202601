/**
 * Step 0: Search Type Selection
 * User chooses how they want to find routines:
 * - By Personas (role-based)
 * - By Objectives (goal-based)
 * - Complete List (browse all)
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Target, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SearchType = 'personas' | 'objectives' | 'complete';

interface SearchTypeSelectionStepProps {
  selectedType: SearchType | null;
  onSelect: (type: SearchType) => void;
  onNext: () => void;
}

const SEARCH_TYPES: Array<{
  id: SearchType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}> = [
  {
    id: 'personas',
    icon: Users,
    title: 'By Personas',
    description: 'Select your role to get personalized recommendations',
    gradient: 'from-[#2063F0]/10 to-[#2063F0]/5',
    iconBg: 'bg-gradient-to-br from-[#2063F0] to-[#1a54d8]',
  },
  {
    id: 'objectives',
    icon: Target,
    title: 'By Objectives',
    description: 'Choose your goals to find routines that match your needs',
    gradient: 'from-[#31C7AD]/10 to-[#31C7AD]/5',
    iconBg: 'bg-gradient-to-br from-[#31C7AD] to-[#2ab89a]',
  },
  {
    id: 'complete',
    icon: List,
    title: 'Complete List',
    description: 'Browse all available routines with search and filters',
    gradient: 'from-purple-500/10 to-purple-500/5',
    iconBg: 'bg-gradient-to-br from-purple-600 to-purple-700',
  },
];

export const SearchTypeSelectionStep: React.FC<SearchTypeSelectionStepProps> = ({
  selectedType,
  onSelect,
  onNext,
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
              <p className="text-sm font-medium mb-1">Choose your search method</p>
              <p className="text-xs text-muted-foreground">
                Select how you'd like to discover and select routines that fit your workflow
              </p>
            </div>
          </div>

          {/* Search Type Options - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SEARCH_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <button
                  key={type.id}
                  onClick={() => onSelect(type.id)}
                  className={cn(
                    'group relative w-full h-full flex flex-col items-start gap-4 p-5 rounded-xl transition-all text-left',
                    'border-2 hover:shadow-md',
                    isSelected
                      ? `border-[#2063F0] bg-gradient-to-br ${type.gradient} shadow-lg shadow-[#2063F0]/10`
                      : 'border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent'
                  )}
                  aria-pressed={isSelected}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'p-3 rounded-lg transition-all shrink-0',
                      isSelected 
                        ? `${type.iconBg} shadow-md` 
                        : 'bg-muted group-hover:bg-[#31C7AD]/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-6 w-6 transition-colors',
                        isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-[#31C7AD]'
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 w-full">
                    <h3 className={cn(
                      "font-semibold text-base mb-2 transition-colors",
                      isSelected && "text-[#2063F0]"
                    )}>
                      {type.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {type.description}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full bg-[#2063F0] shadow-md shrink-0">
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
        <div className="flex items-center justify-end">
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

