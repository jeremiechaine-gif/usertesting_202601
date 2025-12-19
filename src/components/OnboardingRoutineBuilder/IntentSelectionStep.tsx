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

const INTENTS: Array<{ id: Intent; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'Gérer des retards', label: 'Gérer des retards', icon: AlertTriangle },
  { id: 'Anticiper des risques', label: 'Anticiper des risques', icon: Target },
  { id: 'Prioriser des actions', label: 'Prioriser des actions', icon: CheckCircle2 },
  { id: 'Tenir la promesse client', label: 'Tenir la promesse client', icon: Users },
  { id: 'Piloter la charge / la prod', label: 'Piloter la charge / la prod', icon: TrendingUp },
  { id: 'Vision business / KPIs', label: 'Vision business / KPIs', icon: BarChart3 },
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
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select one or more areas you want to improve. This helps us recommend the best routines for you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTENTS.map(({ id, label, icon: Icon }) => {
              const isSelected = localIntents.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => handleToggleIntent(id)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left',
                    'hover:border-[#2063F0] hover:bg-[#2063F0]/5',
                    isSelected
                      ? 'border-[#2063F0] bg-[#2063F0]/10'
                      : 'border-border bg-background'
                  )}
                  aria-pressed={isSelected}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      isSelected ? 'bg-[#2063F0]' : 'bg-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-white' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm block">{label}</span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-[#2063F0] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {localIntents.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-900 dark:text-green-300">
                {localIntents.length} intent{localIntents.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-6 py-4 border-t flex items-center justify-between shrink-0 bg-muted/20">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={localIntents.length === 0}
          className="bg-[#2063F0] hover:bg-[#1a54d8]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

