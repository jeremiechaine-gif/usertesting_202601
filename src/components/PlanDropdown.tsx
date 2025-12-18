/**
 * Plan Dropdown Component
 * Displays current plan (ERP Plan / Production Plan) and allows selection
 * Same style as ScopeDropdown and RoutineDropdown
 */

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanType = 'erp' | 'prod';

interface PlanDropdownProps {
  selectedPlan: PlanType | null;
  onPlanSelect: (plan: PlanType | null) => void;
}

const plans: { id: PlanType; name: string }[] = [
  { id: 'erp', name: 'ERP Plan' },
  { id: 'prod', name: 'Production Plan' },
];

export const PlanDropdown: React.FC<PlanDropdownProps> = ({
  selectedPlan,
  onPlanSelect,
}) => {
  const selectedPlanData = selectedPlan 
    ? plans.find((p) => p.id === selectedPlan) 
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "h-auto px-3 py-1.5 text-sm rounded-md transition-colors",
            "bg-muted/50 hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selectedPlanData 
              ? "text-foreground font-medium" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>
            {selectedPlanData ? `Plan: ${selectedPlanData.name}` : 'Plan: Select a plan'}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Plans</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {plans.map((plan) => (
          <DropdownMenuItem
            key={plan.id}
            onClick={() => onPlanSelect(plan.id)}
            className={cn(
              "cursor-pointer",
              selectedPlan === plan.id && "bg-muted font-medium"
            )}
          >
            {plan.name}
          </DropdownMenuItem>
        ))}
        {selectedPlan && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onPlanSelect(null)}
              className="cursor-pointer text-muted-foreground"
            >
              Clear selection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


