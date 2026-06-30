
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface VoiceWaveProps {
  isActive: boolean;
}

const VoiceWave: React.FC<VoiceWaveProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-1 bg-cyan-400 rounded-full animate-[music_1s_ease-in-out_infinite]"
          style={{
            height: '10%',
            animationDelay: `${i * 0.1}s`,
            animationPlayState: isActive ? 'running' : 'paused'
          }}
        ></div>
      ))}
      <style>{`
        @keyframes music {
          0%, 100% { height: 10%; opacity: 0.5; }
          50% { height: 100%; opacity: 1; box-shadow: 0 0 10px #22d3ee; }
        }
      `}</style>
    </div>
  );
};

export default VoiceWave;
