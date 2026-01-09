/**
 * Routine Chip Component
 * Reusable component for displaying routine cards/chips with consistent styling
 * Used across the application for routine selection and display
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Eye, Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPelicoViewDisplayName } from '@/lib/routines';
import type { PelicoViewPage } from '@/lib/routines';

export interface RoutineChipProps {
  /** Routine name/title */
  name: string;
  /** Routine description */
  description?: string;
  /** Pelico View associated with this routine (single or array - first one will be used) */
  pelicoView?: PelicoViewPage | string | (PelicoViewPage | string)[];
  /** Whether the routine is selected/added */
  selected?: boolean;
  /** Whether to show "Suggested" indicator (icon with tooltip) */
  isSuggested?: boolean;
  /** Whether to show "Custom" badge */
  isCustom?: boolean;
  /** Callback when preview button is clicked */
  onPreview?: () => void;
  /** Callback when add/remove button is clicked */
  onToggle?: () => void;
  /** Custom className for the chip container */
  className?: string;
  /** Whether to show action buttons (Preview, Add/Remove) */
  showActions?: boolean;
  /** Custom label for the toggle button when selected */
  removeLabel?: string;
  /** Custom label for the toggle button when not selected */
  addLabel?: string;
}

export const RoutineChip: React.FC<RoutineChipProps> = ({
  name,
  description,
  pelicoView,
  selected = false,
  isSuggested = false,
  isCustom = false,
  onPreview,
  onToggle,
  className,
  showActions = true,
  removeLabel = 'Remove',
  addLabel = 'Add',
}) => {
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview();
    }
  };

  // Map PelicoView (from RoutineLibraryEntry) to PelicoViewPage
  const mapPelicoViewToPage = (view: string): PelicoViewPage | null => {
    const viewMap: Record<string, PelicoViewPage> = {
      'Supply': 'supply',
      'Production Control': 'so-book',
      'Customer Support': 'customer',
      'Escalation Room': 'escalation',
      'Value Engineering': 'planning',
      'Event Explorer': 'events-explorer',
      'Simulation': 'events-explorer',
    };
    return viewMap[view] || null;
  };

  // Get Pelico View display name - handle both single value and array
  const getPelicoViewDisplayNameSafe = (view: PelicoViewPage | string | (PelicoViewPage | string)[] | undefined): string | undefined => {
    if (!view) return undefined;
    
    // Handle array - take first element
    const viewValue = Array.isArray(view) ? view[0] : view;
    if (!viewValue) return undefined;
    
    if (typeof viewValue !== 'string') return undefined;
    
    // Check if it's a valid PelicoViewPage (technical format)
    const validViews: PelicoViewPage[] = ['escalation', 'supply', 'so-book', 'customer', 'wo-book', 'missing-parts', 'line-of-balance', 'planning', 'events-explorer'];
    if (validViews.includes(viewValue as PelicoViewPage)) {
      return getPelicoViewDisplayName(viewValue as PelicoViewPage);
    }
    
    // Try to map PelicoView (display format) to PelicoViewPage
    const mappedPage = mapPelicoViewToPage(viewValue);
    if (mappedPage) {
      return getPelicoViewDisplayName(mappedPage);
    }
    
    // Return as-is if it's a string but not mappable
    return viewValue;
  };
  
  const pelicoViewName = getPelicoViewDisplayNameSafe(pelicoView);

  return (
    <div
      className={cn(
        "group relative rounded-lg transition-all border-2 px-4", // 16px horizontal padding on container
        selected
          ? "bg-[#31C7AD]/5 border-[#31C7AD]/20 hover:border-[#31C7AD]/30"
          : "bg-muted/30 border-dashed border-border/60 hover:border-[#31C7AD]/40 hover:shadow-md",
        className
      )}
    >
      {/* Badges - Top Right Corner, side by side */}
      <div className="absolute top-3 right-3 flex flex-row gap-1.5 items-center z-10">
        {/* Pelico View Badge - Always shown if present */}
        {pelicoViewName && (
          <Badge
            variant="secondary"
            className="text-xs h-5 px-2 bg-pink-500/10 text-pink-600 border-pink-500/30 shrink-0"
          >
            {pelicoViewName}
          </Badge>
        )}
        
        {/* Suggested Indicator - Icon with tooltip */}
        {isSuggested && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-5 w-5 rounded-full bg-[#31C7AD]/10 border border-[#31C7AD]/30 flex items-center justify-center shrink-0 cursor-help">
                  <Sparkles className="h-3 w-3 text-[#31C7AD]" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Suggested</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Custom Badge */}
        {isCustom && (
          <Badge
            variant="secondary"
            className="text-xs h-5 px-2 bg-blue-500/10 text-blue-600 border-blue-500/30 shrink-0"
          >
            Custom
          </Badge>
        )}
        
        {/* Selected Indicator */}
        {selected && (
          <div
            className="h-5 w-5 rounded-full bg-[#31C7AD] flex items-center justify-center cursor-pointer hover:bg-[#31C7AD]/80 transition-colors shrink-0"
            onClick={handleToggleClick}
            title="Click to remove"
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Routine Info */}
      <div className={cn(
        "space-y-2 pt-4 pb-3",
        (pelicoViewName || isSuggested || isCustom || selected) && "pr-28" // Add right padding if badges are present
      )}>
        <h5
          className={cn(
            "font-semibold text-sm leading-tight",
            selected && "text-muted-foreground"
          )}
        >
          {name}
        </h5>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-3 pt-3 border-t border-border flex gap-2 pb-4">
          {onPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviewClick}
              className="flex-1 gap-2 text-xs px-4" // 16px horizontal padding
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
          )}
          {onToggle && (
            <>
              {!selected ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleToggleClick}
                  className="flex-1 gap-2 text-xs bg-[#31C7AD] hover:bg-[#31C7AD]/90 px-4" // 16px horizontal padding
                >
                  <Plus className="h-3.5 w-3.5" />
                  {addLabel}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleToggleClick}
                  className="flex-1 gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-4" // 16px horizontal padding
                >
                  <X className="h-3.5 w-3.5" />
                  {removeLabel}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
