/**
 * Sidebar Routines Component
 * Displays MY ROUTINES and SHARED ROUTINES sections in the sidebar
 * Supports folders, drag and drop, and context menus
 */

import React, { useState, useMemo } from 'react';
import { Folder, Zap, MoreVertical, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getRoutinesByCreator, getAccessibleRoutines, type Routine } from '@/lib/routines';
import { getFolders, updateFolder, type RoutineFolder } from '@/lib/folders';
import { getCurrentUserId } from '@/lib/users';

interface SidebarRoutinesProps {
  activeRoutineId?: string | null;
  onRoutineClick?: (routineId: string) => void;
}

interface RoutineItemProps {
  routine: Routine;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isShared?: boolean;
}

const RoutineItem: React.FC<RoutineItemProps> = ({ routine, isActive, onClick, onContextMenu, isShared = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', routine.id);
    e.dataTransfer.setData('application/routine-id', routine.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
        isActive && 'bg-[#31C7AD] text-white',
        !isActive && 'hover:bg-muted/50',
        isDragging && 'opacity-50'
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
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, routines, activeRoutineId, onRoutineClick, onFolderUpdate, isShared = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  
  const folderRoutines = useMemo(() => {
    return routines.filter((r) => folder.routineIds.includes(r.id));
  }, [routines, folder.routineIds]);

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

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <Folder className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium">{folder.name}</span>
      </div>
      {isExpanded && (
        <div 
          className={cn('ml-6 mt-1 space-y-0.5', dragOver && 'bg-muted/30 rounded-md p-1')}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SidebarRoutines: React.FC<SidebarRoutinesProps> = ({ activeRoutineId, onRoutineClick }) => {
  const currentUserId = getCurrentUserId();
  const [showAllMyRoutines, setShowAllMyRoutines] = useState(false);
  const [showAllSharedRoutines, setShowAllSharedRoutines] = useState(false);
  const [isMyRoutinesExpanded, setIsMyRoutinesExpanded] = useState(true);
  const [isSharedRoutinesExpanded, setIsSharedRoutinesExpanded] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render after folder updates

  // Get routines
  const myRoutines = useMemo(() => {
    return getRoutinesByCreator(currentUserId).sort((a, b) => a.name.localeCompare(b.name));
  }, [currentUserId]);

  const sharedRoutines = useMemo(() => {
    const allAccessible = getAccessibleRoutines(currentUserId);
    return allAccessible
      .filter((r) => r.createdBy !== currentUserId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [currentUserId]);

  // Get folders (re-fetch when refreshKey changes)
  const myFolders = useMemo(() => {
    return getFolders(currentUserId).sort((a, b) => a.name.localeCompare(b.name));
  }, [currentUserId, refreshKey]);

  const handleFolderUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Separate routines into those in folders and those not in folders
  const routinesNotInFolders = useMemo(() => {
    const folderRoutineIds = new Set(myFolders.flatMap((f) => f.routineIds));
    return myRoutines.filter((r) => !folderRoutineIds.has(r.id));
  }, [myRoutines, myFolders]);

  const displayedMyRoutines = showAllMyRoutines ? routinesNotInFolders : routinesNotInFolders.slice(0, 5);
  const displayedSharedRoutines = showAllSharedRoutines ? sharedRoutines : sharedRoutines.slice(0, 5);

  const handleRoutineClick = (routineId: string) => {
    onRoutineClick?.(routineId);
  };

  const hasMyRoutines = myRoutines.length > 0 || myFolders.length > 0;
  const hasSharedRoutines = sharedRoutines.length > 0;

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
            className="space-y-1 mt-1"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const routineId = e.dataTransfer.getData('application/routine-id');
              if (routineId) {
                // Remove routine from all folders when dropped outside
                myFolders.forEach((folder) => {
                  if (folder.routineIds.includes(routineId)) {
                    updateFolder(folder.id, {
                      routineIds: folder.routineIds.filter((id) => id !== routineId),
                    });
                  }
                });
                // Trigger re-render
                handleFolderUpdate();
              }
            }}
          >
            {hasMyRoutines ? (
              <>
                {/* Folders */}
                {myFolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    routines={myRoutines}
                    activeRoutineId={activeRoutineId}
                    onRoutineClick={handleRoutineClick}
                    onFolderUpdate={handleFolderUpdate}
                  />
                ))}
                
                {/* Routines not in folders */}
                {displayedMyRoutines.map((routine) => (
                  <RoutineItem
                    key={routine.id}
                    routine={routine}
                    isActive={activeRoutineId === routine.id}
                    onClick={() => handleRoutineClick(routine.id)}
                    onContextMenu={() => {}}
                  />
                ))}
                
                {routinesNotInFolders.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/5 px-2 py-1 h-auto"
                    onClick={() => setShowAllMyRoutines(!showAllMyRoutines)}
                  >
                    {showAllMyRoutines ? 'Show less' : 'View all'}
                  </Button>
                )}
              </>
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground/70">Create your first routine to get started</p>
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
          <div className="space-y-1 mt-1">
            {hasSharedRoutines ? (
              <>
                {displayedSharedRoutines.map((routine) => (
                  <RoutineItem
                    key={routine.id}
                    routine={routine}
                    isActive={activeRoutineId === routine.id}
                    onClick={() => handleRoutineClick(routine.id)}
                    onContextMenu={() => {}}
                    isShared={true}
                  />
                ))}
                
                {sharedRoutines.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-[#2063F0] hover:text-[#1a54d8] hover:bg-[#2063F0]/5 px-2 py-1 h-auto"
                    onClick={() => setShowAllSharedRoutines(!showAllSharedRoutines)}
                  >
                    {showAllSharedRoutines ? 'Show less' : 'View all'}
                  </Button>
                )}
              </>
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground/70">Routines shared with you will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

