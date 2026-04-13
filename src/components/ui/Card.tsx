import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hoverable, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high/30 transition-all duration-300',
        hoverable && 'hover:shadow-md hover:border-primary/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
