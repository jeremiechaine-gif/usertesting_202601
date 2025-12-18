/**
 * Column Header Component with hover indicators and context menu
 */

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Filter,
  Pin,
  Columns,
  Download,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Header } from '@tanstack/react-table';

interface ColumnHeaderProps {
  header: Header<any, unknown>; // Keep for future use
  columnId: string;
  sorting: Array<{ id: string; desc: boolean }>;
  columnFilters: Array<{ id: string; value: unknown }>;
  onSortingChange: (updater: any) => void;
  onColumnFiltersChange: (updater: any) => void;
  onFilterClick?: (columnId: string) => void;
  children: React.ReactNode;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  header: _header, // Prefix with _ to indicate intentionally unused
  columnId,
  sorting,
  columnFilters,
  onSortingChange,
  onColumnFiltersChange,
  onFilterClick,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if column is sorted
  const sortInfo = sorting.find((s) => s.id === columnId);
  const isSorted = !!sortInfo;
  const sortDirection = sortInfo?.desc ? 'desc' : 'asc';
  const sortIndex = sortInfo ? sorting.findIndex((s) => s.id === columnId) + 1 : 0;

  // Check if column has filter
  const filterInfo = columnFilters.find((f) => f.id === columnId);
  const hasFilter = !!filterInfo;

  // Handle sort ascending
  const handleSortAscending = () => {
    const newSorting = sorting.filter((s) => s.id !== columnId);
    newSorting.push({ id: columnId, desc: false });
    onSortingChange(newSorting);
    setMenuOpen(false);
  };

  // Handle sort descending
  const handleSortDescending = () => {
    const newSorting = sorting.filter((s) => s.id !== columnId);
    newSorting.push({ id: columnId, desc: true });
    onSortingChange(newSorting);
    setMenuOpen(false);
  };

  // Handle clear filter
  const handleClearFilter = () => {
    const newFilters = columnFilters.filter((f) => f.id !== columnId);
    onColumnFiltersChange(newFilters);
    setMenuOpen(false);
  };

  // Handle filter click
  const handleFilterClick = () => {
    if (onFilterClick) {
      onFilterClick(columnId);
    }
    setMenuOpen(false);
  };

  // Handle pin column (placeholder)
  const handlePinColumn = () => {
    // TODO: Implement pin column functionality
    setMenuOpen(false);
  };

  // Handle autosize column (placeholder)
  const handleAutosizeColumn = () => {
    // TODO: Implement autosize functionality
    setMenuOpen(false);
  };

  // Handle choose columns (placeholder)
  const handleChooseColumns = () => {
    // TODO: Implement choose columns functionality
    setMenuOpen(false);
  };

  // Handle hide column (placeholder)
  const handleHideColumn = () => {
    // TODO: Implement hide column functionality
    setMenuOpen(false);
  };

  // Handle reset columns (placeholder)
  const handleResetColumns = () => {
    // TODO: Implement reset columns functionality
    setMenuOpen(false);
  };

  // Handle set as default tenant settings (placeholder)
  const handleSetAsDefault = () => {
    // TODO: Implement set as default functionality
    setMenuOpen(false);
  };

  // Handle reset to product default (placeholder)
  const handleResetToDefault = () => {
    // TODO: Implement reset to product default functionality
    setMenuOpen(false);
  };

  // Handle header click for sorting
  const handleHeaderClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the menu button or any interactive element
    const target = e.target as HTMLElement;
    if (
      target.closest('[role="button"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[data-radix-dropdown-menu-trigger]') ||
      target.closest('[data-radix-dropdown-menu-content]') ||
      target.closest('[data-radix-dialog-content]') ||
      target.closest('[data-radix-dialog-overlay]')
    ) {
      return;
    }
    
    // Don't trigger if event came from a modal or dropdown
    if (target.closest('[data-state]')) {
      return;
    }
    
    // Toggle sorting: none -> asc -> desc -> none
    if (isSorted) {
      if (sortDirection === 'asc') {
        // Switch to desc
        handleSortDescending();
      } else {
        // Remove sort
        const newSorting = sorting.filter((s) => s.id !== columnId);
        onSortingChange(newSorting);
      }
    } else {
      // Add asc sort
      handleSortAscending();
    }
  };

  // Track if filter modal is open to prevent header clicks
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  useEffect(() => {
    // Check if filter modal is open by looking for dialog overlay
    const checkModal = () => {
      const dialog = document.querySelector('[data-radix-dialog-overlay]');
      setFilterModalOpen(!!dialog);
    };
    
    // Check periodically and on mutations
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true, subtree: true });
    checkModal();
    
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="flex items-center h-full relative group pr-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        // Don't hide hover state if menu is open - keep icon visible
        if (!menuOpen) {
          setIsHovered(false);
        }
      }}
      onClick={(e) => {
        // Don't trigger header click if filter modal is open
        if (filterModalOpen) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        handleHeaderClick(e);
      }}
    >
      <div className="flex-1 min-w-0 truncate cursor-pointer select-none">{children}</div>

      {/* Indicators - absolutely positioned to not affect column width */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 shrink-0 pointer-events-none">
        {/* Sort indicator - badge with position and arrow */}
        {isSorted && (
          <div className="flex flex-col items-center pointer-events-auto gap-0.5 px-1 py-0.5 rounded" style={{ backgroundColor: '#ADE9DE' }}>
            <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">{sortIndex}</span>
            </div>
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5 text-gray-700" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-gray-700" />
            )}
          </div>
        )}

        {/* Filter indicator / Menu trigger - show icon on hover or when menu is open, menu opens on click */}
        {(isHovered || hasFilter || menuOpen) && (
            <DropdownMenu 
              open={menuOpen} 
              onOpenChange={(open) => {
                setMenuOpen(open);
                // Reset hover state when menu closes
                if (!open) {
                  setIsHovered(false);
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6 p-0 relative pointer-events-auto',
                    hasFilter && 'bg-[#ADE9DE] rounded'
                  )}
                  onClick={(e) => {
                    // Stop propagation to prevent header click from triggering sort
                    e.stopPropagation();
                    // Don't preventDefault - let DropdownMenu handle the click
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  {hasFilter && (
                    <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-red-500 rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Filter section */}
                <DropdownMenuItem onClick={handleFilterClick} className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                  {hasFilter && (
                    <span className="ml-auto h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </DropdownMenuItem>
                {hasFilter && (
                  <DropdownMenuItem
                    onClick={handleClearFilter}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear filter</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Sort section */}
                <DropdownMenuItem onClick={handleSortAscending} className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  <span>Sort ascending</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSortDescending} className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  <span>Sort descending</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Column management - individual */}
                <DropdownMenuItem onClick={handlePinColumn} className="flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  <span>Pin column</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAutosizeColumn}>
                  <span>Autosize this column</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Column management - general */}
                <DropdownMenuItem onClick={handleChooseColumns} className="flex items-center gap-2">
                  <Columns className="h-4 w-4" />
                  <span>Choose columns</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleHideColumn}>
                  <span>Hide this column</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleResetColumns}>
                  <span>Reset columns</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Default settings */}
                <DropdownMenuItem onClick={handleSetAsDefault} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Set as default tenant setti...</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleResetToDefault}>
                  <span>Reset to product default</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </div>
  );
};

