import React from 'react';

interface PopoverProps {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({ open, anchor, children }) => {
  if (!open || !anchor) return null;
  
  const rect = anchor.getBoundingClientRect();
  
  return (
    <div
      className="absolute z-50 bg-white border border-[var(--color-border-default)] rounded-md shadow-lg p-2"
      style={{
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

