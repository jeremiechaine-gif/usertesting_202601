/**
 * Sidebar Routines Component
 * Displays MY ROUTINES and SHARED ROUTINES sections in the sidebar
 * Supports folders, drag and drop, reordering, and context menus
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Folder, FolderOpen, Zap, MoreVertical, ChevronRight, ChevronDown, GripVertical, Package, Wrench, Headphones, BarChart3, Upload, Settings, Users, FolderKanban, UserCircle, UsersRound, AlertTriangle, ShoppingCart, FileText, Box, TrendingUp, Search, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getRoutinesByCreator, getAccessibleRoutines, getRoutine, type Routine } from '@/lib/routines';
import { getFolders, updateFolder, deleteFolder, createFolder, type RoutineFolder } from '@/lib/folders';
import { getCurrentUserId } from '@/lib/users';
import { useRoutine } from '@/contexts/RoutineContext';
import { useToast } from '@/components/ui/toast';

interface SidebarRoutinesProps {
  activeRoutineId?: string | null;
  onRoutineClick?: (routineId: string) => void;
  activeItem?: string;
  onNavigate?: (page: string) => void;
}

interface RoutineItemProps {
  routine: Routine;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isShared?: boolean;
  onDragStart?: (e: React.DragEvent, routineId: string) => void;
  onDragEnd?: () => void;
  dragOverTarget?: string | null;
  sectionType?: 'my' | 'shared';
}

const RoutineItem: React.FC<RoutineItemProps> = ({ 
  routine, 
  isActive, 
  onClick, 
  onContextMenu, 
  isShared = false,
  onDragStart,
  onDragEnd,
  dragOverTarget,
  sectionType
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDragOver = dragOverTarget === routine.id;

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', routine.id);
    e.dataTransfer.setData('application/routine-id', routine.id);
    e.dataTransfer.setData('application/section-type', sectionType || 'my');
    onDragStart?.(e, routine.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200',
        isActive && 'bg-[#31C7AD] text-white',
        !isActive && 'hover:bg-muted/50',
        isDragging && 'opacity-50 scale-95',
        isDragOver && !isDragging && 'ring-2 ring-[#2063F0] ring-offset-1 bg-[#2063F0]/10 dark:bg-[#2063F0]/20'
      )}
      onClick={onClick}
    >
      <GripVertical className={cn('w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing', isActive ? 'text-white/70' : 'text-muted-foreground')} />
      <Zap className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground')} />
      <span className={cn('flex-1 text-sm truncate', isActive && 'text-white')}>{routine.name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0',
              isActive && 'text-white hover:bg-white/20'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isShared ? (
            <>
              <DropdownMenuItem>Unpin</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface FolderItemProps {
  folder: RoutineFolder;
  routines: Routine[];
  activeRoutineId?: string | null;
  onRoutineClick: (routineId: string) => void;
  onFolderUpdate?: () => void;
  isShared?: boolean;
  dragOverTarget?: string | null;
  draggingRoutineId?: string | null;
  draggingFolderId?: string | null;
  sectionType?: 'my' | 'shared';
  onRoutineDragStart?: (e: React.DragEvent, routineId: string) => void;
  onRoutineDragEnd?: () => void;
  onFolderDragStart?: (e: React.DragEvent, folderId: string) => void;
  onFolderDragEnd?: () => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folderId: string) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ 
  folder, 
  routines, 
  activeRoutineId, 
  onRoutineClick, 
  onFolderUpdate, 
  isShared = false,
  dragOverTarget,
  draggingRoutineId,
  draggingFolderId,
  sectionType,
  onRoutineDragStart,
  onRoutineDragEnd,
  onFolderDragStart,
  onFolderDragEnd,
  onFolderRename,
  onFolderDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  
  const folderRoutines = useMemo(() => {
    return routines.filter((r) => folder.routineIds.includes(r.id));
  }, [routines, folder.routineIds]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const routineId = e.dataTransfer.getData('application/routine-id');
    if (routineId && !folder.routineIds.includes(routineId)) {
      // Update folder to include this routine
      updateFolder(folder.id, {
        routineIds: [...folder.routineIds, routineId],
      });
      // Trigger parent re-render
      onFolderUpdate?.();
    }
  };

  const handleRenameStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
    setRenameValue(folder.name);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== folder.name) {
      onFolderRename?.(folder.id, renameValue.trim());
      updateFolder(folder.id, { name: renameValue.trim() });
      onFolderUpdate?.();
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(folder.name);
    setIsRenaming(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete folder "${folder.name}"? Routines will be moved out of the folder.`)) {
      onFolderDelete?.(folder.id);
      deleteFolder(folder.id);
      onFolderUpdate?.();
      showToast({
        description: `Folder "${folder.name}" deleted`,
        variant: 'success',
      });
    }
  };

  const handleFolderDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/folder-id', folder.id);
    e.dataTransfer.setData('application/section-type', sectionType || 'my');
    onFolderDragStart?.(e, folder.id);
  };

  const handleFolderDragEnd = () => {
    setIsDragging(false);
    onFolderDragEnd?.();
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
      <div
        draggable
        onDragStart={handleFolderDragStart}
        onDragEnd={handleFolderDragEnd}
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200",
          dragOver && 'bg-[#2063F0]/10 dark:bg-[#2063F0]/20 ring-2 ring-[#2063F0] ring-offset-1',
          !dragOver && 'hover:bg-muted/50',
          isDragging && 'opacity-50 scale-95',
          draggingFolderId === folder.id && 'opacity-50 scale-95'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <GripVertical className={cn('w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing', isDragging && 'opacity-100', 'text-muted-foreground')} />
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Folder className="w-4 h-4 text-muted-foreground" />
        )}
        {isRenaming ? (
          <Input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameSubmit();
              } else if (e.key === 'Escape') {
                handleRenameCancel();
              }
            }}
            className="h-6 text-sm font-medium flex-1"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm font-medium">{folder.name}</span>
        )}
        {!isRenaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleRenameStart}
              title="Rename folder"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive hover:text-destructive"
              onClick={handleDelete}
              title="Delete folder"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      {isExpanded && (
        <div 
          className={cn(
            'ml-6 mt-1 space-y-0.5 transition-all duration-200',
            dragOver && 'bg-muted/30 rounded-md p-1'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {folderRoutines.map((routine) => (
            <RoutineItem
              key={routine.id}
              routine={routine}
              isActive={activeRoutineId === routine.id}
              onClick={() => onRoutineClick(routine.id)}
              onContextMenu={() => {}}
              isShared={isShared}
              onDragStart={onRoutineDragStart}
              onDragEnd={onRoutineDragEnd}
              dragOverTarget={dragOverTarget}
              sectionType={sectionType}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to generate folder name from routine names
const generateFolderName = (routine1: Routine, routine2: Routine): string => {
  const names = [routine1.name, routine2.name].sort();
  const maxTotalLength = 40; // Maximum total length for the folder name
  const maxIndividualLength = 18; // Maximum length per routine name
  
  let name1 = names[0];
  let name2 = names[1];
  
  // Truncate individual names if too long
  if (name1.length > maxIndividualLength) {
    name1 = name1.substring(0, maxIndividualLength) + '...';
  }
  if (name2.length > maxIndividualLength) {
    name2 = name2.substring(0, maxIndividualLength) + '...';
  }
  
  let folderName = `${name1} & ${name2}`;
  
  // Truncate the entire folder name if still too long
  if (folderName.length > maxTotalLength) {
    const availableLength = maxTotalLength - 3; // Reserve space for "..."
    folderName = folderName.substring(0, availableLength) + '...';
  }
  
  return folderName;
};

// Helper function to get custom order from localStorage
const getCustomOrder = (sectionType: 'my' | 'shared', userId: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const key = `pelico-routine-order-${sectionType}-${userId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper function to save custom order to localStorage
const saveCustomOrder = (sectionType: 'my' | 'shared', userId: string, order: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const key = `pelico-routine-order-${sectionType}-${userId}`;
    localStorage.setItem(key, JSON.stringify(order));
  } catch (error) {
    console.error('Failed to save custom order:', error);
  }
};

export const SidebarRoutines: React.FC<SidebarRoutinesProps> = ({ activeRoutineId, onRoutineClick, activeItem, onNavigate }) => {
  const currentUserId = getCurrentUserId();
  const { refreshKey: routineRefreshKey } = useRoutine();
  const { showToast } = useToast();
  const [showAllMyRoutines, setShowAllMyRoutines] = useState(false);
  const [showAllSharedRoutines, setShowAllSharedRoutines] = useState(false);
  const [isMyRoutinesExpanded, setIsMyRoutinesExpanded] = useState(true);
  const [isSharedRoutinesExpanded, setIsSharedRoutinesExpanded] = useState(true);
  const [isPelicoViewsExpanded, setIsPelicoViewsExpanded] = useState(false);
  const [folderRefreshKey, setFolderRefreshKey] = useState(0);
  const [draggingRoutineId, setDraggingRoutineId] = useState<string | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [draggingSectionType, setDraggingSectionType] = useState<'my' | 'shared' | null>(null);

  // Auto-expand Pelico Views section when an active item belongs to it
  useEffect(() => {
    if (activeItem && pelicoViewsItems.some(item => item.id === activeItem)) {
      setIsPelicoViewsExpanded(true);
    }
  }, [activeItem]);

  // Pelico Views menu items
  const pelicoViewsItems = [
    { id: 'escalation', label: 'Escalation Room', icon: AlertTriangle },
    { id: 'supply', label: 'Purchase Order Book', icon: Package },
    { id: 'so-book', label: 'Service Order Book', icon: FileText },
    { id: 'customer', label: 'Customer Order Book', icon: Headphones },
    { id: 'wo-book', label: 'Work Order Book', icon: Wrench },
    { id: 'missing-parts', label: 'Missing Parts', icon: Box },
    { id: 'line-of-balance', label: 'Line of Balance', icon: TrendingUp },
    { id: 'planning', label: 'Planning', icon: BarChart3 },
    { id: 'events-explorer', label: 'Events Explorer', icon: Search },
  ];

  // Items to display below Pelico Views section
  const belowPelicoViewsItems = [
    { id: 'users', label: 'Teams & members', icon: Users },
    { id: 'scope-routines', label: 'Scope & Routines', icon: FolderKanban },
  ];

  // Get routines (re-fetch when routineRefreshKey changes)
  const myRoutines = useMemo(() => {
    return getRoutinesByCreator(currentUserId).sort((a, b) => a.name.localeCompare(b.name));
  }, [currentUserId, routineRefreshKey]);

  const sharedRoutines = useMemo(() => {
    const allAccessible = getAccessibleRoutines(currentUserId);
    return allAccessible
      .filter((r) => r.createdBy !== currentUserId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [currentUserId, routineRefreshKey]);

  // Get folders (re-fetch when folderRefreshKey or routineRefreshKey changes)
  const myFolders = useMemo(() => {
    const folders = getFolders(currentUserId);
    const routines = getRoutinesByCreator(currentUserId);
    const routineIds = new Set(routines.map((r) => r.id));
    
    // Clean up folders: remove deleted routines and delete empty folders
    folders.forEach((folder) => {
      const validRoutineIds = folder.routineIds.filter((id) => routineIds.has(id));
      if (validRoutineIds.length === 0) {
        deleteFolder(folder.id);
      } else if (validRoutineIds.length !== folder.routineIds.length) {
        updateFolder(folder.id, { routineIds: validRoutineIds });
      }
    });
    
    const updatedFolders = getFolders(currentUserId);
    const validFolders = updatedFolders.filter((folder) => {
      return folder.routineIds.some((id) => routineIds.has(id));
    });
    
    return validFolders.sort((a, b) => a.name.localeCompare(b.name));
  }, [currentUserId, folderRefreshKey, routineRefreshKey]);

  // Get shared folders (folders containing shared routines)
  const sharedFolders = useMemo(() => {
    const folders = getFolders(); // Get all folders
    const sharedRoutineIds = new Set(sharedRoutines.map((r) => r.id));
    
    // Filter folders that contain at least one shared routine
    return folders.filter((folder) => {
      return folder.routineIds.some((id) => sharedRoutineIds.has(id));
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [sharedRoutines, folderRefreshKey, routineRefreshKey]);

  const handleFolderUpdate = () => {
    setFolderRefreshKey((prev) => prev + 1);
  };

  // Separate routines into those in folders and those not in folders
  const routinesNotInFolders = useMemo(() => {
    const folderRoutineIds = new Set(myFolders.flatMap((f) => f.routineIds));
    return myRoutines.filter((r) => !folderRoutineIds.has(r.id));
  }, [myRoutines, myFolders]);

  const sharedRoutinesNotInFolders = useMemo(() => {
    const folderRoutineIds = new Set(sharedFolders.flatMap((f) => f.routineIds));
    return sharedRoutines.filter((r) => !folderRoutineIds.has(r.id));
  }, [sharedRoutines, sharedFolders]);

  const displayedMyRoutines = showAllMyRoutines ? routinesNotInFolders : routinesNotInFolders.slice(0, 5);
  const displayedSharedRoutines = showAllSharedRoutines ? sharedRoutinesNotInFolders : sharedRoutinesNotInFolders.slice(0, 5);

  const handleRoutineDragStart = (e: React.DragEvent, routineId: string) => {
    setDraggingRoutineId(routineId);
    const sectionType = e.dataTransfer.getData('application/section-type') as 'my' | 'shared';
    setDraggingSectionType(sectionType);
  };

  const handleRoutineDragEnd = () => {
    setDraggingRoutineId(null);
    setDragOverTarget(null);
    setDraggingSectionType(null);
  };

  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    setDraggingFolderId(folderId);
    const sectionType = e.dataTransfer.getData('application/section-type') as 'my' | 'shared';
    setDraggingSectionType(sectionType);
  };

  const handleFolderDragEnd = () => {
    setDraggingFolderId(null);
    setDragOverTarget(null);
    setDraggingSectionType(null);
  };

  const handleFolderDrop = (e: React.DragEvent, targetRoutineId: string | null, targetFolderId: string | null, sectionType: 'my' | 'shared') => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedFolderId = e.dataTransfer.getData('application/folder-id');
    const draggedSectionType = e.dataTransfer.getData('application/section-type') as 'my' | 'shared';
    
    if (!draggedFolderId || draggedFolderId === targetFolderId) {
      setDragOverTarget(null);
      return;
    }

    // Only allow moving folders within the same section
    if (draggedSectionType !== sectionType) {
      setDragOverTarget(null);
      return;
    }

    const draggedFolder = (sectionType === 'my' ? myFolders : sharedFolders).find((f) => f.id === draggedFolderId);
    if (!draggedFolder) {
      setDragOverTarget(null);
      return;
    }

    if (targetRoutineId) {
      // Dropping folder on a routine - merge folder routines with the routine
      const targetRoutine = getRoutine(targetRoutineId);
      if (!targetRoutine) {
        setDragOverTarget(null);
        return;
      }

      // Check if target routine is already in a folder
      const targetRoutineFolder = (sectionType === 'my' ? myFolders : sharedFolders).find(
        (f) => f.routineIds.includes(targetRoutineId) && f.id !== draggedFolderId
      );

      if (targetRoutineFolder) {
        // Merge dragged folder into target folder
        const allRoutineIds = [...new Set([...targetRoutineFolder.routineIds, ...draggedFolder.routineIds])];
        updateFolder(targetRoutineFolder.id, {
          routineIds: allRoutineIds,
        });
        deleteFolder(draggedFolderId);
        handleFolderUpdate();
        showToast({
          description: `Merged folder "${draggedFolder.name}" into "${targetRoutineFolder.name}"`,
          variant: 'success',
        });
      } else {
        // Remove target routine from its current folder if any
        const allFolders = sectionType === 'my' ? myFolders : sharedFolders;
        allFolders.forEach((folder) => {
          if (folder.id !== draggedFolderId && folder.routineIds.includes(targetRoutineId)) {
            updateFolder(folder.id, {
              routineIds: folder.routineIds.filter((id) => id !== targetRoutineId),
            });
          }
        });

        // Add target routine to dragged folder
        if (!draggedFolder.routineIds.includes(targetRoutineId)) {
          updateFolder(draggedFolderId, {
            routineIds: [...draggedFolder.routineIds, targetRoutineId],
          });
          handleFolderUpdate();
          showToast({
            description: `Added "${targetRoutine.name}" to folder "${draggedFolder.name}"`,
            variant: 'success',
          });
        }
      }
    } else if (targetFolderId) {
      // Dropping folder on another folder - merge folders
      const targetFolder = (sectionType === 'my' ? myFolders : sharedFolders).find((f) => f.id === targetFolderId);
      if (!targetFolder || targetFolder.id === draggedFolderId) {
        setDragOverTarget(null);
        return;
      }

      // Merge dragged folder into target folder
      const allRoutineIds = [...new Set([...targetFolder.routineIds, ...draggedFolder.routineIds])];
      updateFolder(targetFolder.id, {
        routineIds: allRoutineIds,
      });
      deleteFolder(draggedFolderId);
      handleFolderUpdate();
      showToast({
        description: `Merged folder "${draggedFolder.name}" into "${targetFolder.name}"`,
        variant: 'success',
      });
    }

    setDragOverTarget(null);
  };

  const handleRoutineDragOver = (e: React.DragEvent, targetRoutineId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingRoutineId && draggingRoutineId !== targetRoutineId) {
      setDragOverTarget(targetRoutineId);
    }
  };

  const handleRoutineDrop = (e: React.DragEvent, targetRoutineId: string, sectionType: 'my' | 'shared') => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedRoutineId = e.dataTransfer.getData('application/routine-id');
    const draggedSectionType = e.dataTransfer.getData('application/section-type') as 'my' | 'shared';
    
    if (!draggedRoutineId || draggedRoutineId === targetRoutineId) {
      setDragOverTarget(null);
      return;
    }

    // Only allow creating folders within the same section
    if (draggedSectionType !== sectionType) {
      setDragOverTarget(null);
      return;
    }

    const draggedRoutine = getRoutine(draggedRoutineId);
    const targetRoutine = getRoutine(targetRoutineId);
    
    if (!draggedRoutine || !targetRoutine) {
      setDragOverTarget(null);
      return;
    }

    // Check if target routine is already in a folder
    const targetFolder = (sectionType === 'my' ? myFolders : sharedFolders).find(
      (f) => f.routineIds.includes(targetRoutineId)
    );

    if (targetFolder) {
      // Add dragged routine to existing folder
      if (!targetFolder.routineIds.includes(draggedRoutineId)) {
        // Remove dragged routine from its current folder if any
        const draggedFolder = (sectionType === 'my' ? myFolders : sharedFolders).find(
          (f) => f.routineIds.includes(draggedRoutineId)
        );
        if (draggedFolder) {
          updateFolder(draggedFolder.id, {
            routineIds: draggedFolder.routineIds.filter((id) => id !== draggedRoutineId),
          });
        }
        
        updateFolder(targetFolder.id, {
          routineIds: [...targetFolder.routineIds, draggedRoutineId],
        });
        handleFolderUpdate();
        showToast({
          description: `Added "${draggedRoutine.name}" to folder "${targetFolder.name}"`,
          variant: 'success',
        });
      }
    } else {
      // Create new folder with both routines
      // Remove both routines from their current folders if any
      const allFolders = sectionType === 'my' ? myFolders : sharedFolders;
      allFolders.forEach((folder) => {
        if (folder.routineIds.includes(draggedRoutineId) || folder.routineIds.includes(targetRoutineId)) {
          updateFolder(folder.id, {
            routineIds: folder.routineIds.filter(
              (id) => id !== draggedRoutineId && id !== targetRoutineId
            ),
          });
        }
      });

      const folderName = generateFolderName(draggedRoutine, targetRoutine);
      const newFolder = createFolder({
        name: folderName,
        routineIds: [draggedRoutineId, targetRoutineId],
        userId: currentUserId,
        parentFolderId: null,
      });

      handleFolderUpdate();
      showToast({
        description: `Created folder "${folderName}"`,
        variant: 'success',
      });
    }

    setDragOverTarget(null);
  };

  const handleRoutineClick = (routineId: string) => {
    const routine = getRoutine(routineId);
    if (!routine) {
      console.error(`Routine with ID ${routineId} not found`);
      return;
    }

    if (!routine.pelicoView) {
      alert(`Error: Routine "${routine.name}" does not have a Pelico View associated. Please edit the routine to assign a view.`);
      return;
    }

    const isOnCorrectPage = activeItem === routine.pelicoView;
    
    if (isOnCorrectPage) {
      onRoutineClick?.(routineId);
    } else {
      sessionStorage.setItem('pendingRoutineId', routineId);
      onNavigate?.(routine.pelicoView);
    }
  };

  const handleFolderRename = (folderId: string, newName: string) => {
    updateFolder(folderId, { name: newName });
    handleFolderUpdate();
  };

  const handleFolderDelete = (folderId: string) => {
    const folder = myFolders.find((f) => f.id === folderId) || sharedFolders.find((f) => f.id === folderId);
    if (folder) {
      deleteFolder(folderId);
      handleFolderUpdate();
    }
  };

  const hasMyRoutines = myRoutines.length > 0 || myFolders.length > 0;
  const hasSharedRoutines = sharedRoutines.length > 0 || sharedFolders.length > 0;

  return (
    <div className="space-y-4 mt-2">
      {/* MY ROUTINES Section */}
      <div>
        <button
          onClick={() => setIsMyRoutinesExpanded(!isMyRoutinesExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 rounded-md transition-colors"
        >
          {isMyRoutinesExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span>MY ROUTINES</span>
        </button>
        
        {isMyRoutinesExpanded && (
          <div 
            className={cn("space-y-1", hasMyRoutines ? "mt-1" : "mt-0.5")}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const routineId = e.dataTransfer.getData('application/routine-id');
              const folderId = e.dataTransfer.getData('application/folder-id');
              const sectionType = e.dataTransfer.getData('application/section-type');
              
              if (routineId && sectionType === 'my') {
                // Remove routine from all folders when dropped outside
                myFolders.forEach((folder) => {
                  if (folder.routineIds.includes(routineId)) {
                    updateFolder(folder.id, {
                      routineIds: folder.routineIds.filter((id) => id !== routineId),
                    });
                  }
                });
                handleFolderUpdate();
              } else if (folderId && sectionType === 'my') {
                // Folder dropped outside - no action needed, just reset state
              }
              setDragOverTarget(null);
            }}
          >
            {hasMyRoutines ? (
              <>
                {/* Folders */}
                {myFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggingFolderId && draggingFolderId !== folder.id) {
                        setDragOverTarget(`folder-${folder.id}`);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget === `folder-${folder.id}`) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => handleFolderDrop(e, null, folder.id, 'my')}
                  >
                    <FolderItem
                      folder={folder}
                      routines={myRoutines}
                      activeRoutineId={activeRoutineId}
                      onRoutineClick={handleRoutineClick}
                      onFolderUpdate={handleFolderUpdate}
                      dragOverTarget={dragOverTarget === `folder-${folder.id}` ? `folder-${folder.id}` : dragOverTarget}
                      draggingRoutineId={draggingRoutineId}
                      draggingFolderId={draggingFolderId}
                      sectionType="my"
                      onRoutineDragStart={handleRoutineDragStart}
                      onRoutineDragEnd={handleRoutineDragEnd}
                      onFolderDragStart={handleFolderDragStart}
                      onFolderDragEnd={handleFolderDragEnd}
                      onFolderRename={handleFolderRename}
                      onFolderDelete={handleFolderDelete}
                    />
                  </div>
                ))}
                
                {/* Routines not in folders */}
                {displayedMyRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggingRoutineId && draggingRoutineId !== routine.id) {
                        handleRoutineDragOver(e, routine.id);
                      } else if (draggingFolderId) {
                        setDragOverTarget(routine.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget === routine.id) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => {
                      const folderId = e.dataTransfer.getData('application/folder-id');
                      if (folderId) {
                        handleFolderDrop(e, routine.id, null, 'my');
                      } else {
                        handleRoutineDrop(e, routine.id, 'my');
                      }
                    }}
                  >
                    <RoutineItem
                      routine={routine}
                      isActive={activeRoutineId === routine.id}
                      onClick={() => handleRoutineClick(routine.id)}
                      onContextMenu={() => {}}
                      onDragStart={handleRoutineDragStart}
                      onDragEnd={handleRoutineDragEnd}
                      dragOverTarget={dragOverTarget}
                      sectionType="my"
                    />
                  </div>
                ))}
                
                {routinesNotInFolders.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/5 px-2 py-1 h-auto rounded-md"
                    onClick={() => setShowAllMyRoutines(!showAllMyRoutines)}
                  >
                    {showAllMyRoutines ? 'Show less' : 'View all'}
                  </Button>
                )}
              </>
            ) : (
              <div className="px-3 py-1.5">
                <p className="text-xs text-muted-foreground/60 leading-relaxed">Create your first routine to get started</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SHARED ROUTINES Section */}
      <div>
        <button
          onClick={() => setIsSharedRoutinesExpanded(!isSharedRoutinesExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 rounded-md transition-colors"
        >
          {isSharedRoutinesExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span>SHARED ROUTINES</span>
        </button>
        
        {isSharedRoutinesExpanded && (
          <div 
            className={cn("space-y-1", hasSharedRoutines ? "mt-1" : "mt-0.5")}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const routineId = e.dataTransfer.getData('application/routine-id');
              const folderId = e.dataTransfer.getData('application/folder-id');
              const sectionType = e.dataTransfer.getData('application/section-type');
              
              if (routineId && sectionType === 'shared') {
                // Remove routine from all folders when dropped outside
                sharedFolders.forEach((folder) => {
                  if (folder.routineIds.includes(routineId)) {
                    updateFolder(folder.id, {
                      routineIds: folder.routineIds.filter((id) => id !== routineId),
                    });
                  }
                });
                handleFolderUpdate();
              } else if (folderId && sectionType === 'shared') {
                // Folder dropped outside - no action needed, just reset state
              }
              setDragOverTarget(null);
            }}
          >
            {hasSharedRoutines ? (
              <>
                {/* Folders */}
                {sharedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggingFolderId && draggingFolderId !== folder.id) {
                        setDragOverTarget(`folder-${folder.id}`);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget === `folder-${folder.id}`) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => handleFolderDrop(e, null, folder.id, 'shared')}
                  >
                    <FolderItem
                      folder={folder}
                      routines={sharedRoutines}
                      activeRoutineId={activeRoutineId}
                      onRoutineClick={handleRoutineClick}
                      onFolderUpdate={handleFolderUpdate}
                      isShared={true}
                      dragOverTarget={dragOverTarget === `folder-${folder.id}` ? `folder-${folder.id}` : dragOverTarget}
                      draggingRoutineId={draggingRoutineId}
                      draggingFolderId={draggingFolderId}
                      sectionType="shared"
                      onRoutineDragStart={handleRoutineDragStart}
                      onRoutineDragEnd={handleRoutineDragEnd}
                      onFolderDragStart={handleFolderDragStart}
                      onFolderDragEnd={handleFolderDragEnd}
                      onFolderRename={handleFolderRename}
                      onFolderDelete={handleFolderDelete}
                    />
                  </div>
                ))}
                
                {/* Routines not in folders */}
                {displayedSharedRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggingRoutineId && draggingRoutineId !== routine.id) {
                        handleRoutineDragOver(e, routine.id);
                      } else if (draggingFolderId) {
                        setDragOverTarget(routine.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget === routine.id) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => {
                      const folderId = e.dataTransfer.getData('application/folder-id');
                      if (folderId) {
                        handleFolderDrop(e, routine.id, null, 'shared');
                      } else {
                        handleRoutineDrop(e, routine.id, 'shared');
                      }
                    }}
                  >
                    <RoutineItem
                      routine={routine}
                      isActive={activeRoutineId === routine.id}
                      onClick={() => handleRoutineClick(routine.id)}
                      onContextMenu={() => {}}
                      isShared={true}
                      onDragStart={handleRoutineDragStart}
                      onDragEnd={handleRoutineDragEnd}
                      dragOverTarget={dragOverTarget}
                      sectionType="shared"
                    />
                  </div>
                ))}
                
                {sharedRoutinesNotInFolders.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/5 px-2 py-1 h-auto rounded-md"
                    onClick={() => setShowAllSharedRoutines(!showAllSharedRoutines)}
                  >
                    {showAllSharedRoutines ? 'Show less' : 'View all'}
                  </Button>
                )}
              </>
            ) : (
              <div className="px-3 py-1.5">
                <p className="text-xs text-muted-foreground/60 leading-relaxed">Routines shared with you will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PELICO VIEWS Section */}
      <div>
        <button
          onClick={() => setIsPelicoViewsExpanded(!isPelicoViewsExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 rounded-md transition-colors"
        >
          {isPelicoViewsExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span>PELICO VIEWS</span>
        </button>
        
        {isPelicoViewsExpanded && (
          <div className={cn("space-y-1 ml-8", "mt-0.5")}>
            {pelicoViewsItems.map((item) => {
              const isActive = activeItem === item.id;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                    isActive && 'bg-[#31C7AD] text-white',
                    !isActive && 'hover:bg-muted/50'
                  )}
                  onClick={() => {
                    setIsPelicoViewsExpanded(true);
                    onNavigate?.(item.id);
                  }}
                >
                  <span className={cn('flex-1 text-sm truncate', isActive && 'text-white')}>{item.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Items below Pelico Views */}
      <div className="space-y-1 mt-2">
        {belowPelicoViewsItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 h-auto py-1.5 px-3 text-sm rounded-md',
                isActive && 'bg-[#31C7AD] text-white hover:bg-[#2ab89a]'
              )}
              onClick={() => onNavigate?.(item.id)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
