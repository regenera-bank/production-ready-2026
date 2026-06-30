
import React from 'react';
import { cn } from '@/foundation/utils';

interface CardGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'neural' | 'alert' | 'success';
  glow?: boolean;
}

export const CardGlass: React.FC<CardGlassProps> = ({ 
  children, 
  className, 
  variant = 'default',
  glow = false,
  ...props 
}) => {
  const variants = {
    default: "bg-white/5 border-white/10",
    neural: "bg-indigo-950/30 border-neural-cyan/30",
    alert: "bg-amber-950/20 border-amber-500/30",
    success: "bg-emerald-950/20 border-emerald-500/30"
  };

  const glows = {
    default: "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
    neural: "shadow-[0_0_30px_rgba(0,240,255,0.15)]",
    alert: "shadow-[0_0_30px_rgba(245,158,11,0.1)]",
    success: "shadow-[0_0_30px_rgba(16,185,129,0.1)]"
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden backdrop-blur-xl border rounded-[32px] p-6 transition-all duration-500",
        variants[variant],
        glow && glows[variant],
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
