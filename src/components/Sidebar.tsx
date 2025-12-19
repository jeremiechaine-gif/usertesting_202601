import React, { useState } from 'react';
import { Home, AlertTriangle, ShoppingCart, Package, Wrench, Headphones, BarChart3, Upload, Settings, Users, ChevronLeft, FolderKanban, UserCircle, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SidebarRoutines } from './SidebarRoutines';

interface SidebarProps {
  activeItem: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate?: (page: string) => void;
  activeRoutineId?: string | null;
  onRoutineClick?: (routineId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem, 
  isCollapsed, 
  onToggle, 
  onNavigate,
  activeRoutineId,
  onRoutineClick,
}) => {
  const [areItemsHidden, setAreItemsHidden] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'escalation', label: 'Escalation Room', icon: AlertTriangle },
    { id: 'simulation', label: 'Simulation Basket', icon: ShoppingCart },
    { id: 'supply', label: 'Supply', icon: Package },
    { id: 'production', label: 'Production Control', icon: Wrench },
    { id: 'mro', label: 'MRO', icon: Wrench },
    { id: 'customer', label: 'Customer Support', icon: Headphones },
    { id: 'planning', label: 'Planning', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'config', label: 'Config Editor', icon: Settings },
    { id: 'users', label: 'Teams & members', icon: Users },
    { id: 'scope-routines', label: 'Scope & Routines', icon: FolderKanban },
    { id: 'my-routines', label: 'My Routines', icon: UserCircle },
    { id: 'shared-routines', label: 'Shared Routines', icon: UsersRound },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Items that should always be visible
  const alwaysVisibleItems = ['home', 'escalation', 'simulation'];
  
  // Items that can be hidden (under SHARED ROUTINES)
  const hideableItems = menuItems.filter(item => !alwaysVisibleItems.includes(item.id));

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="w-64 bg-muted/50 border-r flex flex-col h-screen transition-all duration-300 ease-in-out">
      {/* Logo/Brand area */}
      <div className="px-6 py-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/images/Pelico-long-logo.svg" 
            alt="Pelico" 
            className="h-8 shrink-0"
          />
        </div>
        
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onToggle}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {/* Always visible items */}
          {menuItems
            .filter(item => alwaysVisibleItems.includes(item.id))
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              const isSimulation = item.id === 'simulation';
              
              return (
                <React.Fragment key={item.id}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3',
                      isActive && 'bg-[#31C7AD] text-white hover:bg-[#2ab89a]'
                    )}
                    onClick={() => onNavigate?.(item.id)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </Button>
                  {/* Insert routines sections after Simulation Basket */}
                  {isSimulation && (
                    <SidebarRoutines 
                      activeRoutineId={activeRoutineId}
                      onRoutineClick={onRoutineClick}
                    />
                  )}
                </React.Fragment>
              );
            })}
          
          {/* Hideable items with animation */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out overflow-hidden',
              areItemsHidden ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
            )}
          >
            {hideableItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-[#31C7AD] text-white hover:bg-[#2ab89a]'
                  )}
                  onClick={() => onNavigate?.(item.id)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </nav>
      </div>
      
      {/* User profile footer */}
      <div className="border-t p-4 bg-background">
        <button
          onClick={() => setAreItemsHidden(!areItemsHidden)}
          className="w-full flex items-center gap-3 hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-sm shrink-0">
            AP
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="font-semibold text-sm truncate">Admin Pelico</div>
            <div className="text-xs text-muted-foreground truncate">admin@pelico.com</div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Settings className="w-4 h-4" />
          </Button>
        </button>
      </div>
    </div>
  );
};
