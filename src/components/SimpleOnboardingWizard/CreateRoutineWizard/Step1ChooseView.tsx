/**
 * Step 1: Choose a View
 * Display recommended views (if persona known) or all views grouped by intent
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, AlertCircle, Zap, TrendingUp, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PelicoViewDefinition, ViewIntent } from '@/lib/onboarding/pelicoViews';

interface Step1ChooseViewProps {
  recommendedViews: PelicoViewDefinition[];
  allViews: PelicoViewDefinition[];
  viewsByIntent: Record<ViewIntent, PelicoViewDefinition[]>;
  showAllViews: boolean;
  onToggleShowAll: () => void;
  onViewSelect: (view: PelicoViewDefinition) => void;
  hasPersona: boolean;
  personaName?: string; // French persona name to display
}

const INTENT_LABELS: Record<ViewIntent, { label: string; icon: React.ReactNode; description: string }> = {
  'resolve-blockers': {
    label: 'Resolve Blockers',
    icon: <AlertCircle className="h-4 w-4" />,
    description: 'Identify and resolve operational disruptions',
  },
  'execute-operations': {
    label: 'Execute Operations',
    icon: <Zap className="h-4 w-4" />,
    description: 'Manage daily execution and commitments',
  },
  'anticipate-risks': {
    label: 'Anticipate Risks',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Plan ahead and assess future risks',
  },
  'manage-customer-commitments': {
    label: 'Manage Customer Commitments',
    icon: <Users className="h-4 w-4" />,
    description: 'Track and fulfill customer orders',
  },
  'investigate-causes-impacts': {
    label: 'Investigate Causes & Impacts',
    icon: <Search className="h-4 w-4" />,
    description: 'Analyze root causes and downstream effects',
  },
};

export const Step1ChooseView: React.FC<Step1ChooseViewProps> = ({
  recommendedViews,
  allViews,
  viewsByIntent,
  showAllViews,
  onToggleShowAll,
  onViewSelect,
  hasPersona,
  personaName,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Choose a View</h3>
        <p className="text-sm text-muted-foreground">
          Select the Pelico view you want to base your routine on. Each view is designed for specific decision-making needs.
        </p>
      </div>

      {/* Recommended Views Section */}
      {hasPersona && recommendedViews.length > 0 && !showAllViews && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#31C7AD]" />
              <span className="text-sm font-medium">
                {personaName ? `Recommended for ${personaName}` : 'Recommended for your role'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleShowAll}
              className="text-xs"
            >
              Show all views
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendedViews.map((view) => (
              <button
                key={view.id}
                onClick={() => onViewSelect(view)}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                  'border-[#2063F0]/20 hover:border-[#2063F0]/40 bg-gradient-to-br from-[#2063F0]/5 to-transparent'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#2063F0]" />
                    <span className="text-sm font-semibold">{view.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30">
                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                    Recommended
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {view.shortDescription}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {view.structure === 'table' && 'Table'}
                    {view.structure === 'timeline' && 'Timeline'}
                    {view.structure === 'time-phased-grid' && 'Time-phased'}
                    {view.structure === 'hybrid' && 'Hybrid'}
                    {view.structure === 'relational-table' && 'Relational'}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Views Section */}
      {(showAllViews || !hasPersona || recommendedViews.length === 0) && (
        <div className="space-y-6">
          {hasPersona && recommendedViews.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">All Views</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleShowAll}
                className="text-xs"
              >
                Show recommended only
              </Button>
            </div>
          )}

          {Object.entries(viewsByIntent).map(([intent, views]) => {
            if (views.length === 0) return null;
            const intentInfo = INTENT_LABELS[intent as ViewIntent];
            
            return (
              <div key={intent} className="space-y-3">
                <div className="flex items-center gap-2">
                  {intentInfo.icon}
                  <div>
                    <h4 className="text-sm font-semibold">{intentInfo.label}</h4>
                    <p className="text-xs text-muted-foreground">{intentInfo.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {views.map((view) => {
                    const isRecommended = recommendedViews.some(v => v.id === view.id);
                    
                    return (
                      <button
                        key={view.id}
                        onClick={() => onViewSelect(view)}
                        className={cn(
                          'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                          isRecommended
                            ? 'border-[#2063F0]/20 hover:border-[#2063F0]/40 bg-gradient-to-br from-[#2063F0]/5 to-transparent'
                            : 'border-border hover:border-[#2063F0]/30 bg-background'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-[#2063F0]" />
                            <span className="text-sm font-semibold">{view.name}</span>
                          </div>
                          {isRecommended && (
                            <Badge variant="outline" className="text-xs bg-[#31C7AD]/10 text-[#31C7AD] border-[#31C7AD]/30">
                              <Sparkles className="h-2.5 w-2.5 mr-1" />
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {view.shortDescription}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {view.structure === 'table' && 'Table'}
                            {view.structure === 'timeline' && 'Timeline'}
                            {view.structure === 'time-phased-grid' && 'Time-phased'}
                            {view.structure === 'hybrid' && 'Hybrid'}
                            {view.structure === 'relational-table' && 'Relational'}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

