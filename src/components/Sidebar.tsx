import React from 'react';
import { Home, AlertTriangle, ShoppingCart, Package, Wrench, Headphones, BarChart3, Upload, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeItem: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem }) => {
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
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-muted/50 border-r flex flex-col h-screen">
      {/* Logo/Brand area */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
            P
          </div>
          <span className="text-lg font-bold">PELICO</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                asChild
              >
                <a href="#">
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                </a>
              </Button>
            );
          })}
        </nav>
      </div>
      
      {/* User profile footer */}
      <div className="border-t p-4 bg-background">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-sm">
            AP
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">Admin Pelico</div>
            <div className="text-xs text-muted-foreground truncate">admin@pelico.com</div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
