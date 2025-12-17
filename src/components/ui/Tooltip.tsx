import React, { useState } from 'react';

interface TooltipProps {
  title: string;
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({ title, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap bottom-full left-1/2 -translate-x-1/2 mb-1">
          {title}
        </div>
      )}
    </div>
  );
};

