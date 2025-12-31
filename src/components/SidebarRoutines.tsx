/**
 * Sidebar Routines Component
 * Displays MY ROUTINES and SHARED ROUTINES sections in the sidebar
 * Supports folders, drag and drop, and context menus
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Folder, Zap, MoreVertical, ChevronRight, ChevronDown, GripVertical, Package, Wrench, Headphones, BarChart3, Upload, Settings, Users, FolderKanban, UserCircle, UsersRound, AlertTriangle, ShoppingCart, FileText, Box, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getRoutinesByCreator, getAccessibleRoutines, getRoutine, type Routine } from '@/lib/routines';
import { getFolders, updateFolder, deleteFolder, type RoutineFolder } from '@/lib/folders';
import { getCurrentUserId } from '@/lib/users';
import { useRoutine } from '@/contexts/RoutineContext';

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

export const SidebarRoutines: React.FC<SidebarRoutinesProps> = ({ activeRoutineId, onRoutineClick, activeItem, onNavigate }) => {
  const currentUserId = getCurrentUserId();
  const { refreshKey: routineRefreshKey } = useRoutine(); // Get refresh key from context
  const [showAllMyRoutines, setShowAllMyRoutines] = useState(false);
  const [showAllSharedRoutines, setShowAllSharedRoutines] = useState(false);
  const [isMyRoutinesExpanded, setIsMyRoutinesExpanded] = useState(true);
  const [isSharedRoutinesExpanded, setIsSharedRoutinesExpanded] = useState(true);
  const [isPelicoViewsExpanded, setIsPelicoViewsExpanded] = useState(false);
  const [folderRefreshKey, setFolderRefreshKey] = useState(0); // Force re-render after folder updates

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
        // Folder is empty, delete it
        deleteFolder(folder.id);
      } else if (validRoutineIds.length !== folder.routineIds.length) {
        // Some routines were deleted, update folder
        updateFolder(folder.id, { routineIds: validRoutineIds });
      }
    });
    
    // Re-fetch folders after cleanup
    const updatedFolders = getFolders(currentUserId);
    // Filter out folders that have no routines (shouldn't happen after cleanup, but just in case)
    const validFolders = updatedFolders.filter((folder) => {
      return folder.routineIds.some((id) => routineIds.has(id));
    });
    
    return validFolders.sort((a, b) => a.name.localeCompare(b.name));
  }, [currentUserId, folderRefreshKey, routineRefreshKey]);

  const handleFolderUpdate = () => {
    setFolderRefreshKey((prev) => prev + 1);
  };

  // Separate routines into those in folders and those not in folders
  const routinesNotInFolders = useMemo(() => {
    const folderRoutineIds = new Set(myFolders.flatMap((f) => f.routineIds));
    return myRoutines.filter((r) => !folderRoutineIds.has(r.id));
  }, [myRoutines, myFolders]);

  const displayedMyRoutines = showAllMyRoutines ? routinesNotInFolders : routinesNotInFolders.slice(0, 5);
  const displayedSharedRoutines = showAllSharedRoutines ? sharedRoutines : sharedRoutines.slice(0, 5);

  const handleRoutineClick = (routineId: string) => {
    const routine = getRoutine(routineId);
    if (!routine) {
      console.error(`Routine with ID ${routineId} not found`);
      return;
    }

    // Check if routine has a pelicoView (should always have one)
    if (!routine.pelicoView) {
      alert(`Error: Routine "${routine.name}" does not have a Pelico View associated. Please edit the routine to assign a view.`);
      return;
    }

    // Check if we're already on the correct Pelico View page
    const isOnCorrectPage = activeItem === routine.pelicoView;
    
    if (isOnCorrectPage) {
      // We're already on the correct page, just select the routine
      onRoutineClick?.(routineId);
    } else {
      // We need to navigate to the Pelico View page
      // Store routine ID in sessionStorage to auto-apply it when page loads
      sessionStorage.setItem('pendingRoutineId', routineId);
      
      // Navigate to the Pelico View page
      onNavigate?.(routine.pelicoView);
    }
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
            className={cn("space-y-1", hasMyRoutines ? "mt-1" : "mt-0.5")}
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
          <div className={cn("space-y-1", hasSharedRoutines ? "mt-1" : "mt-0.5")}>
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
                    setIsPelicoViewsExpanded(true); // Keep section open when clicking an item
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
                'w-full justify-start gap-3 h-auto py-1.5 px-3 text-sm',
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

