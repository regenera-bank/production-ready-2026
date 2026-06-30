/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|
//
// PROJECT:       Regenera Bank
// CEO:           Raphaela Cerveski
// DEVELOPER:     Don Paulo Ricardo
// ID:            2098233287
// COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
//
// LICENSE:       EULA (End-User License Agreement)
// PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
//
// WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
//                engenharia reversa ou modificação não autorizada.
//
// |---------------------------------------------------------------------------------------|
// |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
// |---------------------------------------------------------------------------------------|

import React from 'react';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const baseStyles = "relative inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neural-cyan/50 active:scale-[0.98] overflow-hidden rounded-xl";
    
    const variants = {
      primary: "bg-gradient-to-r from-neural-cyan/80 to-blue-600/80 hover:from-neural-cyan hover:to-blue-600 text-white shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] border border-neural-cyan/50",
      secondary: "bg-[#0f172a] text-white border border-white/10 hover:border-neural-cyan/50 hover:bg-white/5",
      glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10",
      danger: "bg-red-950/50 text-red-400 border border-red-500/50 hover:bg-red-900/50 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]",
      ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
    };

    const sizes = {
      sm: "text-[10px] px-4 py-2",
      md: "text-xs px-6 py-3",
      lg: "text-sm px-8 py-4",
      icon: "p-3",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          (isLoading || disabled) && "opacity-50 cursor-not-allowed active:scale-100",
          className
        )}
        {...props}
      >
        {variant === 'primary' && !disabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
        )}
        
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
