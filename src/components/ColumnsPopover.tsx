/**
 * Columns Popover Component
 * Manages column visibility and provides navigation to columns
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Target, Columns as ColumnsIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnDef, Table } from '@tanstack/react-table';

interface ColumnsPopoverProps {
  table: Table<any>;
  columns: ColumnDef<any>[];
  highlightedColumnId: string | null;
  onHighlightChange: (columnId: string | null) => void;
}

export const ColumnsPopover: React.FC<ColumnsPopoverProps> = ({ 
  table, 
  columns,
  highlightedColumnId,
  onHighlightChange,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Get all columns (flattened, including nested)
  const allColumns = useMemo(() => {
    const flattenColumns = (cols: ColumnDef<any>[]): ColumnDef<any>[] => {
      const result: ColumnDef<any>[] = [];
      for (const col of cols) {
        if ('columns' in col && Array.isArray(col.columns)) {
          // This is a group header
          result.push(col);
          result.push(...flattenColumns(col.columns));
        } else if (col.id && col.id !== 'select') {
          // This is a regular column (exclude select checkbox)
          result.push(col);
        }
      }
      return result;
    };
    return flattenColumns(columns);
  }, [columns]);

  // Get visible columns
  const visibleColumns = table.getVisibleLeafColumns();

  // Group columns by parent
  const groupedColumns = useMemo(() => {
    const groups: Record<string, { header: string; columns: ColumnDef<any>[] }> = {};
    
    const processColumns = (cols: ColumnDef<any>[], parentHeader?: string) => {
      for (const col of cols) {
        if ('columns' in col && Array.isArray(col.columns)) {
          // This is a group
          const groupHeader = typeof col.header === 'string' ? col.header : col.id || 'Ungrouped';
          groups[groupHeader] = {
            header: groupHeader,
            columns: col.columns.filter((c) => c.id && c.id !== 'select'),
          };
          processColumns(col.columns, groupHeader);
        } else if (col.id && col.id !== 'select' && !parentHeader) {
          // Ungrouped column
          if (!groups['Ungrouped']) {
            groups['Ungrouped'] = { header: 'Ungrouped', columns: [] };
          }
          groups['Ungrouped'].columns.push(col);
        }
      }
    };
    
    processColumns(columns);
    return groups;
  }, [columns]);

  // Filter columns based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedColumns;
    }

    const searchLower = searchQuery.toLowerCase();
    const filtered: typeof groupedColumns = {};

    Object.entries(groupedColumns).forEach(([groupName, group]) => {
      const matchingColumns = group.columns.filter((col) => {
        const header = typeof col.header === 'string' ? col.header : col.id || '';
        return header.toLowerCase().includes(searchLower);
      });

      if (matchingColumns.length > 0) {
        filtered[groupName] = {
          header: groupName,
          columns: matchingColumns,
        };
      }
    });

    return filtered;
  }, [groupedColumns, searchQuery]);

  // Get expanded groups (open groups that have matching columns in search)
  const expandedGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.keys(groupedColumns);
    }
    return Object.keys(filteredGroups);
  }, [searchQuery, filteredGroups, groupedColumns]);

  // Count visible/hidden columns
  const columnCounts = useMemo(() => {
    const total = allColumns.length;
    const visible = visibleColumns.filter((col) => col.id !== 'select').length;
    const hidden = total - visible;
    return { total, visible, hidden };
  }, [allColumns, visibleColumns]);

  // Show all columns
  const showAllColumns = useCallback(() => {
    table.getVisibleLeafColumns().forEach((col) => {
      if (col.id && col.id !== 'select') {
        col.toggleVisibility(true);
      }
    });
    // Also show columns that might be hidden
    allColumns.forEach((col) => {
      if (col.id && col.id !== 'select') {
        const column = table.getColumn(col.id);
        if (column) {
          column.toggleVisibility(true);
        }
      }
    });
  }, [table, allColumns]);

  // Hide all columns (except select)
  const hideAllColumns = useCallback(() => {
    allColumns.forEach((col) => {
      if (col.id && col.id !== 'select') {
        const column = table.getColumn(col.id);
        if (column) {
          column.toggleVisibility(false);
        }
      }
    });
  }, [table, allColumns]);

  // Check if all columns are visible
  const allColumnsVisible = useMemo(() => {
    return columnCounts.visible === columnCounts.total;
  }, [columnCounts]);

  // Toggle all columns visibility
  const toggleAllColumns = useCallback((checked: boolean) => {
    if (checked) {
      showAllColumns();
    } else {
      hideAllColumns();
    }
  }, [showAllColumns, hideAllColumns]);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId);
      if (column) {
        column.toggleVisibility();
      }
    },
    [table]
  );

  // Helper function to scroll and highlight (defined first)
  const scrollToElementInContainer = useCallback((headerElement: HTMLElement, columnId: string) => {

    // Get the table container (the scrollable div)
    let tableContainer = headerElement.closest('.overflow-auto') as HTMLElement;
    
    // If not found, try to find scrollable parent
    if (!tableContainer) {
      let parent = headerElement.parentElement;
      while (parent && parent !== document.body) {
        if (parent.scrollWidth > parent.clientWidth || parent.classList.contains('overflow-auto')) {
          tableContainer = parent as HTMLElement;
          break;
        }
        parent = parent.parentElement;
      }
    }

    if (!tableContainer) return;

    // Calculate scroll position to center the column
    const containerRect = tableContainer.getBoundingClientRect();
    const headerRect = headerElement.getBoundingClientRect();
    const scrollLeft = tableContainer.scrollLeft;
    const headerLeft = headerRect.left - containerRect.left + scrollLeft;
    const headerWidth = headerRect.width;
    const containerWidth = containerRect.width;

    // Calculate target scroll position (center if possible)
    const targetScrollLeft = headerLeft - containerWidth / 2 + headerWidth / 2;
    const maxScrollLeft = tableContainer.scrollWidth - containerWidth;
    const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));
    
    // Smooth scroll
    tableContainer.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth',
    });

    // Highlight the column
    onHighlightChange(columnId);
    
    // Clear previous timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    // Remove highlight when clicking elsewhere
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!headerElement.contains(target) && !target.closest(`[data-column-id="${columnId}"]`)) {
        onHighlightChange(null);
        document.removeEventListener('click', handleClickOutside);
      }
    };

    // Wait a bit before adding listener to avoid immediate removal
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, { once: true });
    }, 100);
  }, [onHighlightChange]);

  // Find column element and scroll to it
  const scrollToColumnElement = useCallback((columnId: string) => {
    // Find the column header element (use th selector specifically)
    const headerElement = document.querySelector(`th[data-column-id="${columnId}"]`) as HTMLElement;
    if (!headerElement) {
      // Retry after a short delay in case DOM hasn't updated
      setTimeout(() => {
        const retryElement = document.querySelector(`th[data-column-id="${columnId}"]`) as HTMLElement;
        if (retryElement) {
          scrollToElementInContainer(retryElement, columnId);
        }
      }, 150);
      return;
    }
    scrollToElementInContainer(headerElement, columnId);
  }, [scrollToElementInContainer]);

  // Scroll to column and highlight it
  const scrollToColumn = useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId);
      if (!column) return;

      const isVisible = column.getIsVisible();
      if (!isVisible) {
        // Show the column first
        column.toggleVisibility(true);
        // Wait for DOM update
        setTimeout(() => {
          scrollToColumnElement(columnId);
        }, 150);
      } else {
        scrollToColumnElement(columnId);
      }
    },
    [table, scrollToColumnElement]
  );

  // Add data attributes to column headers for targeting
  useEffect(() => {
    if (!open) return;

    const addDataAttributes = () => {
      const headers = document.querySelectorAll('th');
      headers.forEach((header) => {
        const columnId = header.getAttribute('data-column-id');
        if (!columnId) {
          // Try to find column ID from header content or other attributes
          const headerText = header.textContent?.trim();
          // This is a fallback - ideally we'd have the column ID already
        }
      });
    };

    // Wait for table to render
    setTimeout(addDataAttributes, 100);
  }, [open, table.getVisibleLeafColumns()]);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2 h-auto px-3 py-1.5 hover:bg-accent hover:border-[#31C7AD]/30 transition-all">
          <ColumnsIcon className="w-4 h-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={0}
        alignOffset={0}
        className="w-[380px] !fixed p-0 flex flex-col"
        style={{
          position: 'fixed',
          right: '16px',
          top: '16px',
          bottom: '16px',
          left: 'auto',
          height: 'calc(100vh - 32px)',
          transform: 'none', // Override Radix transform
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Columns</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search columns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>

          {/* Columns List */}
          <ScrollArea className="flex-1 min-h-0" ref={scrollContainerRef}>
            <div className="p-2">
              {/* Display all column checkbox - first item */}
              <div className="mb-3 pb-3 border-b">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id="display-all-columns"
                    checked={allColumnsVisible}
                    onCheckedChange={toggleAllColumns}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="display-all-columns"
                    className="flex-1 text-sm font-medium cursor-pointer select-none"
                  >
                    Display all column
                  </label>
                </div>
              </div>

              <Accordion type="multiple" defaultValue={expandedGroups} className="w-full">
                {Object.entries(filteredGroups).map(([groupName, group]) => (
                  <AccordionItem key={groupName} value={groupName} className="border-none">
                    <AccordionTrigger className="py-2 px-2 hover:no-underline text-xs font-medium text-muted-foreground">
                      {groupName}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-2">
                      <div className="space-y-1">
                        {group.columns.map((col) => {
                          const columnId = col.id!;
                          const column = table.getColumn(columnId);
                          const isVisible = column?.getIsVisible() ?? false;
                          const header = typeof col.header === 'string' ? col.header : columnId;
                          const isHighlighted = highlightedColumnId === columnId;

                          return (
                            <div
                              key={columnId}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group',
                                isHighlighted && 'bg-[#31C7AD]/10 border border-[#31C7AD]/30'
                              )}
                            >
                              {/* Target icon - only for visible columns */}
                              {isVisible ? (
                                <button
                                  onClick={() => scrollToColumn(columnId)}
                                  className="p-1 rounded hover:bg-[#31C7AD]/10 text-[#31C7AD] opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Scroll to column"
                                >
                                  <Target className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <div className="w-[22px]" /> // Spacer to align with Target icon
                              )}

                              {/* Checkbox */}
                              <Checkbox
                                id={`col-${columnId}`}
                                checked={isVisible}
                                onCheckedChange={() => toggleColumnVisibility(columnId)}
                                className="h-4 w-4"
                              />

                              {/* Column name */}
                              <label
                                htmlFor={`col-${columnId}`}
                                className="flex-1 text-sm cursor-pointer select-none"
                              >
                                {header}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {Object.keys(filteredGroups).length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No columns found matching "{searchQuery}"
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {columnCounts.visible} of {columnCounts.total} columns visible
              </span>
              {columnCounts.hidden > 0 && (
                <span className="text-[#31C7AD] font-medium">
                  {columnCounts.hidden} hidden
                </span>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

