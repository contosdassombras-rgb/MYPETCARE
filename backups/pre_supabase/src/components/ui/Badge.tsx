import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'pending' | 'error' | 'surface';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'surface', children, ...props }) => {
  const variants = {
    success: 'bg-primary-container text-primary',
    pending: 'bg-secondary-container text-on-secondary-container',
    error: 'bg-error-container text-on-error-container',
    surface: 'bg-surface-container-high text-on-surface-variant',
  };

  const dots = {
    success: 'bg-primary',
    pending: 'bg-secondary',
    error: 'bg-error',
    surface: 'bg-on-surface-variant/40',
  };

  return (
    <div
      className={cn(
        'px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider h-fit',
        variants[variant],
        className
      )}
      {...props}
    >
      <div className={cn('w-1.5 h-1.5 rounded-full', dots[variant])} />
      {children}
    </div>
  );
};
