/**
 * Step 4: Save the Routine
 * Ask for routine name and optional description
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PelicoViewDefinition } from '@/lib/onboarding/pelicoViews';

interface Step4SaveRoutineProps {
  view: PelicoViewDefinition;
  routineName: string;
  routineDescription: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onBack: () => void;
}

export const Step4SaveRoutine: React.FC<Step4SaveRoutineProps> = ({
  view,
  routineName,
  routineDescription,
  onNameChange,
  onDescriptionChange,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Save Your Routine</h3>
        <p className="text-sm text-muted-foreground">
          Give your routine a name and optionally describe when you'll use it.
        </p>
      </div>

      {/* View Summary */}
      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-[#2063F0]" />
          <span className="text-sm font-medium">Based on: {view.name}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {view.shortDescription}
        </p>
      </div>

      {/* Routine Name */}
      <div className="space-y-2">
        <Label htmlFor="routine-name" className="text-sm font-semibold">
          Routine Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="routine-name"
          placeholder="e.g., Critical supplier follow-ups"
          value={routineName}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Choose a name that clearly describes what this routine helps you do.
        </p>
      </div>

      {/* Routine Description */}
      <div className="space-y-2">
        <Label htmlFor="routine-description" className="text-sm font-semibold">
          Description <span className="text-muted-foreground text-xs">(Optional)</span>
        </Label>
        <Textarea
          id="routine-description"
          placeholder="e.g., Use this routine during daily standups to prioritize supplier actions"
          value={routineDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Describe when and how you'll use this routine. This helps you and your team understand its purpose.
        </p>
      </div>

      {/* Reassurance */}
      <div className="p-4 rounded-lg border border-[#31C7AD]/20 bg-gradient-to-br from-[#31C7AD]/5 to-transparent">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-[#31C7AD] mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">You can edit this anytime</p>
            <p className="text-xs text-muted-foreground">
              Routines can be modified after creation. You can change filters, sorting, name, and description whenever needed.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Multiple routines can exist per view, so you can create different configurations for different scenarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

