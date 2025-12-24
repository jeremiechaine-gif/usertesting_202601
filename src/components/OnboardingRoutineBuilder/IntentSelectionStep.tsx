/**
 * Step 2: Intent Selection
 * Multi-select cards for what user wants to improve
 * Updates scoring live as user selects
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertTriangle, Target, TrendingUp, Users, BarChart3 } from 'lucide-react';
import type { Intent } from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';

const INTENTS: Array<{ 
  id: Intent; 
  label: string; 
  description: string;
  icon: React.ComponentType<{ className?: string }> 
}> = [
  { 
    id: 'Manage delays', 
    label: 'Manage delays', 
    description: 'Handle delayed purchase orders, escalate issues, and correct delivery problems',
    icon: AlertTriangle 
  },
  { 
    id: 'Anticipate risks', 
    label: 'Anticipate risks', 
    description: 'Proactively identify supply chain risks before they become critical',
    icon: Target 
  },
  { 
    id: 'Prioritize actions', 
    label: 'Prioritize actions', 
    description: 'Determine which orders and actions to handle first based on their impact',
    icon: CheckCircle2 
  },
  { 
    id: 'Meet customer commitments', 
    label: 'Meet customer commitments', 
    description: 'Ensure promised delivery dates and maintain customer satisfaction',
    icon: Users 
  },
  { 
    id: 'Monitor workload / production', 
    label: 'Monitor workload / production', 
    description: 'Optimize production planning and balance capacity',
    icon: TrendingUp 
  },
  { 
    id: 'Business insights / KPIs', 
    label: 'Business insights / KPIs', 
    description: 'Track overall performance and key indicators of your supply chain',
    icon: BarChart3 
  },
];

interface IntentSelectionStepProps {
  selectedIntents: Intent[];
  onSelect: (intents: Intent[]) => void;
  onBack: () => void;
}

export const IntentSelectionStep: React.FC<IntentSelectionStepProps> = ({
  selectedIntents,
  onSelect,
  onBack,
}) => {
  const [localIntents, setLocalIntents] = useState<Intent[]>(selectedIntents);

  const handleToggleIntent = (intent: Intent) => {
    const newIntents = localIntents.includes(intent)
      ? localIntents.filter((i) => i !== intent)
      : [...localIntents, intent];
    setLocalIntents(newIntents);
  };

  const handleContinue = () => {
    onSelect(localIntents);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-8 pt-4 space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5">
            <div className="p-2 rounded-lg bg-[#2063F0]/10">
              <Target className="h-5 w-5 text-[#2063F0]" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Select your goals</p>
              <p className="text-xs text-muted-foreground">
                Choose one or more areas to focus on. We'll prioritize routines that match your objectives.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTENTS.map(({ id, label, description, icon: Icon }) => {
              const isSelected = localIntents.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => handleToggleIntent(id)}
                  className={cn(
                    'group relative flex items-start gap-3 p-4 rounded-xl transition-all text-left',
                    'border-2 hover:shadow-md',
                    isSelected
                      ? 'border-[#2063F0] bg-gradient-to-br from-[#2063F0]/10 to-[#2063F0]/5 shadow-lg shadow-[#2063F0]/10'
                      : 'border-border bg-background hover:border-[#31C7AD]/50 hover:bg-gradient-to-br hover:from-[#31C7AD]/5 hover:to-transparent'
                  )}
                  aria-pressed={isSelected}
                >
                  <div
                    className={cn(
                      'p-2.5 rounded-lg shrink-0 transition-all',
                      isSelected 
                        ? 'bg-gradient-to-br from-[#2063F0] to-[#1a54d8] shadow-md' 
                        : 'bg-muted group-hover:bg-[#31C7AD]/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-colors',
                        isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-[#31C7AD]'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <span className={cn(
                      "font-semibold text-sm block mb-1 transition-colors",
                      isSelected && "text-[#2063F0]"
                    )}>
                      {label}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-[#2063F0] shrink-0 animate-in zoom-in duration-200" />
                  )}
                </button>
              );
            })}
          </div>

          {localIntents.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#31C7AD]/10 to-[#31C7AD]/5 border border-[#31C7AD]/30 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#31C7AD]/20">
                  <CheckCircle2 className="h-4 w-4 text-[#31C7AD]" />
                </div>
                <p className="text-sm font-medium text-[#31C7AD]">
                  {localIntents.length} goal{localIntents.length > 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-8 py-4 border-t border-border/50 bg-background shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-[#2063F0] hover:bg-[#2063F0]/5 gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={localIntents.length === 0}
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

