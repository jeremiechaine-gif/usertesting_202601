/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '@/components/ui/popover' {
  import * as React from 'react';
  export const Popover: React.ComponentType<any>;
  export const PopoverTrigger: React.ComponentType<any>;
  export const PopoverContent: React.ForwardRefExoticComponent<any>;
  export const PopoverAnchor: React.ComponentType<any>;
}

declare module '@/components/ui/tooltip' {
  import * as React from 'react';
  export const Tooltip: React.ComponentType<any>;
  export const TooltipTrigger: React.ComponentType<any>;
  export const TooltipContent: React.ForwardRefExoticComponent<any>;
  export const TooltipProvider: React.ComponentType<any>;
}

declare module './tooltip' {
  import * as React from 'react';
  export const Tooltip: React.ComponentType<any>;
  export const TooltipTrigger: React.ComponentType<any>;
  export const TooltipContent: React.ForwardRefExoticComponent<any>;
  export const TooltipProvider: React.ComponentType<any>;
}
