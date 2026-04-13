import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error' | 'ghost' | 'surface';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95',
      secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary/20 active:scale-95',
      error: 'bg-error-container text-on-error-container hover:bg-error/20 active:scale-95',
      ghost: 'bg-transparent hover:bg-surface-container-low text-on-surface-variant',
      surface: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:scale-95',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs font-bold',
      md: 'px-6 py-3 text-sm font-bold',
      lg: 'px-8 py-4 text-base font-bold',
      icon: 'p-3 rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          size === 'icon' ? 'rounded-full' : sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
