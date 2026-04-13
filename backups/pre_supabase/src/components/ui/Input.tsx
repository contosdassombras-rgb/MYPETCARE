import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full p-4 bg-surface-container-low rounded-xl border border-transparent focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest outline-none transition-all placeholder:text-on-surface-variant/40',
            error && 'border-error ring-error ring-1',
            className
          )}
          {...props}
        />
        {error && <span className="text-[10px] text-error font-medium ml-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full p-4 bg-surface-container-low rounded-xl border border-transparent focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest outline-none transition-all placeholder:text-on-surface-variant/40 min-h-[100px]',
            error && 'border-error ring-error ring-1',
            className
          )}
          {...props}
        />
        {error && <span className="text-[10px] text-error font-medium ml-1">{error}</span>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
