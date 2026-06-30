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

/**
 * REGENERA BANK · ENTERPRISE v4.0
 * Neural Orb Component
 * Floating action button to summon the Neural Sync.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../shared/lib/store';

export const NeuralOrb: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  // Only show if user is authenticated
  if (!isAuthenticated) return null;

  return (
    <button 
      onClick={() => navigate('/neural')} 
      className="fixed bottom-24 right-6 z-40 w-16 h-16 group outline-none"
    >
      <div className="absolute inset-0 rounded-full border-[1px] border-indigo-400 border-dashed opacity-40 animate-spin" style={{ transform: 'rotateX(70deg)', animationDuration: '8s' }} />
      <div className="absolute inset-1 rounded-full border-[1px] border-cyan-400/50 border-dotted opacity-30 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
      
      <div className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_60px_rgba(99,102,241,0.8)] transition-shadow duration-500 bg-[#020617]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-[#020617] to-black opacity-90 animate-pulse" />
        <div className="absolute -top-6 -left-6 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl" />
        <span className="relative z-10 text-2xl font-serif font-bold italic text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)] group-hover:scale-110 transition-transform">
          R
        </span>
      </div>
    </button>
  );
};
