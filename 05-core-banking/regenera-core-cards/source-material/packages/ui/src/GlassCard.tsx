/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: UI Components
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] packages/ui/src/GlassCard.tsx
import React, { type ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  onClick?: () => void;
  hoverEffect?: boolean;
  className?: string;
}

/**
 * A reusable glassmorphism card component.
 * It provides a consistent frosted-glass effect for UI elements.
 * All styling is self-contained.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  onClick,
  hoverEffect = false,
  className = '',
}) => {
  const baseClasses = 'glass rounded-2xl transition-all';
  const hoverClasses = hoverEffect ? 'hover:bg-white/5 cursor-pointer' : '';
  
  const combinedClasses = `${baseClasses} ${hoverClasses} ${className}`;

  return (
    <div onClick={onClick} className={combinedClasses}>
      {children}
    </div>
  );
};

/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
