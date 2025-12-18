/**
 * Scope Dropdown Component
 * Displays current scope and allows selection/creation/editing
 */

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScopeModal } from './ScopeModal';
import { getScopes, deleteScope, type Scope } from '@/lib/scopes';
import { ChevronDown, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScopeDropdownProps {
  selectedScopeId: string | null;
  onScopeSelect: (scopeId: string | null) => void;
  onScopeFiltersChange: (filters: any[]) => void;
}

export const ScopeDropdown: React.FC<ScopeDropdownProps> = ({
  selectedScopeId,
  onScopeSelect,
  onScopeFiltersChange,
}) => {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editScope, setEditScope] = useState<Scope | null>(null);

  useEffect(() => {
    setScopes(getScopes());
  }, []);

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
    setScopes(getScopes());
    setCreateModalOpen(false);
    setEditScope(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto px-3 py-1.5 text-sm">
            <span className={cn(
              "text-[#2063F0]",
              !selectedScope && "text-muted-foreground"
            )}>
              {selectedScope ? `Scope: ${selectedScope.name}` : 'Scope: Select a scope'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Scopes</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {scopes.length === 0 ? (
            <DropdownMenuItem disabled className="text-muted-foreground text-sm">
              No scopes yet
            </DropdownMenuItem>
          ) : (
            scopes.map((scope) => (
              <div key={scope.id} className="group">
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-muted rounded-sm">
                  <DropdownMenuItem
                    className="flex-1 p-0 cursor-pointer"
                    onClick={() => handleScopeSelect(scope.id)}
                  >
                    <span className={cn(
                      "text-sm",
                      selectedScopeId === scope.id && "font-semibold text-[#2063F0]"
                    )}>
                      {scope.name}
                    </span>
                  </DropdownMenuItem>
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
                      <Edit className="h-3 w-3" />
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
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreate} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create new scope
          </DropdownMenuItem>
          {selectedScopeId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleScopeSelect(null)}
                className="cursor-pointer text-muted-foreground"
              >
                Clear selection
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {createModalOpen && (
        <ScopeModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          scope={editScope}
          onSave={handleScopeSaved}
        />
      )}
    </>
  );
};

