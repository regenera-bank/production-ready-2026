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
 * Voice Wave Visualization
 * Visualizes audio input/output for Neural conversations.
 */
import React from 'react';

interface VoiceWaveProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export const VoiceWave: React.FC<VoiceWaveProps> = ({ isListening, isSpeaking }) => {
  const bars = Array.from({ length: 9 });

  const active = isListening || isSpeaking;
  const colorClass = isSpeaking ? 'bg-indigo-400 shadow-indigo-400/50' : 'bg-cyan-400 shadow-cyan-400/50';

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((_, i) => (
        <div 
          key={i} 
          className={`w-1.5 rounded-full transition-all duration-150 ${
            active ? colorClass : 'bg-white/10 h-2'
          }`}
          style={{
            height: active ? `${Math.max(20, Math.random() * 100)}%` : '8px',
            animation: active ? `pulse 1s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};
