/**
 * Guided Modal Styles
 * Reusable styles and components for guided modals (like ScopeModal)
 * This ensures consistency across the application
 */

import { Target, Info, X } from 'lucide-react';
import { Button } from './button';
import { Label } from './label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

/**
 * Guided Modal Header Props
 */
export interface GuidedModalHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  showInfoIcon?: boolean;
  infoTooltip?: string;
}

/**
 * Guided Modal Header Component
 * Provides consistent header styling for guided modals
 */
export const GuidedModalHeader: React.FC<GuidedModalHeaderProps> = ({
  title,
  description,
  icon = <Target className="h-5 w-5 text-[#31C7AD]" />,
  showInfoIcon = false,
  infoTooltip,
}) => {
  return (
    <div className="px-6 py-3 border-b bg-gradient-to-br from-[#31C7AD]/5 via-[#2063F0]/5 to-transparent">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#31C7AD]/10 to-[#2063F0]/10 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {showInfoIcon && infoTooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Information"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{infoTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Info Section Props
 */
export interface InfoSectionProps {
  content: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
}

/**
 * Info Section Component
 * Displays informational content with optional close button
 */
export const InfoSection: React.FC<InfoSectionProps> = ({
  content,
  onClose,
  showCloseButton = true,
}) => {
  return (
    <div className="relative rounded-lg border border-[#31C7AD]/20 bg-gradient-to-r from-[#31C7AD]/5 via-[#31C7AD]/3 to-transparent p-4 mb-4">
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close information"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="flex items-start gap-3 pr-6">
        <div className="p-1.5 rounded-md bg-[#31C7AD]/10 shrink-0 mt-0.5">
          <Info className="h-4 w-4 text-[#31C7AD]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm leading-relaxed text-foreground">{content}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Guided Form Field Props
 */
export interface GuidedFormFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
  infoSection?: React.ReactNode;
}

/**
 * Guided Form Field Component
 * Provides consistent form field styling for guided modals
 */
export const GuidedFormField: React.FC<GuidedFormFieldProps> = ({
  label,
  required = false,
  description,
  children,
  infoSection,
}) => {
  return (
    <div className="space-y-2">
      {infoSection}
      <Label className="text-sm font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {description && (
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
      )}
      {children}
    </div>
  );
};

