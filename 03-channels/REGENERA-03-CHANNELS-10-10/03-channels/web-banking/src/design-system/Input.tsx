
import React from 'react';
import { cn } from '@/foundation/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold ml-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 outline-none transition-all duration-300",
              "focus:bg-white/10 focus:border-neural-cyan/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.15)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon ? "pl-12 pr-4 py-4" : "px-4 py-4",
              error && "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)]",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold ml-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
