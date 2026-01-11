/**
 * Routine Chip Component
 * Reusable component for displaying routine cards/chips with consistent styling
 * Used across the application for routine selection and display
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, Eye, Plus, X, Check, Share2, Users, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPelicoViewDisplayName } from '@/lib/routines';
import type { PelicoViewPage } from '@/lib/routines';

export interface SharedTeam {
  id: string;
  name: string;
}

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
  /** Whether routine is from library (vs custom/user-created) */
  isFromLibrary?: boolean;
  /** Callback when preview button is clicked */
  onPreview?: () => void;
  /** Callback when add/remove button is clicked */
  onToggle?: () => void;
  /** Callback when remove button is clicked (for library routines - removes from view only) */
  onRemove?: () => void;
  /** Callback when delete button is clicked (for custom routines - deletes permanently) */
  onDelete?: () => void;
  /** Callback when share button is clicked (for Scope & Routines page) */
  onShare?: () => void;
  /** Whether to show share button and sharing info (for Scope & Routines page) */
  showShare?: boolean;
  /** Whether user is owner of the routine (for Scope & Routines page) */
  isOwner?: boolean;
  /** Whether routine is shared */
  isShared?: boolean;
  /** List of teams the routine is shared with */
  sharedTeams?: SharedTeam[];
  /** List of all available teams for sharing */
  availableTeams?: SharedTeam[];
  /** Callback when toggling share with a team */
  onToggleShare?: (teamId: string) => void;
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
  isFromLibrary = false,
  onPreview,
  onToggle,
  onRemove,
  onDelete,
  onShare,
  showShare = false,
  isOwner = false,
  isShared = false,
  sharedTeams = [],
  availableTeams = [],
  onToggleShare,
  className,
  showActions = true,
  removeLabel = 'Remove',
  addLabel = 'Add',
}) => {
  const [sharePopoverOpen, setSharePopoverOpen] = React.useState(false);
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
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
        "group relative rounded-lg transition-all border-2 px-4 w-full min-w-0 flex flex-col", // 16px horizontal padding on container, ensure full width and prevent overflow
        selected
          ? "bg-[#31C7AD]/5 border-[#31C7AD]/20 hover:border-[#31C7AD]/30"
          : "bg-muted/30 border-dashed border-border/60 hover:border-[#31C7AD]/40 hover:shadow-md",
        className
      )}
    >
      {/* Top section - Icons and badges row */}
      <div className="flex items-center justify-between gap-2 pt-3 pb-2 min-w-0">
        {/* Left side - Icons (Suggested, Selected) */}
        <div className="flex flex-row gap-1.5 items-center shrink-0">
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
        
        {/* Right side - Pelico View Badge */}
        {pelicoViewName && (
          <Badge
            variant="secondary"
            className="text-xs h-5 px-2 bg-pink-500/10 text-pink-600 border-pink-500/30 shrink-0 whitespace-nowrap"
          >
            {pelicoViewName}
          </Badge>
        )}
        
        {/* Custom Badge */}
        {isCustom && (
          <Badge
            variant="secondary"
            className="text-xs h-5 px-2 bg-blue-500/10 text-blue-600 border-blue-500/30 shrink-0 whitespace-nowrap"
          >
            Custom
          </Badge>
        )}
      </div>

      {/* Title */}
      <div className="min-w-0 overflow-hidden pb-2">
        <h5
          className={cn(
            "font-semibold text-sm leading-snug break-words line-clamp-2",
            selected && "text-muted-foreground"
          )}
        >
          {name || 'Unnamed Routine'}
        </h5>
      </div>

      {/* Description */}
      <div className="min-w-0 overflow-hidden pb-3">
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 break-words">
            {description}
          </p>
        )}
      </div>

      {/* Sharing Section - Only for Scope & Routines page */}
      {showShare && isOwner && (
        <div className="mt-2 pt-2 border-t border-border/30 min-w-0 overflow-hidden">
          {isShared && sharedTeams.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-xs text-muted-foreground">Shared with:</span>
              {sharedTeams.map((team) => (
                <Badge
                  key={team.id}
                  variant="secondary"
                  className="text-xs h-4 px-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1 group/badge"
                >
                  <Users className="h-3 w-3" />
                  {team.name}
                  {onToggleShare && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleShare(team.id);
                      }}
                      className="ml-1 opacity-0 group-hover/badge:opacity-100 transition-opacity hover:text-destructive"
                      title="Remove sharing"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {onToggleShare && availableTeams.filter(team => !sharedTeams.some(st => st.id === team.id)).length > 0 && (
                <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 px-1.5 text-xs gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                      {availableTeams.filter(team => !sharedTeams.some(st => st.id === team.id)).map((team) => (
                        <button
                          key={team.id}
                          onClick={() => {
                            onToggleShare(team.id);
                            setSharePopoverOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted text-sm transition-colors flex items-center gap-2"
                        >
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{team.name}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          ) : (
            onToggleShare && availableTeams.length > 0 && (
              <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1.5 w-full justify-start"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share with team
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-1">
                    {availableTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => {
                          onToggleShare(team.id);
                          setSharePopoverOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted text-sm transition-colors flex items-center gap-2"
                      >
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{team.name}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className={cn("mt-3 pt-3 border-t border-border flex gap-2 pb-4 min-w-0", showShare && isOwner && "mt-2 pt-2")}>
          {/* Preview button */}
          {onPreview && (
            <Button
              variant="secondary"
              size="icon"
              onClick={handlePreviewClick}
              className="h-8 w-8"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {/* Share button */}
          {showShare && onShare && (
            <Button
              variant="secondary"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="h-8 w-8"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          {/* Remove button for library routines (owner only) */}
          {onRemove && isOwner && (
            <Button
              variant="destructive"
              size="icon"
              onClick={handleRemoveClick}
              className="h-8 w-8"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {/* Delete button for custom routines (owner only) */}
          {onDelete && isOwner && (
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDeleteClick}
              className="h-8 w-8"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {/* Toggle button (for other use cases) */}
          {onToggle && !onRemove && !onDelete && (
            <>
              {!selected ? (
                <Button
                  variant="accent"
                  size="icon"
                  onClick={handleToggleClick}
                  className="h-8 w-8"
                  title={addLabel}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleToggleClick}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title={removeLabel}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
