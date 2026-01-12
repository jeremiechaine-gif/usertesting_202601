/**
 * Parameters Drawer Component
 * Displays Scope and Plan options in a right-side drawer
 */

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScopeModal } from './ScopeModal';
import { getScopes, deleteScope, setDefaultScope, type Scope } from '@/lib/scopes';
import { useScope } from '@/contexts/ScopeContext';
import { Settings, X, Plus, Edit, Trash2, Star, Info, Target, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanType = 'erp' | 'prod';

interface ParametersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedScopeId: string | null;
  onScopeSelect: (scopeId: string | null) => void;
  onScopeFiltersChange: (filters: any[]) => void;
  selectedPlan: PlanType | null;
  onPlanSelect: (plan: PlanType | null) => void;
}

const plans: { id: PlanType; name: string }[] = [
  { id: 'erp', name: 'ERP Plan' },
  { id: 'prod', name: 'Production Plan' },
];

export const ParametersDrawer: React.FC<ParametersDrawerProps> = ({
  open,
  onOpenChange,
  selectedScopeId,
  onScopeSelect,
  onScopeFiltersChange,
  selectedPlan,
  onPlanSelect,
}) => {
  const { refreshScopes } = useScope();
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editScope, setEditScope] = useState<Scope | null>(null);

  useEffect(() => {
    if (open) {
      setScopes(getScopes());
    }
  }, [open]);

  const selectedScope = selectedScopeId ? scopes.find((s) => s.id === selectedScopeId) : null;

  const handleCreate = () => {
    setEditScope(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (scope: Scope) => {
    setEditScope(scope);
    setCreateModalOpen(true);
  };

  const handleDelete = (scopeId: string) => {
    if (confirm('Are you sure you want to delete this scope?')) {
      deleteScope(scopeId);
      setScopes(getScopes());
      if (selectedScopeId === scopeId) {
        onScopeSelect(null);
        onScopeFiltersChange([]);
      }
      refreshScopes();
    }
  };

  const handleScopeSelect = (scopeId: string | null) => {
    onScopeSelect(scopeId);
    if (scopeId) {
      const scope = scopes.find((s) => s.id === scopeId);
      if (scope) {
        // Convert scope filters to table filters format
        const tableFilters = scope.filters
          .filter((filter) => filter.values.length > 0) // Only include filters with values
          .map((filter) => ({
            id: filter.filterId,
            value: filter.condition
              ? { condition: filter.condition, values: filter.values }
              : filter.values,
          }));
        onScopeFiltersChange(tableFilters);
      }
    } else {
      onScopeFiltersChange([]);
    }
  };

  const handleScopeSaved = () => {
    const updatedScopes = getScopes();
    setScopes(updatedScopes);
    refreshScopes();
    setCreateModalOpen(false);
    setEditScope(null);
  };

  const handleSetDefault = (scopeId: string) => {
    setDefaultScope(scopeId);
    const updatedScopes = getScopes();
    setScopes(updatedScopes);
    refreshScopes();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[800px] max-w-[90vw] p-0 flex flex-col !top-4 !bottom-4 !right-4 !left-auto !h-[calc(100vh-32px)] !max-h-[calc(100vh-32px)] rounded-lg [&>button]:hidden"
          style={{
            top: '16px',
            bottom: '16px',
            right: '16px',
            left: 'auto',
            height: 'calc(100vh - 32px)',
            maxHeight: 'calc(100vh - 32px)',
            width: '800px',
          }}
        >
          <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
              <div className="relative px-6 pt-6 pb-5 border-b border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      Parameters
                    </h3>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => onOpenChange(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-5 space-y-6 min-w-0">
                <Accordion type="multiple" defaultValue={['scope', 'plan']} className="w-full min-w-0">
                  {/* SCOPE Section */}
                  <AccordionItem value="scope" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-gradient-to-br from-[#31C7AD]/10 to-[#2063F0]/10">
                          <Target className="h-3.5 w-3.5 text-[#31C7AD]" />
                        </div>
                        <span className="text-sm font-medium">
                          SCOPE
                        </span>
                        {selectedScopeId && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-xs text-muted-foreground ml-1 bg-muted/60 border-border/60">
                            1
                          </Badge>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="ml-1 p-0.5 rounded hover:bg-muted/50 cursor-help">
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-medium text-foreground">Scope</span> defines the context and filters that apply to your current view. Select a scope to filter data automatically.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 pb-4 min-w-0">
                      <div className="space-y-3">
                        {scopes.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-4 text-center">
                            No scopes yet
                          </div>
                        ) : (
                          scopes.map((scope) => (
                            <div
                              key={scope.id}
                              className={cn(
                                'group relative rounded-lg border border-border/60 bg-background p-3.5 transition-all hover:border-[#2063F0]/30 hover:shadow-sm cursor-pointer',
                                selectedScopeId === scope.id && 'border-[#2063F0]/50 bg-[#2063F0]/5'
                              )}
                              onClick={() => handleScopeSelect(scope.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <span
                                    className={cn(
                                      'text-sm font-medium',
                                      selectedScopeId === scope.id && 'text-[#2063F0] font-semibold'
                                    )}
                                  >
                                    {scope.name}
                                  </span>
                                  {scope.isDefault && (
                                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                  )}
                                  {selectedScopeId === scope.id && (
                                    <CheckCircle2 className="h-4 w-4 text-[#2063F0]" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(scope);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(scope.id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <Button
                          variant="accent"
                          size="sm"
                          className="w-full h-9 gap-2"
                          onClick={handleCreate}
                        >
                          <Plus className="h-4 w-4" />
                          Create new scope
                        </Button>
                        {selectedScopeId && selectedScope && !selectedScope.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-9 gap-2 text-muted-foreground"
                            onClick={() => handleSetDefault(selectedScope.id)}
                          >
                            <Star className="h-4 w-4" />
                            Set as default scope
                          </Button>
                        )}
                        {selectedScopeId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-9 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleScopeSelect(null)}
                          >
                            Clear selection
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <Separator className="my-6" />

                  {/* PLAN Section */}
                  <AccordionItem value="plan" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-gradient-to-br from-[#2063F0]/10 to-[#31C7AD]/10">
                          <FileText className="h-3.5 w-3.5 text-[#2063F0]" />
                        </div>
                        <span className="text-sm font-medium">
                          PLAN
                        </span>
                        {selectedPlan && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-xs text-muted-foreground ml-1 bg-muted/60 border-border/60">
                            1
                          </Badge>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="ml-1 p-0.5 rounded hover:bg-muted/50 cursor-help">
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-medium text-foreground">Plan</span> determines which data source is used: ERP Plan for enterprise resource planning data, or Production Plan for production-specific data.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 pb-4 min-w-0">
                      <div className="space-y-3">
                        {plans.map((plan) => (
                          <div
                            key={plan.id}
                            className={cn(
                              'group relative rounded-lg border border-border/60 bg-background p-3.5 transition-all hover:border-[#2063F0]/30 hover:shadow-sm cursor-pointer',
                              selectedPlan === plan.id && 'border-[#2063F0]/50 bg-[#2063F0]/5'
                            )}
                            onClick={() => onPlanSelect(plan.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'text-sm font-medium',
                                    selectedPlan === plan.id && 'text-[#2063F0] font-semibold'
                                  )}
                                >
                                  {plan.name}
                                </span>
                                {selectedPlan === plan.id && (
                                  <CheckCircle2 className="h-4 w-4 text-[#2063F0]" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedPlan && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-9 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onPlanSelect(null)}
                          >
                            Clear selection
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {createModalOpen && (
        <ScopeModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          scope={editScope}
          title={editScope ? 'Edit Scope' : 'Create New Scope'}
          onSave={handleScopeSaved}
        />
      )}
    </>
  );
};
