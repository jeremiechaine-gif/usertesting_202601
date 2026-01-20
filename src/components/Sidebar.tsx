import React, { useState, useEffect } from 'react';
import { Home, AlertTriangle, ShoppingCart, Package, Wrench, Headphones, BarChart3, Upload, Settings, Users, ChevronLeft, FolderKanban, UserCircle, UsersRound, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SidebarRoutines } from './SidebarRoutines';
import { SearchModal } from './SearchModal';

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
  const [searchModalOpen, setSearchModalOpen] = useState(false);

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
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'simulation', label: 'Panier de simulation', icon: ShoppingCart },
  ];

  // Items that should always be visible
  const alwaysVisibleItems = ['home', 'simulation'];
  
  // Items that are now managed by Pelico Views section (removed from hideable items)
  // These are: supply, production, mro, customer, planning, analytics, upload, config, users, scope-routines, my-routines, shared-routines, settings

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="w-64 bg-muted/50 flex flex-col h-screen transition-all duration-300 ease-in-out">
      {/* Logo/Brand area */}
      <div className="px-6 py-5 flex items-center">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img 
            src="/images/Pelico-long-logo.svg" 
            alt="Pelico" 
            className="h-8 shrink-0"
          />
        </div>
        
        {/* Toggle button */}
        <button
          onClick={onToggle}
          aria-label="Réduire la barre latérale"
          className="shrink-0 ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 py-3 bg-background/80 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            onClick={() => setSearchModalOpen(true)}
            readOnly
            className="pl-9 pr-20 cursor-pointer"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
              {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">K</kbd>
          </div>
        </div>
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
                      'w-full justify-start gap-3 rounded-md',
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
      <div className="p-4 bg-muted/50">
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

      {/* Search Modal */}
      <SearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onNavigate={onNavigate}
        onRoutineClick={onRoutineClick}
      />
    </div>
  );
};
