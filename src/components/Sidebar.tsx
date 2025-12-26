import React, { useState, useEffect } from 'react';
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
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem, 
  isCollapsed, 
  onToggle, 
  onNavigate,
  activeRoutineId,
  onRoutineClick,
  onLogout,
}) => {
  const [userDisplayName, setUserDisplayName] = useState('Jeremie Chaine');
  const [userEmail, setUserEmail] = useState('admin@pelico.com');
  const [userInitials, setUserInitials] = useState('JC');

  // Load user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('pelico-user-data');
    if (storedUserData) {
      try {
        const data = JSON.parse(storedUserData);
        const firstName = data.firstName?.trim() || '';
        const lastName = data.lastName?.trim() || '';
        
        if (firstName || lastName) {
          const fullName = `${firstName} ${lastName}`.trim();
          setUserDisplayName(fullName || 'Jeremie Chaine');
          // Generate initials - use first letter of firstName, then lastName, or first two letters of the name if only one is provided
          let initials = '';
          if (firstName && lastName) {
            initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
          } else if (firstName) {
            initials = firstName.substring(0, 2).toUpperCase();
          } else if (lastName) {
            initials = lastName.substring(0, 2).toUpperCase();
          }
          setUserInitials(initials || 'JC');
          
          // Generate email from firstName and lastName: [prenom][nom]@pelico.io
          const emailFirstName = firstName.toLowerCase().replace(/\s+/g, '') || 'jeremie';
          const emailLastName = lastName.toLowerCase().replace(/\s+/g, '') || 'chaine';
          const generatedEmail = `${emailFirstName}${emailLastName}@pelico.io`;
          setUserEmail(generatedEmail);
        } else {
          setUserDisplayName('Jeremie Chaine');
          setUserInitials('JC');
          setUserEmail('jeremiechaine@pelico.io');
        }
      } catch {
        // Invalid stored data, use defaults
        setUserDisplayName('Jeremie Chaine');
        setUserInitials('JC');
        setUserEmail('jeremiechaine@pelico.io');
      }
    } else {
      // No user data, use defaults
      setUserDisplayName('Jeremie Chaine');
      setUserInitials('JC');
      setUserEmail('jeremiechaine@pelico.io');
    }
  }, []);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'simulation', label: 'Simulation Basket', icon: ShoppingCart },
  ];

  // Items that should always be visible
  const alwaysVisibleItems = ['home', 'simulation'];
  
  // Items that are now managed by Pelico Views section (removed from hideable items)
  // These are: supply, production, mro, customer, planning, analytics, upload, config, users, scope-routines, my-routines, shared-routines, settings

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
                      activeItem={activeItem}
                      onNavigate={onNavigate}
                    />
                  )}
                </React.Fragment>
              );
            })}
        </nav>
      </div>
      
      {/* User profile footer */}
      <div className="border-t p-4 bg-background">
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-sm shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-sm truncate">{userDisplayName}</div>
              <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onLogout?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onLogout?.();
              }
            }}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Settings className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
