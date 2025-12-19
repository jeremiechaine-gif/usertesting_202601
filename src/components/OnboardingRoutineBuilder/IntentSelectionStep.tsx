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
    id: 'Gérer des retards', 
    label: 'Gérer des retards', 
    description: 'Traiter les POs en retard, escalader et corriger les problèmes de livraison',
    icon: AlertTriangle 
  },
  { 
    id: 'Anticiper des risques', 
    label: 'Anticiper des risques', 
    description: 'Identifier proactivement les risques supply chain avant qu\'ils ne deviennent critiques',
    icon: Target 
  },
  { 
    id: 'Prioriser des actions', 
    label: 'Prioriser des actions', 
    description: 'Déterminer quelles commandes et actions traiter en priorité selon leur impact',
    icon: CheckCircle2 
  },
  { 
    id: 'Tenir la promesse client', 
    label: 'Tenir la promesse client', 
    description: 'Assurer les dates de livraison promises et maintenir la satisfaction client',
    icon: Users 
  },
  { 
    id: 'Piloter la charge / la prod', 
    label: 'Piloter la charge / la prod', 
    description: 'Optimiser la planification de production et l\'équilibrage des capacités',
    icon: TrendingUp 
  },
  { 
    id: 'Vision business / KPIs', 
    label: 'Vision business / KPIs', 
    description: 'Suivre la performance globale et les indicateurs clés de votre supply chain',
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
        <div className="px-8 py-6 space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-[#31C7AD]/5 to-[#2063F0]/5 border border-[#31C7AD]/20">
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

      <div className="px-8 py-5 border-t bg-gradient-to-b from-muted/30 to-background flex items-center justify-between shrink-0">
        <Button variant="outline" onClick={onBack} className="h-10 px-6">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={localIntents.length === 0}
          className="h-10 px-8 bg-gradient-to-r from-[#2063F0] to-[#1a54d8] hover:from-[#1a54d8] hover:to-[#164ab8] shadow-lg shadow-[#2063F0]/30"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

