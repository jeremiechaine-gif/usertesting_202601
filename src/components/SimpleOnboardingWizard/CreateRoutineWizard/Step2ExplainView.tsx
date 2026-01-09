/**
 * Step 2: Explain the View
 * Explain what the view is for, what decisions are made from it, and what it's not meant to do
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PelicoViewDefinition } from '@/lib/onboarding/pelicoViews';

interface Step2ExplainViewProps {
  view: PelicoViewDefinition;
  onNext: () => void;
  onBack: () => void;
}

export const Step2ExplainView: React.FC<Step2ExplainViewProps> = ({
  view,
  onNext,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#2063F0]" />
          <h3 className="text-lg font-semibold">{view.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {view.shortDescription}
        </p>
      </div>

      {/* View Structure */}
      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">View Structure</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {view.structure === 'table' && 'Table'}
          {view.structure === 'timeline' && 'Timeline'}
          {view.structure === 'time-phased-grid' && 'Time-phased Grid'}
          {view.structure === 'hybrid' && 'Hybrid (Fixed columns + Time horizon)'}
          {view.structure === 'relational-table' && 'Relational Investigation Table'}
        </Badge>
      </div>

      {/* Typical Decisions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#31C7AD]" />
          <h4 className="text-sm font-semibold">What this view helps you decide</h4>
        </div>
        <div className="space-y-2 pl-6">
          {view.typicalDecisions.map((decision, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#31C7AD] mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{decision}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Not Meant For */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-orange-500" />
          <h4 className="text-sm font-semibold">What this view is NOT meant for</h4>
        </div>
        <div className="space-y-2 pl-6">
          {view.notMeantFor.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg border border-[#2063F0]/20 bg-gradient-to-br from-[#2063F0]/5 to-transparent">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-[#2063F0] mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Next: Configure your routine</p>
            <p className="text-xs text-muted-foreground">
              You'll be able to add filters to focus on specific data, set sorting to prioritize what matters most, and adjust view-specific settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


