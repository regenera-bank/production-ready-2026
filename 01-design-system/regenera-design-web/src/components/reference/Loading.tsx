/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { BrainCircuit } from 'lucide-react';

interface LoadingProps {
  status: string;
}

const Loading: React.FC<LoadingProps> = ({ status }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="relative w-24 h-24 mb-6">
            {/* Spinning Rings */}
            <div className="absolute inset-0 border-2 border-t-cyan-aurora border-r-transparent border-b-cyan-electric border-l-transparent rounded-full animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-2 border-2 border-t-transparent border-r-emerald-life border-b-transparent border-l-emerald-life rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
            
            {/* Central Pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-cyan-electric/20 rounded-full blur-md animate-pulse"></div>
                <BrainCircuit className="absolute w-8 h-8 text-cyan-aurora animate-pulse" />
            </div>
        </div>
        
        <p className="text-cyan-aurora font-mono text-sm tracking-widest uppercase animate-pulse">
            {status}
        </p>
    </div>
  );
};

export default Loading;